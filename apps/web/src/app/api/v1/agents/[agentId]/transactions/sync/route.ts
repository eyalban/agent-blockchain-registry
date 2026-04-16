import { NextResponse } from 'next/server'
import { getWalletsByAgent, insertTransaction } from '@/lib/db'
import { fetchTransactions } from '@/lib/basescan'
import { classifyTransaction } from '@/lib/tx-classifier'

interface RouteParams {
  params: Promise<{ agentId: string }>
}

/**
 * POST /api/v1/agents/:agentId/transactions/sync
 * Fetches all on-chain transactions for the agent's wallets from BaseScan,
 * classifies them, and stores in Postgres.
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
      const txs = await fetchTransactions(wallet.wallet_address)

      for (const tx of txs) {
        if (tx.isError === '1') continue
        const valueEth = Number(tx.value) / 1e18
        if (valueEth === 0 && tx.input === '0x') continue

        const { label, direction } = classifyTransaction(
          tx.from,
          tx.to,
          wallet.wallet_address,
          tx.input,
        )

        const gasUsed = tx.gasUsed
        const gasPrice = Number(tx.gasPrice)
        const gasCostEth = (Number(gasUsed) * gasPrice) / 1e18

        await insertTransaction({
          tx_hash: tx.hash,
          agent_id: agentId,
          wallet_address: wallet.wallet_address,
          direction,
          counterparty: direction === 'incoming' ? tx.from : tx.to,
          value_eth: valueEth || gasCostEth,
          block_number: Number(tx.blockNumber),
          block_timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
          label,
          label_source: 'auto',
          memo: null,
          gas_used: gasUsed,
          gas_cost_eth: gasCostEth,
        })
        totalSynced++
      }
    } catch (e) {
      errors.push(`${wallet.wallet_address}: ${(e as Error).message?.slice(0, 80)}`)
    }
  }

  return NextResponse.json({
    agentId,
    walletsScanned: wallets.length,
    transactionsSynced: totalSynced,
    errors: errors.length > 0 ? errors : undefined,
  })
}
