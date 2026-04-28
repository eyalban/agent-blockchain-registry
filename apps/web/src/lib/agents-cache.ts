/**
 * Persistent cache for the agents listing.
 *
 * Goal: turn the listing into a single SQL query in the warm path while
 * still surfacing brand-new agents that haven't been enriched yet. The
 * cache is keyed by agent_id and holds owner + tokenURI + the resolved
 * card (name, description, image). Cold serverless starts read straight
 * from Postgres; on-chain reads and IPFS fetches only run for cache
 * misses or stale rows, and they always write back so the next request
 * is fast.
 */

import { identityRegistryAbi, IDENTITY_REGISTRY_ADDRESS } from '@agent-registry/shared'

import { sql } from '@/lib/db'
import { fetchJsonMetadata } from '@/lib/ipfs-fetch'
import { publicClient } from '@/lib/viem-client'

const CHAIN_ID = 84532
const STALE_AFTER_MS = 24 * 60 * 60 * 1000 // refresh metadata once a day

export interface AgentRow {
  readonly agentId: string
  readonly owner: string
  readonly tokenURI: string
  readonly name: string | null
  readonly description: string | null
  readonly image: string | null
}

interface AgentCacheRow {
  agent_id: string
  owner_address: string
  token_uri: string | null
  name: string | null
  description: string | null
  image: string | null
  metadata_fetched_at: string | null
  on_chain_fetched_at: string | null
}

interface AgentCard {
  name?: unknown
  description?: unknown
  image?: unknown
}

function resolveCard(tokenURI: string): Promise<AgentCard | null> | AgentCard | null {
  if (tokenURI.startsWith('data:application/json;base64,')) {
    try {
      const json = Buffer.from(tokenURI.split(',')[1] ?? '', 'base64').toString()
      return JSON.parse(json) as AgentCard
    } catch {
      return null
    }
  }
  return fetchJsonMetadata<AgentCard>(tokenURI)
}

function rowToAgent(row: AgentCacheRow): AgentRow {
  return {
    agentId: row.agent_id,
    owner: row.owner_address,
    tokenURI: row.token_uri ?? '',
    name: row.name,
    description: row.description,
    image: row.image,
  }
}

/**
 * Read the next page of agent IDs we know about — union of all sources
 * (cache, agent_wallets dictionary, active company members) so that a
 * brand-new wrapper registration shows up immediately even before the
 * cache has been populated.
 */
async function selectAgentIds(
  limit: number,
  offset: number,
): Promise<{ ids: string[]; total: number }> {
  const [rows, countRows] = await Promise.all([
    sql`
      SELECT agent_id FROM (
        SELECT agent_id FROM agents_cache WHERE chain_id = ${CHAIN_ID}
        UNION
        SELECT agent_id FROM agent_wallets
        UNION
        SELECT agent_id FROM company_members WHERE removed_at IS NULL
      ) AS distinct_agents
      ORDER BY agent_id::numeric DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*) AS count FROM (
        SELECT agent_id FROM agents_cache WHERE chain_id = ${CHAIN_ID}
        UNION
        SELECT agent_id FROM agent_wallets
        UNION
        SELECT agent_id FROM company_members WHERE removed_at IS NULL
      ) AS distinct_agents
    `,
  ])

  return {
    ids: (rows as Array<{ agent_id: string }>).map((r) => r.agent_id),
    total: Number((countRows[0] as { count: string }).count),
  }
}

async function readCacheRows(ids: string[]): Promise<Map<string, AgentCacheRow>> {
  if (ids.length === 0) return new Map()
  const rows = (await sql`
    SELECT agent_id, owner_address, token_uri, name, description, image,
           metadata_fetched_at, on_chain_fetched_at
    FROM agents_cache
    WHERE chain_id = ${CHAIN_ID}
      AND agent_id = ANY(${ids})
  `) as AgentCacheRow[]

  const map = new Map<string, AgentCacheRow>()
  for (const row of rows) map.set(row.agent_id, row)
  return map
}

