import { NextResponse } from 'next/server'

import { SUPPORTED_TOKENS, getTokenByAddress } from '@agent-registry/shared'

import { findCompanyByAgent, getWalletsByAgent, insertTransaction, sql } from '@/lib/db'
import { getTokenPriceUSD } from '@/lib/price-oracle'
import { classifyTransaction } from '@/lib/tx-classifier'
import { classifyTransactionV2 } from '@/lib/tx-classifier-v2'
import { reconcileTx } from '@/lib/tx-reconciler'

interface RouteParams {
  params: Promise<{ agentId: string }>
}

const BLOCKSCOUT_API = 'https://base-sepolia.blockscout.com/api'
const CHAIN_ID = 84532

interface BlockscoutNativeTx {
  hash: string
  from: string
  to: string
  value: string
  blockNumber: string
  timeStamp: string
  gasUsed: string
  gasPrice: string
  isError: string
}

interface BlockscoutTokenTx {
  hash: string
  from: string
  to: string
  value: string
  blockNumber: string
  timeStamp: string
  gasUsed: string
  gasPrice: string
  contractAddress: string
  tokenSymbol: string
  tokenDecimal: string
}

async function fetchBlockscout<T>(url: string): Promise<T[] | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as { status: string; result: T[] | string }
  if (data.status !== '1' || !Array.isArray(data.result)) return null
  return data.result
}

/**
 * POST /api/v1/agents/:agentId/transactions/sync
 *
 * Fetches native ETH transactions AND whitelisted ERC-20 transfers for every
 * wallet linked to the agent, resolves USD value at block time via the price
 * oracle (Chainlink / CoinGecko, never hardcoded), and mirrors into Postgres.
 *
 * Only whitelisted tokens (see SUPPORTED_TOKENS) are tracked. Non-whitelisted
 * ERC-20 transfers are skipped and reported in the response so operators can
 * decide whether to add them.
 */
