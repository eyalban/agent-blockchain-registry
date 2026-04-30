/**
 * Price oracle — resolves token USD prices from real, named sources.
 *
 * Priority order per request:
 *   1. `price_snapshots` cache (already-resolved price at that block).
 *   2. Chainlink AggregatorV3 feed on-chain, if available for the chain+pair.
 *   3. CoinGecko historical API, as a documented fallback.
 *   4. `null` — no source available. Callers must treat null as "Price source
 *       missing" in the UI. We never fabricate a value or assume a peg.
 *
 * Every resolved price is persisted to `price_snapshots` with `source` +
 * `source_ref` so an auditor can trace any USD value back to its origin.
 */

import {
  type TokenInfo,
  chainlinkAggregatorV3Abi,
  getFeed,
} from '@agent-registry/shared'
import type { PublicClient } from 'viem'

import { sql } from './db'
import { publicClient } from './viem-client'

export type PriceSource = 'chainlink' | 'coingecko'

export interface ResolvedPrice {
  usdPrice: number
  source: PriceSource
  sourceRef: string
  blockNumber: number
  blockTimestamp: Date
  cached: boolean
}

interface PriceQuery {
  chainId: number
  token: TokenInfo
  blockNumber: number
  blockTimestamp: Date
}

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

// Process-local memo so a dashboard rendering N companies doesn't fan
// out N price reads to the DB cache (or further to Chainlink/CoinGecko).
// Keyed by chain + token, TTL ~30s — short enough that a stale price
// can't drift more than a few cents on stables, fresh enough for live UI.
const PRICE_MEMO_TTL_MS = 30_000
const priceMemo = new Map<string, { at: number; price: ResolvedPrice }>()
function memoKey(q: PriceQuery): string {
  return `${q.chainId}:${q.token.address ?? 'native'}`
}

/**
 * Resolve the USD price for a token at a specific block.
 * Returns `null` if no source is available. Never returns a fabricated value.
 */
export async function getTokenPriceUSD(
  query: PriceQuery,
): Promise<ResolvedPrice | null> {
  const k = memoKey(query)
  const memo = priceMemo.get(k)
  if (memo && Date.now() - memo.at < PRICE_MEMO_TTL_MS) {
    return { ...memo.price, cached: true }
  }

  const cached = await readCache(query)
  if (cached) {
    priceMemo.set(k, { at: Date.now(), price: cached })
    return cached
  }

  const chainlink = await tryChainlink(query)
  if (chainlink) {
    await writeCache(query, chainlink)
    priceMemo.set(k, { at: Date.now(), price: chainlink })
    return chainlink
  }

  const coingecko = await tryCoinGecko(query)
  if (coingecko) {
    await writeCache(query, coingecko)
    priceMemo.set(k, { at: Date.now(), price: coingecko })
    return coingecko
  }

  return null
}

async function readCache(query: PriceQuery): Promise<ResolvedPrice | null> {
  const rows = query.token.address
    ? ((await sql`
        SELECT usd_price, source, source_ref, block_number, block_timestamp
        FROM price_snapshots
        WHERE chain_id = ${query.chainId}
          AND token_address = ${query.token.address.toLowerCase()}
          AND block_number = ${query.blockNumber}
        LIMIT 1
      `) as Array<{
        usd_price: string
        source: PriceSource
        source_ref: string
        block_number: string
        block_timestamp: string
      }>)
    : ((await sql`
        SELECT usd_price, source, source_ref, block_number, block_timestamp
        FROM price_snapshots
        WHERE chain_id = ${query.chainId}
          AND token_address IS NULL
          AND block_number = ${query.blockNumber}
        LIMIT 1
      `) as Array<{
        usd_price: string
        source: PriceSource
        source_ref: string
        block_number: string
        block_timestamp: string
      }>)

  const row = rows[0]
  if (!row) return null

  return {
    usdPrice: Number(row.usd_price),
    source: row.source,
    sourceRef: row.source_ref,
    blockNumber: Number(row.block_number),
    blockTimestamp: new Date(row.block_timestamp),
    cached: true,
  }
}

async function writeCache(
  query: PriceQuery,
  resolved: ResolvedPrice,
): Promise<void> {
  await sql`
    INSERT INTO price_snapshots (
      chain_id, token_address, symbol, block_number, block_timestamp,
      usd_price, source, source_ref
    ) VALUES (
      ${query.chainId},
      ${query.token.address?.toLowerCase() ?? null},
      ${query.token.symbol},
      ${query.blockNumber},
      ${query.blockTimestamp.toISOString()},
      ${resolved.usdPrice},
      ${resolved.source},
      ${resolved.sourceRef}
    )
    ON CONFLICT (chain_id, token_address, block_number) DO NOTHING
  `
}

async function tryChainlink(query: PriceQuery): Promise<ResolvedPrice | null> {
  const pair = pairForSymbol(query.token.symbol)
  if (!pair) return null

  const feed = getFeed(query.chainId, pair)
  if (!feed) return null

  try {
    const client = publicClient as PublicClient
    const [, answer] = (await client.readContract({
      address: feed.address,
      abi: chainlinkAggregatorV3Abi,
      functionName: 'latestRoundData',
      blockNumber: BigInt(query.blockNumber),
    })) as readonly [bigint, bigint, bigint, bigint, bigint]

    if (answer <= 0n) return null

    const usdPrice = Number(answer) / 10 ** feed.decimals
    return {
      usdPrice,
      source: 'chainlink',
      sourceRef: `${feed.address}@block=${query.blockNumber}`,
      blockNumber: query.blockNumber,
      blockTimestamp: query.blockTimestamp,
      cached: false,
    }
  } catch {
    return null
  }
}

async function tryCoinGecko(query: PriceQuery): Promise<ResolvedPrice | null> {
  const id = query.token.coingeckoId
  if (!id) return null

  const date = formatCoinGeckoDate(query.blockTimestamp)
  const url = `${COINGECKO_BASE}/coins/${id}/history?date=${date}&localization=false`

  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    if (!res.ok) return null

    const data = (await res.json()) as {
      market_data?: { current_price?: { usd?: number } }
    }
    const usd = data.market_data?.current_price?.usd
    if (typeof usd !== 'number' || usd <= 0) return null

    return {
      usdPrice: usd,
      source: 'coingecko',
      sourceRef: url,
      blockNumber: query.blockNumber,
      blockTimestamp: query.blockTimestamp,
      cached: false,
    }
  } catch {
    return null
  }
}

function pairForSymbol(symbol: string): 'ETH_USD' | 'USDC_USD' | null {
  if (symbol === 'ETH') return 'ETH_USD'
  if (symbol === 'USDC') return 'USDC_USD'
  return null
}

function formatCoinGeckoDate(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}-${month}-${year}`
}
