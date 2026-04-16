import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

import { getWalletsByAgent, insertTransaction } from '@/lib/db'
import { classifyTransaction } from '@/lib/tx-classifier'

interface RouteParams {
  params: Promise<{ agentId: string }>
}

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL ?? 'https://sepolia.base.org'),
})

/**
 * POST /api/v1/agents/:agentId/transactions/sync
 *
 * Scans the blockchain for all transactions involving this agent's wallets.
 * Reads directly from on-chain data — no self-reporting, no external API.
 * Classifies each transaction and stores in Postgres.
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

  const walletSet = new Set(wallets.map((w) => w.wallet_address.toLowerCase()))
  let totalSynced = 0
  const errors: string[] = []

  try {
    const currentBlock = await client.getBlockNumber()
    // Scan last 3000 blocks (~1 hour on Base Sepolia)
    const scanRange = 3000n
    const fromBlock = currentBlock > scanRange ? currentBlock - scanRange : 0n

    for (let blockNum = currentBlock; blockNum >= fromBlock; blockNum--) {
      try {
        const block = await client.getBlock({
          blockNumber: blockNum,
          includeTransactions: true,
        })

        for (const tx of block.transactions) {
          if (typeof tx === 'string') continue

          const fromLower = tx.from.toLowerCase()
          const toLower = (tx.to ?? '').toLowerCase()

          // Only process transactions involving our agent's wallets
          if (!walletSet.has(fromLower) && !walletSet.has(toLower)) continue

          const agentWallet = walletSet.has(fromLower) ? fromLower : toLower
          const valueEth = Number(tx.value) / 1e18

          // Skip zero-value transactions with no calldata
          if (valueEth === 0 && tx.input === '0x') continue

          const { label, direction } = classifyTransaction(
            tx.from,
            tx.to ?? '',
            agentWallet,
            tx.input,
          )

          try {
            await insertTransaction({
              tx_hash: tx.hash,
              agent_id: agentId,
              wallet_address: agentWallet,
              direction,
              counterparty: direction === 'incoming' ? tx.from : (tx.to ?? ''),
              value_eth: valueEth > 0 ? valueEth : 0,
              block_number: Number(blockNum),
              block_timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
              label,
              label_source: 'auto',
              memo: null,
              gas_used: null,
              gas_cost_eth: null,
            })
            totalSynced++
          } catch {
            // Duplicate tx_hash — already synced, skip
          }
        }
      } catch {
        // Block fetch error — continue
      }

      // Stop early if we've synced enough or hitting timeout
      if (totalSynced >= 100) break
    }
  } catch (e) {
    errors.push(`Chain scan: ${(e as Error).message?.slice(0, 80)}`)
  }

  return NextResponse.json({
    agentId,
    walletsScanned: wallets.length,
    transactionsSynced: totalSynced,
    errors: errors.length > 0 ? errors : undefined,
  })
}
