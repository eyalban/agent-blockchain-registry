import { keccak256, toBytes } from 'viem'

import { IDENTITY_REGISTRY_ADDRESS } from '@agent-registry/shared'

import { sql } from './db'

const CHAIN_ID = 84532
const BLOCKSCOUT_API = 'https://base-sepolia.blockscout.com/api'

// keccak256("Registered(uint256,string,address)") — emitted by the canonical
// IdentityRegistry on every agent mint. topic1 holds the indexed agentId,
// topic2 holds the indexed owner address.
const REGISTERED_TOPIC0 = keccak256(toBytes('Registered(uint256,string,address)'))

// Throttle window: skip a discovery scan if the cursor was updated within
// this many milliseconds. Listing requests trigger discovery in line, so this
// keeps p99 latency bounded while still catching new mints within ~half a
// minute under any meaningful traffic.
const THROTTLE_MS = 30_000

// Hard cap on Blockscout pages per discovery call so a cold start can't
// blow the serverless function's wall clock budget. With 1000 events per
// page the registry can ingest ~5k new agents per request, and subsequent
// requests pick up where the cursor left off.
const MAX_PAGES_PER_CALL = 8

interface BlockscoutLog {
  readonly blockNumber: string
  readonly transactionHash: string
  readonly topics: readonly string[]
}

interface BlockscoutResponse {
  readonly status: string
  readonly message: string
  readonly result: BlockscoutLog[] | string
}

interface CursorRow {
  readonly last_scanned_block: string
  readonly last_scanned_at: string
}

async function readCursor(): Promise<{ block: bigint; ageMs: number }> {
  const rows = (await sql`
    SELECT last_scanned_block, last_scanned_at
    FROM agent_discovery_cursor
    WHERE chain_id = ${CHAIN_ID}
  `) as CursorRow[]

  if (rows.length === 0) {
    await sql`
      INSERT INTO agent_discovery_cursor (chain_id, last_scanned_block, last_scanned_at)
      VALUES (${CHAIN_ID}, 0, 'epoch')
      ON CONFLICT (chain_id) DO NOTHING
    `
    return { block: 0n, ageMs: Number.POSITIVE_INFINITY }
  }

  const row = rows[0]!
  return {
    block: BigInt(row.last_scanned_block),
    ageMs: Date.now() - new Date(row.last_scanned_at).getTime(),
  }
}

async function writeCursor(block: bigint): Promise<void> {
  await sql`
    UPDATE agent_discovery_cursor
    SET last_scanned_block = ${block.toString()}, last_scanned_at = NOW()
    WHERE chain_id = ${CHAIN_ID}
  `
}

async function fetchPage(fromBlock: bigint): Promise<BlockscoutLog[]> {
  const url =
    `${BLOCKSCOUT_API}?module=logs&action=getLogs` +
    `&fromBlock=${fromBlock.toString()}&toBlock=latest` +
    `&address=${IDENTITY_REGISTRY_ADDRESS}` +
    `&topic0=${REGISTERED_TOPIC0}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as BlockscoutResponse
  if (data.status !== '1' || !Array.isArray(data.result)) return []
  return data.result
}

/**
 * Incrementally backfill `discovered_agents` from the canonical
 * IdentityRegistry's `Registered` event log.
 *
 * Throttled by `agent_discovery_cursor.last_scanned_at` so request handlers
 * can call this freely — most invocations are no-ops. Pagination is by
 * `fromBlock` because Blockscout's etherscan-compatible logs endpoint caps
 * at 1000 results per page and ignores `&page`/`&offset`.
 *
 * Errors swallow silently and return false so a Blockscout outage never
 * breaks the listing endpoint — discovery resumes on the next call.
 */
export async function discoverNewAgents(): Promise<number> {
  let inserted = 0
  try {
    const { block: cursorBlock, ageMs } = await readCursor()
    if (ageMs < THROTTLE_MS) return 0

    let fromBlock = cursorBlock
    let highestBlockSeen = cursorBlock

    for (let page = 0; page < MAX_PAGES_PER_CALL; page++) {
      const logs = await fetchPage(fromBlock)
      if (logs.length === 0) break

      const rows = logs
        .map((log) => {
          const agentIdHex = log.topics[1]
          const ownerHex = log.topics[2]
          if (!agentIdHex || !ownerHex) return null
          const blockNum = BigInt(log.blockNumber)
          if (blockNum > highestBlockSeen) highestBlockSeen = blockNum
          return {
            agentId: BigInt(agentIdHex).toString(),
            owner: `0x${ownerHex.slice(-40).toLowerCase()}`,
            block: blockNum.toString(),
            tx: log.transactionHash,
          }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)

      if (rows.length > 0) {
        // Bulk insert with parameterized VALUES — one round trip per page
        // instead of one per row keeps cold backfills inside Vercel's 60s
        // budget.
        const placeholders = rows
          .map((_, i) => {
            const o = i * 5
            return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5})`
          })
          .join(', ')
        const params = rows.flatMap((r) => [
          r.agentId,
          CHAIN_ID,
          r.owner,
          r.block,
          r.tx,
        ])
        const result = (await sql.query(
          `INSERT INTO discovered_agents
             (agent_id, chain_id, owner_address, registered_block, registered_tx)
           VALUES ${placeholders}
           ON CONFLICT (chain_id, agent_id) DO NOTHING
           RETURNING agent_id`,
          params,
        )) as unknown[]
        inserted += result.length
      }

      // Blockscout returns at most 1000 logs per call. A short page means
      // we've caught up to head and can stop early.
      if (logs.length < 1000) break

      // Resume from the highest block in this page; ON CONFLICT swallows the
      // overlap of any same-block events that span the page boundary.
      fromBlock = highestBlockSeen
    }

    await writeCursor(highestBlockSeen)
  } catch {
    // Swallow — don't let a discovery failure break the listing endpoint.
  }
  return inserted
}
