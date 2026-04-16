import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

/**
 * GET /api/v1/stats
 *
 * Returns stats from our database — only counts real agents
 * that have linked wallets (not the entire global registry).
 */
export async function GET(): Promise<NextResponse> {
  try {
    const [agentRows, txRows] = await Promise.all([
      sql`SELECT COUNT(DISTINCT agent_id) as count FROM agent_wallets`,
      sql`SELECT COUNT(*) as count FROM transactions`,
    ])

    const totalAgents = Number((agentRows[0] as { count: string }).count)
    const totalTransactions = Number((txRows[0] as { count: string }).count)

    return NextResponse.json({
      totalAgents,
      totalTransactions,
      network: 'base-sepolia',
      chainId: 84532,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