async function writeCache(row: AgentRow & { metadataResolved: boolean }): Promise<void> {
  const metadataAt = row.metadataResolved ? new Date().toISOString() : null
  await sql`
    INSERT INTO agents_cache (
      chain_id, agent_id, owner_address, token_uri, name, description, image,
      metadata_fetched_at, on_chain_fetched_at, updated_at
    ) VALUES (
      ${CHAIN_ID}, ${row.agentId}, ${row.owner}, ${row.tokenURI},
      ${row.name}, ${row.description}, ${row.image},
      ${metadataAt}, NOW(), NOW()
    )
    ON CONFLICT (chain_id, agent_id) DO UPDATE SET
      owner_address       = EXCLUDED.owner_address,
      token_uri           = EXCLUDED.token_uri,
      name                = COALESCE(EXCLUDED.name,        agents_cache.name),
      description         = COALESCE(EXCLUDED.description, agents_cache.description),
      image               = COALESCE(EXCLUDED.image,       agents_cache.image),
      metadata_fetched_at = COALESCE(EXCLUDED.metadata_fetched_at, agents_cache.metadata_fetched_at),
      on_chain_fetched_at = NOW(),
      updated_at          = NOW()
  `
}

/**
 * Resolve a single agent fully — chain reads + metadata fetch — and
 * persist the result. Always returns a row, even if metadata resolution
 * failed (we cache the on-chain fields so subsequent calls skip RPC).
 */
async function fetchAndCache(agentId: string): Promise<AgentRow | null> {
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

    const card = await resolveCard(tokenURI as string)
    const row: AgentRow = {
      agentId,
      owner: owner as string,
      tokenURI: tokenURI as string,
      name: card && typeof card.name === 'string' ? card.name : null,
      description: card && typeof card.description === 'string' ? card.description : null,
      image: card && typeof card.image === 'string' ? card.image : null,
    }
    await writeCache({ ...row, metadataResolved: card !== null })
    return row
  } catch {
    return null
  }
}

/**
 * Background-refresh stale rows. Fire-and-forget; never blocks the
 * response. We bound concurrency so a stale page doesn't trigger 100
 * parallel RPC calls.
 */
function scheduleRefresh(rows: AgentCacheRow[]): void {
  const now = Date.now()
  const stale = rows.filter((r) => {
    if (!r.metadata_fetched_at) return true
    return now - new Date(r.metadata_fetched_at).getTime() > STALE_AFTER_MS
  })
  if (stale.length === 0) return

  void (async () => {
    for (const row of stale.slice(0, 8)) {
      await fetchAndCache(row.agent_id)
    }
  })()
}

/**
 * Page through agents using the cache. The warm path is one SQL query
 * (or two, with the count). Cold rows trigger an on-the-fly enrichment
 * in parallel; both code paths write back to agents_cache so subsequent
 * requests stay on the warm path.
 */
export async function getAgentsPage(
  limit: number,
  offset: number,
): Promise<{ data: AgentRow[]; total: number }> {
  const { ids, total } = await selectAgentIds(limit, offset)
  if (ids.length === 0) return { data: [], total }

  const cached = await readCacheRows(ids)

  // Cold misses: agents with no row in agents_cache yet. Resolve them
  // in parallel from chain + IPFS. Subsequent requests will read from
  // cache.
  const misses = ids.filter((id) => !cached.has(id))
  let fetched: Map<string, AgentRow> = new Map()
  if (misses.length > 0) {
    const resolved = await Promise.all(misses.map((id) => fetchAndCache(id)))
    fetched = new Map(
      resolved
        .filter((r): r is AgentRow => r !== null)
        .map((r) => [r.agentId, r]),
    )
  }

  // Background-refresh anything that's stub-only or older than the TTL.
  scheduleRefresh(Array.from(cached.values()))

  const data: AgentRow[] = []
  for (const id of ids) {
    const cachedRow = cached.get(id)
    if (cachedRow) {
      data.push(rowToAgent(cachedRow))
      continue
    }
    const fresh = fetched.get(id)
    if (fresh) data.push(fresh)
  }

  return { data, total }
}
