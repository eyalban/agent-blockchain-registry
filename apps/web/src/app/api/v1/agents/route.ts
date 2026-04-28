import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { publicClient } from '@/lib/viem-client'
import { identityRegistryAbi, IDENTITY_REGISTRY_ADDRESS } from '@agent-registry/shared'
import { fetchJsonMetadata } from '@/lib/ipfs-fetch'
import { discoverWrapperRegistrations } from '@/lib/wrapper-discovery'

interface AgentCard {
  name?: unknown
  description?: unknown
  image?: unknown
}

/**
 * Resolve an agent card from a tokenURI. Handles both the inline
 * `data:application/json;base64,…` form (legacy) and the `ipfs://…`
 * form used by the framework's Path A/B/C uploads. Returns null if
 * the metadata can't be fetched or parsed.
 */
async function resolveAgentCard(tokenURI: string): Promise<AgentCard | null> {
  if (tokenURI.startsWith('data:application/json;base64,')) {
    try {
      const json = Buffer.from(tokenURI.split(',')[1] ?? '', 'base64').toString()
      return JSON.parse(json) as AgentCard
    } catch {
      return null
    }
  }
  return await fetchJsonMetadata<AgentCard>(tokenURI)
}

/**
 * GET /api/v1/agents?page=1&pageSize=20
 *
 * Lists every agent we know about: ones with a wallet linked in our
 * `agent_wallets` dictionary OR ones that are an active member of a
 * registered company. The IdentityRegistry is the canonical ERC-8004
 * contract shared across the whole Base Sepolia ecosystem, so we never
 * scan it directly — agents arrive in `agent_wallets` via the wrapper
 * event indexer (see `discoverWrapperRegistrations`), which only
 * reacts to registrations through our own AgentRegistryWrapper.
 *
 * Each row is enriched with on-chain data (`ownerOf`, `tokenURI`)
 * from the canonical IdentityRegistry.
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

    // De-duped union of agents with linked wallets and active company
    // members. Sort by numeric agentId DESC so the latest registrations
    // land on page 1 — the UI fetches one page and we want a fresh
    // registration to appear without the user paginating.
    const [rows, countRows] = await Promise.all([
      sql`
        SELECT agent_id FROM (
          SELECT agent_id FROM agent_wallets
          UNION
          SELECT agent_id FROM company_members WHERE removed_at IS NULL
        ) AS distinct_agents
        ORDER BY agent_id::numeric DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) as count FROM (
          SELECT agent_id FROM agent_wallets
          UNION
          SELECT agent_id FROM company_members WHERE removed_at IS NULL
        ) AS distinct_agents
      `,
    ])

    // Enrich every agent in parallel — sequential awaits across 30+ agents
    // multiplied IPFS-gateway round-trips into a 30–60s wall clock.
    const enriched = await Promise.all(
      rows.map(async (row) => {
        const agentId = (row as { agent_id: string }).agent_id
        try {
          const [owner, tokenURI] = await Promise.all([
            publicClient.readContract({
              address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
              abi: identityRegistryAbi,
              functionName: 'ownerOf',
              args: [BigInt(agentId)],
            }),
            publicClient.readContract({
              address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
              abi: identityRegistryAbi,
              functionName: 'tokenURI',
              args: [BigInt(agentId)],
            }),
          ])

          const card = await resolveAgentCard(tokenURI as string)

          return {
            agentId,
            owner: owner as string,
            tokenURI: tokenURI as string,
            name: card && typeof card.name === 'string' ? card.name : null,
            description:
              card && typeof card.description === 'string' ? card.description : null,
            image: card && typeof card.image === 'string' ? card.image : null,
          }
        } catch {
          // Agent may not exist on-chain anymore (burned / wrong chain).
          return null
        }
      }),
    )

    const agents = enriched.filter(
      (a): a is NonNullable<typeof a> => a !== null,
    )

    const total = Number((countRows[0] as { count: string }).count)

    return NextResponse.json({
      data: agents,
      page,
      pageSize,
      total,
      hasMore: offset + agents.length < total,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
