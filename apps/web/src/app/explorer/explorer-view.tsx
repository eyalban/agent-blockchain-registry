'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useWalletNames } from '@/hooks/use-wallet-names'
import { formatEthValue } from '@/lib/utils'

const ActivityChart = dynamic(
  () => import('@/components/explorer/activity-chart').then((m) => m.ActivityChart),
  {
    loading: () => (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-(--color-border) bg-(--color-bg-secondary)">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-(--color-accent-cyan) border-t-transparent" />
      </div>
    ),
    ssr: false,
  },
)

interface Transaction {
  tx_hash: string
  agent_id: string
  direction: string
  counterparty: string
  value_eth: number
  label: string
  block_timestamp: string
}

interface Stats {
  totalAgents: number
  totalTransactions: number
}

export function ExplorerView() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/stats').then((r) => r.json()),
      Promise.all(
        [4894, 4895, 4896, 4897, 4902, 4903, 4936, 4939].map((id) =>
          fetch(`/api/v1/agents/${id}/transactions`)
            .then((r) => r.ok ? r.json() : { transactions: [] })
            .catch(() => ({ transactions: [] })),
        ),
      ),
    ])
      .then(([statsData, agentTxArrays]) => {
        setStats(statsData as Stats)
        const allTxs: Transaction[] = []
        const seen = new Set<string>()
        for (const data of agentTxArrays) {
          for (const tx of (data as { transactions: Transaction[] }).transactions) {
            if (!seen.has(tx.tx_hash)) {
              seen.add(tx.tx_hash)
              allTxs.push(tx)
            }
          }
        }
        allTxs.sort((a, b) => new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime())
        setTransactions(allTxs)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const walletNames = useWalletNames(transactions.map((tx) => tx.counterparty))

  const chartEvents = transactions.map((tx) => ({
    type: 'registration' as const,
    agentId: BigInt(tx.agent_id),
    blockNumber: BigInt(0),
    transactionHash: tx.tx_hash,
  }))

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 glow-cyan-sm">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Agents</p>
          <p className="mt-1 font-mono text-2xl font-bold text-(--color-accent-cyan)">{stats ? stats.totalAgents : '...'}</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 glow-violet">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Transactions</p>
          <p className="mt-1 font-mono text-2xl font-bold text-(--color-accent-violet-bright)">{stats ? stats.totalTransactions : '...'}</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Network</p>
          <p className="mt-1 flex items-center gap-2 font-mono text-sm text-(--color-text-primary)">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent-green) opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-accent-green)" />
            </span>
            Base Sepolia
          </p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Source</p>
          <p className="mt-1 font-mono text-xs text-(--color-text-secondary)">On-chain via Blockscout</p>
        </div>
      </div>

      <div className="mt-8 gradient-border rounded-2xl bg-(--color-surface) p-6">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">Transaction Activity</h3>
        <div className="mt-4">
          <ActivityChart events={chartEvents} />
        </div>
      </div>

      <div className="mt-8 gradient-border rounded-2xl bg-(--color-surface) p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent-green) opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-accent-green)" />
            </span>
            <h3 className="text-lg font-semibold text-(--color-text-primary)">Transaction Log</h3>
          </div>
          <span className="font-mono text-xs text-(--color-text-muted)">{transactions.length} transactions</span>
        </div>

        {isLoading ? (
          <div className="mt-6 flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-(--color-accent-cyan) border-t-transparent" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="mt-6 py-8 text-center text-sm text-(--color-text-secondary)">No transactions found.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--color-border)">
                  <th className="px-3 py-2.5 text-left font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Agent</th>
                  <th className="px-3 py-2.5 text-left font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Dir</th>
                  <th className="px-3 py-2.5 text-left font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Label</th>
                  <th className="px-3 py-2.5 text-right font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Amount</th>
                  <th className="px-3 py-2.5 text-left font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Counterparty</th>
                  <th className="px-3 py-2.5 text-left font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Tx</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map((tx) => (
                  <tr key={`${tx.tx_hash}-${tx.agent_id}`} className="border-b border-(--color-border)/30 transition-colors hover:bg-(--color-surface-hover)">
                    <td className="px-3 py-2">
                      <Link href={`/agents/${tx.agent_id}`} className="font-mono text-xs text-(--color-accent-cyan) hover:underline">#{tx.agent_id}</Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`font-mono text-xs font-medium ${tx.direction === 'incoming' ? 'text-(--color-accent-green)' : 'text-(--color-accent-red)'}`}>
                        {tx.direction === 'incoming' ? 'IN' : 'OUT'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-1.5 py-0.5 font-mono text-[10px] text-(--color-text-muted)">{tx.label}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-(--color-text-secondary)">{formatEthValue(Number(tx.value_eth))}</td>
                    <td className="px-3 py-2">
                      {walletNames.get(tx.counterparty.toLowerCase()) && (
                        <p className="text-xs text-(--color-text-primary)">{walletNames.get(tx.counterparty.toLowerCase())}</p>
                      )}
                      <p className="font-mono text-[10px] text-(--color-text-muted)">{tx.counterparty.slice(0, 8)}...{tx.counterparty.slice(-4)}</p>
                    </td>
                    <td className="px-3 py-2">
                      <a href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-(--color-text-muted) hover:text-(--color-accent-cyan)">
                        {tx.tx_hash.slice(0, 8)}...
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
