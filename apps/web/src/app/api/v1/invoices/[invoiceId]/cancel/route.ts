import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { invoiceRegistryAbi } from '@agent-registry/shared'

import { markInvoiceCancelled } from '@/lib/db'
import { env } from '@/lib/env'
import {
  EventVerificationError,
  errorToResponse,
  verifyTxEvent,
} from '@/lib/event-verify'
import { publicClient } from '@/lib/viem-client'

interface RouteParams {
  params: Promise<{ invoiceId: string }>
}

const bodySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
})

/**
 * POST /api/v1/invoices/:invoiceId/cancel
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { invoiceId } = await params
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
      contractAddress: env.invoiceRegistryAddress,
      abi: invoiceRegistryAbi,
      eventName: 'InvoiceCancelled',
    })
    const eventId = String(verified.args.id as bigint)
    if (eventId !== invoiceId) {
      return NextResponse.json(
        { error: 'Event invoiceId does not match path', code: 'MISMATCH' },
        { status: 400 },
      )
    }

    const block = await (publicClient as typeof publicClient).getBlock({
      blockNumber: BigInt(verified.blockNumber),
    })

    await markInvoiceCancelled({
      invoiceId,
      cancelledAt: new Date(Number(block.timestamp) * 1000).toISOString(),
      cancelledTxHash: parsed.data.txHash,
    })

    return NextResponse.json({ invoiceId, status: 'cancelled' })
  } catch (err) {
    if (err instanceof EventVerificationError) {
      const { status, body } = errorToResponse(err)
      return NextResponse.json(body, { status })
    }
    console.error('invoice cancel POST', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL' },
      { status: 500 },
    )
  }
}
