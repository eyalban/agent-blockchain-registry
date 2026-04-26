import { keccak256, toBytes } from 'viem'

import { sql } from './db'

const CHAIN_ID = 84532
const WRAPPER_ADDRESS = process.env.NEXT_PUBLIC_WRAPPER_ADDRESS ?? ''
const BLOCKSCOUT_API = 'https://base-sepolia.blockscout.com/api'

// keccak256("AgentRegisteredViaWrapper(uint256,address,string[])") — emitted
// by the platform's AgentRegistryWrapper on every framework registration.
// topic1 is the indexed agentId, topic2 is the indexed owner address.
const WRAPPER_REGISTERED_TOPIC0 = keccak256(
  toBytes('AgentRegisteredViaWrapper(uint256,address,string[])'),
)

// Throttle: skip a sweep if we ran one within this many ms. The listing
// endpoint triggers this, so the cap keeps p99 latency bounded while
// still catching new registrations within ~30s under any meaningful
// traffic.
const THROTTLE_MS = 30_000

// Hard cap on Blockscout pages per call so a cold start can't blow the
// serverless function's wall clock budget. Each page returns up to 1000
// events, so this absorbs ~5k new registrations per request.
const MAX_PAGES_PER_CALL = 5

interface BlockscoutLog {
  readonly blockNumber: string
  readonly transactionHash: string
  readonly topics: readonly string[]
}

interface BlockscoutResponse {
  readonly status: string
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
    `&address=${WRAPPER_ADDRESS}` +
    `&topic0=${WRAPPER_REGISTERED_TOPIC0}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as BlockscoutResponse
  if (data.status !== '1' || !Array.isArray(data.result)) return []
  return data.result
}

/**
 * Resolve every new framework registration into `agent_wallets`.
 *
 * The platform's AgentRegistryWrapper emits `AgentRegisteredViaWrapper`
 * on every Path A/B/C registration described in the public framework
 * README. That event is the canonical "this is one of ours" signal —
 * the canonical IdentityRegistry is shared across the whole Base
 * Sepolia ecosystem, but the wrapper is ours alone, so indexing only
 * its events keeps the listing scoped to platform agents without any
 * client-side cooperation.
 *
 * Anchored to `agent_discovery_cursor` so each call only scans the
 * delta since last sweep. Throttled in-process so the listing endpoint
 * can call this freely. Errors swallow silently so a Blockscout outage
 * never breaks the listing.
 */
export async function discoverWrapperRegistrations(): Promise<number> {
  if (!WRAPPER_ADDRESS) return 0

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
          }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)

      for (const row of rows) {
        const result = (await sql`
          INSERT INTO agent_wallets (agent_id, wallet_address, is_primary, label)
          VALUES (${row.agentId}, ${row.owner}, true, 'owner')
          ON CONFLICT (agent_id, wallet_address) DO NOTHING
          RETURNING agent_id
        `) as unknown[]
        if (result.length > 0) inserted++
      }

      // Blockscout returns at most 1000 logs per call. A short page means
      // we've caught up to head and can stop early.
      if (logs.length < 1000) break

      // Resume from the highest block in this page; ON CONFLICT swallows
      // the same-block overlap of the page boundary.
      fromBlock = highestBlockSeen
    }

    await writeCursor(highestBlockSeen)
  } catch {
    // Swallow — discovery failures must never break the listing endpoint.
  }
  return inserted
}
