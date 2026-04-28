'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useWalletNames } from '@/hooks/use-wallet-names'
import {
  formatEthValue,
  formatRelativeTime,
  formatCompactDateTime,
} from '@/lib/utils'

const ActivityChart = dynamic(
  () => import('@/components/explorer/activity-chart').then((m) => m.ActivityChart),
  {
    loading: () => (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-(--color-border) bg-white">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-(--color-magenta-500) border-t-transparent" />
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
  block_number: string
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
    // Global transaction feed — one endpoint, one query, every agent.
    // Previously this page was wired to a hardcoded list of 8 agent IDs,
    // so activity from any other agent was invisible.
    Promise.all([
      fetch('/api/v1/stats').then((r) => r.json()),
      fetch('/api/v1/transactions?limit=500')
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .catch(() => ({ data: [] })),
    ])
      .then(([statsData, txData]) => {
        setStats(statsData as Stats)
        const rows = (txData as { data: Transaction[] }).data ?? []
        // API already returns newest-first, but re-sort defensively.
        rows.sort(
          (a, b) =>
            new Date(b.block_timestamp).getTime() -
            new Date(a.block_timestamp).getTime(),
        )
        setTransactions(rows)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const walletNames = useWalletNames(transactions.map((tx) => tx.counterparty))

  // Feed real block numbers + timestamps into the chart so it can
  // bucket by time on the x-axis. (The chart prefers `timestamp` when
  // present and falls back to `blockNumber` otherwise.) The `type`
  // field is vestigial but kept for type compatibility.
  const chartEvents = transactions.map((tx) => ({
    type: 'registration' as const,
    agentId: BigInt(tx.agent_id),
    blockNumber: BigInt(tx.block_number),
    transactionHash: tx.tx_hash,
    timestamp: new Date(tx.block_timestamp).getTime(),
  }))

  return (
    <div>
      <div className="grid grid-cols-2 divide-(--color-border) overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:grid-cols-4 sm:divide-x">
        <div className="px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">Agents</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-(--color-text-primary)">
            {stats ? stats.totalAgents.toLocaleString() : '—'}
          </p>
        </div>
        <div className="px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">Transactions</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-(--color-text-primary)">
            {stats ? stats.totalTransactions.toLocaleString() : '—'}
          </p>
        </div>
        <div className="px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">Network</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
            </span>
            Base Sepolia
          </p>
        </div>
        <div className="px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">Source</p>
          <p className="mt-2 font-mono text-xs text-(--color-text-secondary)">On-chain via Blockscout</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">Transaction Activity</p>
        <div className="mt-4">
          <ActivityChart events={chartEvents} />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between border-b border-(--color-border) px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-(--color-text-primary)">Transaction log</h3>
            <p className="text-xs text-(--color-text-muted)">Latest activity across every indexed agent</p>
          </div>
          <span className="font-mono text-xs text-(--color-text-muted)">{transactions.length} transactions</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-(--color-magenta-500) border-t-transparent" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-(--color-text-secondary)">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--color-border) bg-(--color-bg-secondary)">
                  <th className="px-3 py-2.5 text-left font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Time</th>
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
                  <tr key={`${tx.tx_hash}-${tx.agent_id}`} className="border-b border-(--color-border) transition-colors hover:bg-(--color-magenta-50)">
                    <td
                      className="px-3 py-2 font-mono text-[11px] text-(--color-text-muted) whitespace-nowrap"
                      title={`${new Date(tx.block_timestamp).toLocaleString()} (${formatRelativeTime(tx.block_timestamp)} ago)`}
                    >
                      {formatCompactDateTime(tx.block_timestamp)}
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/agents/${tx.agent_id}`} className="font-mono text-xs font-medium text-(--color-magenta-700) hover:underline">#{tx.agent_id}</Link>
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
                      <a href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-(--color-text-muted) hover:text-(--color-magenta-700)">
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
