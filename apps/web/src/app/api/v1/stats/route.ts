import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

/**
 * GET /api/v1/stats
 *
 * Returns counts sourced from our local mirror of on-chain state.
 *
 * `totalAgents` is the count of distinct agent IDs that we know about
 * — either because they have a wallet linked in our `agent_wallets`
 * dictionary, or because they are an active member of a registered
 * company. The IdentityRegistry is shared across the whole Base Sepolia
 * ecosystem, so we deliberately do NOT count every on-chain mint here.
 *
 * `totalCompanies` counts every row in `companies` (every confirmed
 * `CompanyCreated` event).
 *
 * Process-local TTL cache. Stats change at human pace (a few writes
 * per hour at most), so a 60s window is invisible to viewers but
 * eliminates ~3 SQL aggregates per home-page load.
 */
interface StatsPayload {
  totalAgents: number
  totalCompanies: number
  totalTransactions: number
  network: string
  chainId: number
}
const STATS_TTL_MS = 60_000
let statsCache: { at: number; payload: StatsPayload } | null = null

async function loadStats(): Promise<StatsPayload> {
  const [agentRows, companyRows, txRows] = await Promise.all([
    sql`
      SELECT COUNT(*) as count FROM (
        SELECT agent_id FROM agent_wallets
        UNION
        SELECT agent_id FROM company_members WHERE removed_at IS NULL
      ) AS distinct_agents
    `,
    sql`SELECT COUNT(*) as count FROM companies`,
    sql`SELECT COUNT(*) as count FROM transactions`,
  ])
  return {
    totalAgents: Number((agentRows[0] as { count: string }).count),
    totalCompanies: Number((companyRows[0] as { count: string }).count),
    totalTransactions: Number((txRows[0] as { count: string }).count),
    network: 'base-sepolia',
    chainId: 84532,
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const now = Date.now()
    if (statsCache && now - statsCache.at < STATS_TTL_MS) {
      return NextResponse.json(statsCache.payload, {
        headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=120' },
      })
    }
    const payload = await loadStats()
    statsCache = { at: now, payload }
    return NextResponse.json(payload, {
      headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=120' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
