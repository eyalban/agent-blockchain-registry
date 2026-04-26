import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { publicClient } from '@/lib/viem-client'
import { identityRegistryAbi, IDENTITY_REGISTRY_ADDRESS } from '@agent-registry/shared'
import { fetchJsonMetadata } from '@/lib/ipfs-fetch'
import { discoverNewAgents } from '@/lib/agent-discovery'

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
 * `agent_wallets` dictionary, ones that are an active member of a
 * registered company, OR ones discovered on-chain via the canonical
 * IdentityRegistry's `Registered` event log. The third source guarantees
 * agents that registered through the public framework repo (which mints
 * directly on the IdentityRegistry without ever calling our API) still
 * surface in the listing.
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

    // Best-effort: pull any new on-chain registrations into discovered_agents
    // before reading. Throttled internally so most calls are no-ops.
    await discoverNewAgents()

    // De-duped union of agents with linked wallets, active company members,
    // and on-chain discoveries. Sort by numeric agentId DESC so the latest
    // registrations land on page 1 — the UI fetches one page and we want
    // a freshly-registered agent to appear without the user paginating.
    const rows = await sql`
      SELECT agent_id FROM (
        SELECT agent_id FROM agent_wallets
        UNION
        SELECT agent_id FROM company_members WHERE removed_at IS NULL
        UNION
        SELECT agent_id FROM discovered_agents
      ) AS distinct_agents
      ORDER BY agent_id::numeric DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `

    const agents: Array<{
      agentId: string
      owner: string
      tokenURI: string
      name: string | null
      description: string | null
      image: string | null
      wallets: string[]
    }> = []

    for (const row of rows) {
      const agentId = (row as { agent_id: string }).agent_id
      try {
        const [owner, tokenURI, walletRows] = await Promise.all([
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
          sql`SELECT wallet_address FROM agent_wallets WHERE agent_id = ${agentId}`,
        ])

        const card = await resolveAgentCard(tokenURI as string)

        agents.push({
          agentId,
          owner: owner as string,
          tokenURI: tokenURI as string,
          name: card && typeof card.name === 'string' ? card.name : null,
          description:
            card && typeof card.description === 'string' ? card.description : null,
          image: card && typeof card.image === 'string' ? card.image : null,
          wallets: (walletRows as Array<{ wallet_address: string }>).map(
            (w) => w.wallet_address,
          ),
        })
      } catch {
        // Agent may not exist on-chain anymore (burned / wrong chain).
      }
    }

    const countRows = await sql`
      SELECT COUNT(*) as count FROM (
        SELECT agent_id FROM agent_wallets
        UNION
        SELECT agent_id FROM company_members WHERE removed_at IS NULL
        UNION
        SELECT agent_id FROM discovered_agents
      ) AS distinct_agents
    `
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
