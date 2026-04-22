import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { companyRegistryAbi } from '@agent-registry/shared'

import { removeCompanyTreasury } from '@/lib/db'
import { env } from '@/lib/env'
import {
  EventVerificationError,
  errorToResponse,
  verifyTxEvent,
} from '@/lib/event-verify'

interface RouteParams {
  params: Promise<{ companyId: string; address: string }>
}

const bodySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
})

/**
 * DELETE /api/v1/companies/:companyId/treasuries/:address
 * Body: { txHash } — verifies TreasuryRemoved event.
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { companyId, address } = await params
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { error: 'Invalid address', code: 'VALIDATION' },
      { status: 400 },
    )
  }

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
      eventName: 'TreasuryRemoved',
    })

    const eventCompanyId = String(verified.args.companyId as bigint)
    const eventTreasury = (verified.args.treasury as string).toLowerCase()
    if (eventCompanyId !== companyId || eventTreasury !== address.toLowerCase()) {
      return NextResponse.json(
        { error: 'Event args do not match path', code: 'MISMATCH' },
        { status: 400 },
      )
    }

    await removeCompanyTreasury({
      companyId,
      address: eventTreasury,
      removedTxHash: parsed.data.txHash,
    })

    return NextResponse.json({ companyId, address: eventTreasury, removed: true })
  } catch (err) {
    if (err instanceof EventVerificationError) {
      const { status, body } = errorToResponse(err)
      return NextResponse.json(body, { status })
    }
    console.error('treasury DELETE error', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL' },
      { status: 500 },
    )
  }
}
