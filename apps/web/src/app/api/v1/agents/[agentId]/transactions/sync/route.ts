import { NextResponse } from 'next/server'

import { getWalletsByAgent, insertTransaction } from '@/lib/db'
import { classifyTransaction } from '@/lib/tx-classifier'

interface RouteParams {
  params: Promise<{ agentId: string }>
}

const BLOCKSCOUT_API = 'https://base-sepolia.blockscout.com/api'

interface BlockscoutTx {
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

/**
 * POST /api/v1/agents/:agentId/transactions/sync
 *
 * Fetches all transactions for the agent's wallets from Blockscout API
 * (address-based query — no block scanning needed).
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

  let totalSynced = 0
  const errors: string[] = []

  for (const wallet of wallets) {
    try {
      const url = `${BLOCKSCOUT_API}?module=account&action=txlist&address=${wallet.wallet_address}&sort=desc&page=1&offset=200`
      const res = await fetch(url)
      if (!res.ok) {
        errors.push(`Blockscout fetch failed for ${wallet.wallet_address.slice(0, 10)}`)
        continue
      }

      const data = (await res.json()) as { status: string; result: BlockscoutTx[] | string }
      if (data.status !== '1' || !Array.isArray(data.result)) continue

      for (const tx of data.result) {
        if (tx.isError === '1') continue

        const valueEth = Number(tx.value) / 1e18
        if (valueEth === 0 && !tx.to) continue

        const { label, direction } = classifyTransaction(
          tx.from,
          tx.to ?? '',
          wallet.wallet_address,
        )

        try {
          await insertTransaction({
            tx_hash: tx.hash,
            agent_id: agentId,
            wallet_address: wallet.wallet_address.toLowerCase(),
            direction,
            counterparty: direction === 'incoming' ? tx.from : (tx.to ?? ''),
            value_eth: valueEth,
            block_number: Number(tx.blockNumber),
            block_timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
            label,
            label_source: 'auto',
            memo: null,
            gas_used: tx.gasUsed,
            gas_cost_eth: (Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18,
          })
          totalSynced++
        } catch {
          // Duplicate tx_hash — already synced
        }
      }
    } catch (e) {
      errors.push(`${wallet.wallet_address.slice(0, 10)}: ${(e as Error).message?.slice(0, 60)}`)
    }
  }

  return NextResponse.json({
    agentId,
    walletsScanned: wallets.length,
    transactionsSynced: totalSynced,
    errors: errors.length > 0 ? errors : undefined,
  })
}