export async function POST(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  const { agentId } = await params

  const wallets = await getWalletsByAgent(agentId)
  if (wallets.length === 0) {
    return NextResponse.json(
      { error: 'No wallets linked to this agent. Add wallets first.', code: 'NO_WALLETS' },
      { status: 400 },
    )
  }

  const whitelistedTokenAddresses = new Set(
    Object.values(SUPPORTED_TOKENS[CHAIN_ID])
      .map((t) => t.address?.toLowerCase())
      .filter((a): a is string => Boolean(a)),
  )

  const companyId = await findCompanyByAgent(agentId)

  let nativeSynced = 0
  let tokenSynced = 0
  let priceMissing = 0
  let tokenSkipped = 0
  let reconciled = 0
  const errors: string[] = []
  const syncedTxHashes: string[] = []

  for (const wallet of wallets) {
    try {
      // ───── Native ETH transactions ────────────────────────────────────
      const nativeUrl = `${BLOCKSCOUT_API}?module=account&action=txlist&address=${wallet.wallet_address}&sort=desc&page=1&offset=200`
      const nativeTxs = await fetchBlockscout<BlockscoutNativeTx>(nativeUrl)

      if (nativeTxs) {
        for (const tx of nativeTxs) {
          if (tx.isError === '1') continue
          const valueWei = tx.value ?? '0'
          if (valueWei === '0' && !tx.to) continue

          const valueEth = Number(valueWei) / 1e18

          // Classifier v2: decode calldata + events against known contracts.
          let classification
          try {
            classification = await classifyTransactionV2({
              txHash: tx.hash as `0x${string}`,
              agentWallet: wallet.wallet_address,
            })
          } catch {
            const h = classifyTransaction(tx.from, tx.to ?? '', wallet.wallet_address)
            classification = {
              label: h.label,
              direction: h.direction,
              confidence: 'low' as const,
              source: 'heuristic' as const,
              evidence: { note: 'v2 classifier failed; fell back' },
            }
          }
          const { label, direction, confidence, source, evidence } = classification

          const blockTimestamp = new Date(Number(tx.timeStamp) * 1000)
          const ethToken = SUPPORTED_TOKENS[CHAIN_ID].ETH
          const price = await getTokenPriceUSD({
            chainId: CHAIN_ID,
            token: ethToken,
            blockNumber: Number(tx.blockNumber),
            blockTimestamp,
          })
          if (!price) priceMissing++

          try {
            await insertTransaction({
              tx_hash: tx.hash,
              agent_id: agentId,
              wallet_address: wallet.wallet_address.toLowerCase(),
              direction,
              counterparty: direction === 'incoming' ? tx.from : (tx.to ?? ''),
              value_eth: valueEth,
              block_number: Number(tx.blockNumber),
              block_timestamp: blockTimestamp.toISOString(),
              label,
              label_source: source === 'heuristic' ? 'auto' : 'auto_v2',
              memo: null,
              gas_used: tx.gasUsed,
              gas_cost_eth: (Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18,
              chain_id: CHAIN_ID,
              token_address: null,
              token_symbol: 'ETH',
              value_token: valueWei,
              value_usd: price ? valueEth * price.usdPrice : null,
              usd_price_at_block: price?.usdPrice ?? null,
              price_source: price?.source ?? null,
            })
            // Update company scoping + confidence + evidence (insertTransaction
            // didn't take these; they're mirror-only columns).
            await sql`
              UPDATE transactions SET
                company_id = ${companyId},
                label_confidence = ${confidence},
                label_evidence = ${JSON.stringify(evidence)}::jsonb
              WHERE tx_hash = ${tx.hash}
            `
            syncedTxHashes.push(tx.hash)
            nativeSynced++
          } catch {
            // Duplicate tx_hash — already synced
          }
        }
      } else {
        errors.push(`txlist failed for ${wallet.wallet_address.slice(0, 10)}`)
      }

      // ───── ERC-20 token transfers (whitelisted only) ─────────────────
      const tokenUrl = `${BLOCKSCOUT_API}?module=account&action=tokentx&address=${wallet.wallet_address}&sort=desc&page=1&offset=200`
      const tokenTxs = await fetchBlockscout<BlockscoutTokenTx>(tokenUrl)

      if (tokenTxs) {
        for (const tx of tokenTxs) {
          const contractLower = tx.contractAddress?.toLowerCase()
          if (!contractLower || !whitelistedTokenAddresses.has(contractLower)) {
            tokenSkipped++
            continue
          }

          const tokenInfo = getTokenByAddress(CHAIN_ID, contractLower)
          if (!tokenInfo) {
            tokenSkipped++
            continue
          }

          const rawValue = tx.value ?? '0'
          if (rawValue === '0') continue

          let classification
          try {
            classification = await classifyTransactionV2({
              txHash: tx.hash as `0x${string}`,
              agentWallet: wallet.wallet_address,
            })
          } catch {
            const h = classifyTransaction(tx.from, tx.to ?? '', wallet.wallet_address)
            classification = {
              label: h.label,
              direction: h.direction,
              confidence: 'low' as const,
              source: 'heuristic' as const,
              evidence: { note: 'v2 classifier failed; fell back' },
            }
          }
          const { label, direction, confidence, source, evidence } = classification

          const blockTimestamp = new Date(Number(tx.timeStamp) * 1000)
          const price = await getTokenPriceUSD({
            chainId: CHAIN_ID,
            token: tokenInfo,
            blockNumber: Number(tx.blockNumber),
            blockTimestamp,
          })
          if (!price) priceMissing++

          const decimals = tokenInfo.decimals
          const humanValue = Number(rawValue) / 10 ** decimals

          try {
            await insertTransaction({
              tx_hash: tx.hash,
              agent_id: agentId,
              wallet_address: wallet.wallet_address.toLowerCase(),
              direction,
              counterparty: direction === 'incoming' ? tx.from : (tx.to ?? ''),
              value_eth: 0,
              block_number: Number(tx.blockNumber),
              block_timestamp: blockTimestamp.toISOString(),
              label,
              label_source: source === 'heuristic' ? 'auto' : 'auto_v2',
              memo: null,
              gas_used: tx.gasUsed,
              gas_cost_eth: (Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18,
              chain_id: CHAIN_ID,
              token_address: contractLower,
              token_symbol: tokenInfo.symbol,
              value_token: rawValue,
              value_usd: price ? humanValue * price.usdPrice : null,
              usd_price_at_block: price?.usdPrice ?? null,
              price_source: price?.source ?? null,
            })
            await sql`
              UPDATE transactions SET
                company_id = ${companyId},
                label_confidence = ${confidence},
                label_evidence = ${JSON.stringify(evidence)}::jsonb
              WHERE tx_hash = ${tx.hash}
            `
            syncedTxHashes.push(tx.hash)
            tokenSynced++
          } catch {
            // Duplicate tx_hash — already synced
          }
        }
      } else {
        errors.push(`tokentx failed for ${wallet.wallet_address.slice(0, 10)}`)
      }
    } catch (e) {
      errors.push(`${wallet.wallet_address.slice(0, 10)}: ${(e as Error).message?.slice(0, 60)}`)
    }
  }

  // Run counterparty reconciliation over newly-synced txs. De-duplicate to
  // avoid reconciling the same hash twice when both sides hit us in one sync.
  const unique = Array.from(new Set(syncedTxHashes))
  for (const hash of unique) {
    try {
      const results = await reconcileTx(hash)
      reconciled += results.length
    } catch {
      /* non-fatal */
    }
  }

  return NextResponse.json({
    agentId,
    companyId,
    walletsScanned: wallets.length,
    nativeTransactionsSynced: nativeSynced,
    tokenTransactionsSynced: tokenSynced,
    nonWhitelistedTokenTransfersSkipped: tokenSkipped,
    pricesMissing: priceMissing,
    reconciliationsWritten: reconciled,
    errors: errors.length > 0 ? errors : undefined,
  })
}
