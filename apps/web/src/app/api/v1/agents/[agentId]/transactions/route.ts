import { NextResponse } from 'next/server'
import { getTransactionsByAgent, updateTransactionLabel } from '@/lib/db'

interface RouteParams {
  params: Promise<{ agentId: string }>
}

/**
 * GET /api/v1/agents/:agentId/transactions?label=revenue
 * Returns labeled transactions for an agent.
 */
export async function GET(req: Request, { params }: RouteParams): Promise<NextResponse> {
  const { agentId } = await params
  const { searchParams } = new URL(req.url)
  const label = searchParams.get('label') ?? undefined

  const transactions = await getTransactionsByAgent(agentId, label)
  return NextResponse.json({ agentId, transactions, count: transactions.length })
}

/**
 * PATCH /api/v1/agents/:agentId/transactions
 * Relabel a transaction (manual override).
 */
export async function PATCH(req: Request, { params }: RouteParams): Promise<NextResponse> {
  const { agentId } = await params
  const body = (await req.json()) as { txHash?: string; label?: string }

  if (!body.txHash || !body.label) {
    return NextResponse.json(
      { error: 'txHash and label required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }

  await updateTransactionLabel(body.txHash, body.label)
  return NextResponse.json({ success: true, agentId, txHash: body.txHash, label: body.label })
}
