'use client'

import { useState } from 'react'
import Link from 'next/link'

import { useAgentDetail } from '@/hooks/use-agent-detail'
import { useAgentTags } from '@/hooks/use-agent-tags'
import { useReputationSummary } from '@/hooks/use-reputation-summary'
import { truncateAddress } from '@/lib/utils'
import { ADDRESS_EXPLORER_URL } from '@agent-registry/shared'
import { FeedbackForm } from '@/components/reputation/feedback-form'
import { TrustScore } from '@/components/reputation/trust-score'

interface AgentDetailViewProps {
  readonly agentId: string
}

type Tab = 'overview' | 'reputation' | 'transactions' | 'validations'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'reputation', label: 'Reputation' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'validations', label: 'Validations' },
]

export function AgentDetailView({ agentId }: AgentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const agentIdBigInt = BigInt(agentId)

  const { tokenURI, owner, isLoading } = useAgentDetail(agentIdBigInt)
  const { tags } = useAgentTags(agentIdBigInt)
  const { count, summaryValue } = useReputationSummary(agentIdBigInt)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-accent-cyan) border-t-transparent" />
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
        className="inline-flex items-center gap-1 text-sm text-(--color-text-secondary) transition-colors hover:text-(--color-accent-cyan)"
      >
        ← Back to Registry
      </Link>

      {/* Agent header */}
      <div className="mt-4 flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-(--color-accent-cyan) to-(--color-accent-violet) text-2xl font-bold text-white glow-cyan">
          {agentName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-(--color-text-primary)">{agentName}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-(--color-text-secondary)">
            <span className="font-mono text-(--color-text-muted)">Agent #{agentId}</span>
            {owner && (
              <>
                <span className="text-(--color-border-bright)">·</span>
                <a
                  href={ADDRESS_EXPLORER_URL(84532, owner)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono transition-colors hover:text-(--color-accent-cyan)"
                >
                  Owner: {truncateAddress(owner)}
                </a>
              </>
            )}
          </div>
          {tags && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-(--color-accent-cyan)/20 bg-(--color-accent-cyan)/5 px-2 py-0.5 text-xs font-medium text-(--color-accent-cyan) font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="hidden gap-4 sm:flex">
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-2 text-center glow-cyan-sm">
            <p className="text-lg font-bold text-(--color-text-primary)">
              {count !== undefined ? count.toString() : '—'}
            </p>
            <p className="text-xs text-(--color-text-muted) font-mono uppercase tracking-[0.1em]">
              Feedback
            </p>
          </div>
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-2 text-center glow-amber">
            <p className="text-lg font-bold text-(--color-accent-amber)">
              {summaryValue !== undefined ? summaryValue.toString() : '—'}
            </p>
            <p className="text-xs text-(--color-text-muted) font-mono uppercase tracking-[0.1em]">
              Score
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-(--color-border)">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-(--color-accent-cyan) text-(--color-accent-cyan) text-glow-cyan'
                  : 'text-(--color-text-muted) hover:text-(--color-text-secondary)'
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
          <div className="space-y-6">
            {agentCard.description && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted) font-mono">
                  Description
                </h3>
                <p className="mt-2 text-(--color-text-primary)">{agentCard.description}</p>
              </div>
            )}
            {tokenURI && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted) font-mono">
                  Agent URI
                </h3>
                <p className="mt-2 break-all font-mono text-sm text-(--color-text-secondary)">
                  {tokenURI.length > 100 ? tokenURI.slice(0, 100) + '...' : tokenURI}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reputation' && (
          <div className="space-y-8">
            {/* Trust score overview */}
            <TrustScore
              count={count}
              summaryValue={summaryValue}
              summaryValueDecimals={undefined}
            />

            {/* Give feedback */}
            <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent-amber)">
                Give Feedback
              </h3>
              <div className="mt-4">
                <FeedbackForm agentId={agentIdBigInt} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent-violet-bright)">
              On-Chain Activity
            </h3>
            <p className="mt-2 text-sm text-(--color-text-secondary)">
              Registration and activity events for this agent on Base Sepolia.
            </p>
            <div className="mt-4">
              <a
                href={`https://sepolia.basescan.org/address/${owner ?? ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-(--color-accent-cyan)/20 bg-(--color-accent-cyan)/5 px-4 py-2 font-mono text-xs text-(--color-accent-cyan) transition-colors hover:bg-(--color-accent-cyan)/10"
              >
                View all transactions on BaseScan &rarr;
              </a>
            </div>
          </div>
        )}

        {activeTab === 'validations' && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-(--color-border) bg-(--color-bg-secondary) py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-accent-green)/10">
              <span className="text-2xl">✅</span>
            </div>
            <p className="mt-3 text-sm text-(--color-text-secondary)">
              Validation center coming in Phase 3
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
