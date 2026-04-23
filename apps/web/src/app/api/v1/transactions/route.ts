import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'

/**
 * GET /api/v1/transactions?limit=200
 *
 * Global transaction feed across every agent the indexer has seen.
 * De-duped by `tx_hash` (a single cross-party transfer surfaces once,
 * attributed to either side — `agent_id` tells you which). Sorted
 * newest-first by `block_timestamp`, capped at `limit` (max 500).
 *
 * Used by the Explorer page's activity chart and transaction log — the
 * chart was previously wired to a hardcoded list of 8 agent IDs, which
 * made new activity from any other agent invisible.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const limit = Math.min(
      500,
      Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? '200')),
    )

    // DISTINCT ON (tx_hash) keeps one row per on-chain tx even when both
    // the sender and receiver are registered agents (two rows in the
    // local table). We pick the incoming-direction row when available
    // so the counterparty column reads naturally.
    const rows = (await sql`
      SELECT DISTINCT ON (tx_hash)
        tx_hash,
        agent_id,
        wallet_address,
        direction,
        counterparty,
        value_eth::text   AS value_eth,
        value_usd::text   AS value_usd,
        token_symbol,
        block_number::text AS block_number,
        block_timestamp::text AS block_timestamp,
        label,
        company_id
      FROM transactions
      ORDER BY tx_hash, CASE WHEN direction = 'incoming' THEN 0 ELSE 1 END
    `) as Array<{
      tx_hash: string
      agent_id: string
      wallet_address: string
      direction: string
      counterparty: string
      value_eth: string
      value_usd: string | null
      token_symbol: string | null
      block_number: string
      block_timestamp: string
      label: string | null
      company_id: string | null
    }>

    rows.sort(
      (a, b) =>
        new Date(b.block_timestamp).getTime() -
        new Date(a.block_timestamp).getTime(),
    )

    return NextResponse.json({
      data: rows.slice(0, limit),
      total: rows.length,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
