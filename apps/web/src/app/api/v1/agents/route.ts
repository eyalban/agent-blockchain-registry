import { NextResponse } from 'next/server'

import { getAgentsPage } from '@/lib/agents-cache'
import { discoverWrapperRegistrations } from '@/lib/wrapper-discovery'

/**
 * GET /api/v1/agents?page=1&pageSize=20
 *
 * Lists every agent we know about: ones with a row in `agents_cache`,
 * a wallet linked in our `agent_wallets` dictionary, or active company
 * membership. Each row is enriched with on-chain owner + tokenURI and
 * the resolved agent-card metadata (name, description, image), with all
 * of those persisted in `agents_cache` so the warm path is a single SQL
 * query — no RPC calls, no IPFS gateway round-trips.
 *
 * Sorted by numeric agentId DESC so the latest registrations land on
 * page 1 — the UI fetches one page and we want a fresh registration to
 * appear without the user paginating.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? '20')))
    const offset = (page - 1) * pageSize

    // Best-effort: pull any new wrapper registrations into agent_wallets.
    // Fire-and-forget so a fresh sweep never blocks the listing response —
    // the function is internally throttled to 30s so stragglers land in
    // the next refresh.
    void discoverWrapperRegistrations()

    const { data, total } = await getAgentsPage(pageSize, offset)

    return NextResponse.json({
      data,
      page,
      pageSize,
      total,
      hasMore: offset + data.length < total,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
