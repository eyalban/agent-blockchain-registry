import { NextResponse, type NextRequest } from 'next/server'

import { getTxValidations, reconcileTx } from '@/lib/tx-reconciler'

interface RouteParams {
  params: Promise<{ txHash: string }>
}

/**
 * GET /api/v1/transactions/:txHash/validations
 * Returns the counterparty reconciliation results for this tx.
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { txHash } = await params
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return NextResponse.json(
      { error: 'Invalid tx hash', code: 'VALIDATION' },
      { status: 400 },
    )
  }
  const rows = await getTxValidations(txHash)
  return NextResponse.json({
    txHash,
    validations: rows.map((r) => ({
      selfAgentId: r.self_agent_id,
      otherAgentId: r.other_agent_id,
      selfLabel: r.self_label,
      otherLabel: r.other_label,
      status: r.status,
      note: r.note,
      validatedAt: r.validated_at,
    })),
  })
}

/**
 * POST /api/v1/transactions/:txHash/validations
 * Triggers an on-demand reconciliation of this tx.
 */
export async function POST(
  _req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { txHash } = await params
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return NextResponse.json(
      { error: 'Invalid tx hash', code: 'VALIDATION' },
      { status: 400 },
    )
  }
  const results = await reconcileTx(txHash)
  return NextResponse.json({ txHash, results })
}
