'use client'

import { useState } from 'react'
import Link from 'next/link'

import { useAgentDetail } from '@/hooks/use-agent-detail'
import { useAgentTags } from '@/hooks/use-agent-tags'
import { useReputationSummary } from '@/hooks/use-reputation-summary'
import {
  truncateAddress,
  formatRelativeTime,
  formatCompactDateTime,
  formatEthValue,
} from '@/lib/utils'
import { ADDRESS_EXPLORER_URL } from '@agent-registry/shared'
import { FeedbackForm } from '@/components/reputation/feedback-form'
import { TrustScore } from '@/components/reputation/trust-score'
import { IncomeStatementCard } from '@/components/financials/income-statement-card'
import { useIncomeStatement } from '@/hooks/use-income-statement'
import { useAgentTransactions } from '@/hooks/use-agent-transactions'
import { useWalletNames } from '@/hooks/use-wallet-names'

interface AgentDetailViewProps {
  readonly agentId: string
}

type Tab = 'overview' | 'reputation' | 'transactions' | 'financials' | 'validations'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'reputation', label: 'Reputation' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'financials', label: 'Financials' },
  { id: 'validations', label: 'Validations' },
]

export function AgentDetailView({ agentId }: AgentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const agentIdBigInt = BigInt(agentId)

  const { tokenURI, owner, isLoading } = useAgentDetail(agentIdBigInt)
  const { tags } = useAgentTags(agentIdBigInt)
  const { count, summaryValue, summaryValueDecimals } = useReputationSummary(agentIdBigInt)
  const { data: financialData, isLoading: financialsLoading } = useIncomeStatement(agentId)
  const { transactions, isLoading: txLoading, isSyncing, sync } = useAgentTransactions(agentId)
  const walletNames = useWalletNames(transactions.map((tx) => tx.counterparty))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-magenta-500) border-t-transparent" />
      </div>
    )
  }

  // Parse agent card from tokenURI if it's a data URI
  let agentCard: { name?: string; description?: string; image?: string } = {}
  if (tokenURI?.startsWith('data:application/json;base64,')) {
    try {
      agentCard = JSON.parse(atob(tokenURI.split(',')[1] ?? ''))
    } catch {
      // ignore parse errors
    }
  }

  const agentName = agentCard.name ?? `Agent #${agentId}`

  return (
    <div>
      {/* Back link */}
      <Link
        href="/agents"
        className="inline-flex items-center gap-1 text-sm text-(--color-text-secondary) transition-colors hover:text-(--color-magenta-700)"
      >
        ← Back to Registry
      </Link>

      {/* Agent header */}
      <div className="mt-5 rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-(--color-magenta-500) to-(--color-magenta-700) text-2xl font-semibold text-white shadow-[0_8px_20px_-8px_rgba(219,39,119,0.40)]">
            {agentName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-(--color-text-primary)">
              {agentName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-(--color-text-secondary)">
              <span className="font-mono text-(--color-text-muted)">Agent #{agentId}</span>
              {owner && (
                <>
                  <span className="text-(--color-border-bright)">·</span>
                  <a
                    href={ADDRESS_EXPLORER_URL(84532, owner)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono transition-colors hover:text-(--color-magenta-700)"
                  >
                    Owner: {truncateAddress(owner)}
                  </a>
                </>
              )}
            </div>
            {tags && tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2.5 py-0.5 font-mono text-xs font-medium text-(--color-magenta-700)"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* KPI strip */}
      <div className="mt-4 grid grid-cols-2 divide-(--color-border) overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:grid-cols-4 sm:divide-x">
        <KpiCell
          label="Feedback events"
          value={count !== undefined ? count.toString() : '—'}
        />
        <KpiCell
          label="Trust score"
          value={
            summaryValue !== undefined && summaryValueDecimals !== undefined
              ? (Number(summaryValue) / 10 ** summaryValueDecimals).toFixed(2)
              : '—'
          }
        />
        <KpiCell
          label="On-chain txs"
          value={transactions.length.toLocaleString()}
        />
        <KpiCell
          label="Last activity"
          value={
            transactions.length > 0
              ? formatRelativeTime(transactions[0]!.block_timestamp)
              : '—'
          }
          sub={
            transactions.length > 0
              ? formatCompactDateTime(transactions[0]!.block_timestamp)
              : undefined
          }
        />
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-(--color-border)">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-(--color-magenta-700) text-(--color-magenta-700)'
                  : 'border-b-2 border-transparent text-(--color-text-secondary) hover:text-(--color-text-primary)'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="py-6">
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-2">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
                Description
              </p>
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-primary)">
                {agentCard.description || 'No description provided.'}
              </p>
            </div>
            <div className="rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                Agent URI
              </p>
              <p className="mt-3 break-all font-mono text-xs text-(--color-text-secondary)">
                {tokenURI
                  ? tokenURI.length > 120
                    ? tokenURI.slice(0, 120) + '…'
                    : tokenURI
                  : '—'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'reputation' && (
          <div className="space-y-6">
            {/* Trust score overview */}
            <TrustScore
              count={count}
              summaryValue={summaryValue}
              summaryValueDecimals={summaryValueDecimals}
            />

            {/* Give feedback */}
            <div className="rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
                Give Feedback
              </p>
              <div className="mt-4">
                <FeedbackForm agentId={agentIdBigInt} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
                On-Chain Transactions
              </p>
              <button
                type="button"
                onClick={sync}
                disabled={isSyncing}
                className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-3.5 py-1.5 font-mono text-xs font-medium text-(--color-magenta-700) transition-colors hover:bg-(--color-magenta-100) disabled:opacity-50"
              >
                {isSyncing ? 'Syncing…' : 'Sync from chain'}
              </button>
            </div>

            {txLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-(--color-magenta-500) border-t-transparent" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-(--color-border-bright) bg-white p-10 text-center">
                <p className="text-sm text-(--color-text-secondary)">
                  No transactions found. Click &ldquo;Sync from chain&rdquo; to scan the blockchain.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-(--color-border)">
                      <th className="px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Time</th>
                      <th className="px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Dir</th>
                      <th className="px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Label</th>
                      <th className="px-3 py-3 text-right font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Amount (ETH)</th>
                      <th className="px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Counterparty</th>
                      <th className="px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.tx_hash} className="border-b border-(--color-border)/40 transition-colors hover:bg-(--color-surface-hover)">
                        <td
                          className="px-3 py-2.5 font-mono text-[11px] text-(--color-text-muted) whitespace-nowrap"
                          title={`${new Date(tx.block_timestamp).toLocaleString()} (${formatRelativeTime(tx.block_timestamp)} ago)`}
                        >
                          {formatCompactDateTime(tx.block_timestamp)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`font-mono text-xs font-medium ${tx.direction === 'incoming' ? 'text-(--color-accent-green)' : 'text-(--color-accent-red)'}`}>
                            {tx.direction === 'incoming' ? '\u2192 IN' : '\u2190 OUT'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-2 py-0.5 font-mono text-xs text-(--color-text-muted)">
                            {tx.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`font-mono text-xs ${tx.direction === 'incoming' ? 'text-(--color-accent-green)' : 'text-(--color-text-secondary)'}`}>
                            {tx.direction === 'incoming' ? '+' : '-'}{formatEthValue(Number(tx.value_eth))}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div>
                            {walletNames.get(tx.counterparty.toLowerCase()) && (
                              <p className="text-xs text-(--color-text-primary)">
                                {walletNames.get(tx.counterparty.toLowerCase())}
                              </p>
                            )}
                            <p className="font-mono text-[10px] text-(--color-text-muted)">
                              {tx.counterparty.slice(0, 8)}...{tx.counterparty.slice(-4)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <a
                            href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-(--color-text-muted) hover:text-(--color-magenta-700)"
                          >
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
        )}

        {activeTab === 'financials' && (
          <div className="space-y-6">
            <IncomeStatementCard
              data={financialData?.incomeStatement ?? null}
              isLoading={financialsLoading}
              taxComputed={financialData?.taxComputed ?? false}
              taxComputedReason={financialData?.taxComputedReason}
            />
            {financialData?.breakdown && Object.keys(financialData.breakdown).length > 0 && (
              <div className="rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
                  Transaction Breakdown
                </p>
                <div className="mt-4 divide-y divide-(--color-border)">
                  {Object.entries(financialData.breakdown).map(([label, data]) => (
                    <div key={label} className="flex items-center justify-between py-2.5">
                      <span className="rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-2 py-0.5 font-mono text-xs text-(--color-text-secondary)">
                        {label}
                      </span>
                      <span className="font-mono text-sm text-(--color-text-primary)">
                        {(data as { count: number; totalEth: number }).count} txs &middot;{' '}
                        {(data as { count: number; totalEth: number }).totalEth.toFixed(6)} ETH
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'validations' && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--color-border-bright) bg-white py-14">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-magenta-50) text-(--color-magenta-700)">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mt-4 text-sm text-(--color-text-secondary)">
              Validation center coming in Phase 3
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCell({
  label,
  value,
  sub,
}: {
  readonly label: string
  readonly value: string
  readonly sub?: string
}) {
  return (
    <div className="px-6 py-5">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-(--color-text-primary)">
        {value}
      </p>
      {sub && <p className="mt-1 font-mono text-xs text-(--color-text-muted)">{sub}</p>}
    </div>
  )
}
