import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { companyRegistryAbi } from '@agent-registry/shared'

import { addCompanyMember } from '@/lib/db'
import { env } from '@/lib/env'
import {
  EventVerificationError,
  errorToResponse,
  verifyTxEvent,
} from '@/lib/event-verify'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

const bodySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
})

/**
 * POST /api/v1/companies/:companyId/members
 * Body: { txHash } — the tx that called CompanyRegistry.addAgent.
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { companyId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body must be JSON', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  try {
    const verified = await verifyTxEvent({
      txHash: parsed.data.txHash as `0x${string}`,
      contractAddress: env.companyRegistryAddress,
      abi: companyRegistryAbi,
      eventName: 'AgentAdded',
    })

    const eventCompanyId = String(verified.args.companyId as bigint)
    if (eventCompanyId !== companyId) {
      return NextResponse.json(
        { error: 'Event companyId does not match path', code: 'MISMATCH' },
        { status: 400 },
      )
    }

    const agentId = String(verified.args.agentId as bigint)
    await addCompanyMember({
      companyId,
      agentId,
      addedTxHash: parsed.data.txHash,
    })

    return NextResponse.json({ companyId, agentId })
  } catch (err) {
    if (err instanceof EventVerificationError) {
      const { status, body } = errorToResponse(err)
      return NextResponse.json(body, { status })
    }
    console.error('members POST error', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL' },
      { status: 500 },
    )
  }
}
