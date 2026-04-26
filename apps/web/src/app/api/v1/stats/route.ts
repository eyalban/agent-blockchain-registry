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
 */
export async function GET(): Promise<NextResponse> {
  try {
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

    const totalAgents = Number((agentRows[0] as { count: string }).count)
    const totalCompanies = Number((companyRows[0] as { count: string }).count)
    const totalTransactions = Number((txRows[0] as { count: string }).count)

    return NextResponse.json({
      totalAgents,
      totalCompanies,
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
