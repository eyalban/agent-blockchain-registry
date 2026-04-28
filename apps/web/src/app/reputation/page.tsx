import type { Metadata } from 'next'
import Link from 'next/link'

import { KpiStrip } from '@/components/ui/kpi-strip'
import {
  getAgentStats,
  getTopAgents,
} from '@/lib/aggregate-stats'

export const metadata: Metadata = {
  title: 'Reputation',
  description: 'Trust scores and the on-chain feedback leaderboard.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ReputationPage() {
  const [agentStats, leaders] = await Promise.all([
    getAgentStats(),
    getTopAgents(15),
  ])

  const totalFeedback = leaders.reduce((sum, l) => sum + l.feedbackCount, 0)
  const top = leaders[0]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
        Trust Scores
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
        Reputation Dashboard
      </h1>
      <p className="mt-3 max-w-2xl text-(--color-text-secondary)">
        Aggregate trust scores across the registry. Feedback events are
        recorded on-chain via the ERC-8004 ReputationRegistry and follow each
        agent across every client that speaks the standard.
      </p>

      <div className="mt-8">
        <KpiStrip
          cells={[
            { label: 'Total agents', value: agentStats.total.toLocaleString() },
            {
              label: 'Feedback events',
              value: totalFeedback.toLocaleString(),
              sub: 'Top 15 indexed',
            },
            {
              label: 'Top of leaderboard',
              value: top
                ? top.name ?? `Agent #${top.agentId}`
                : '—',
              sub: top
                ? `${top.feedbackCount.toLocaleString()} reviews`
                : undefined,
            },
            { label: 'Indexer', value: 'Live', sub: 'Base Sepolia' },
          ]}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between border-b border-(--color-border) px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-(--color-text-primary)">
              Leaderboard
            </h2>
            <p className="text-xs text-(--color-text-muted)">
              Sorted by feedback count, then by agent ID descending
            </p>
          </div>
          <Link
            href="/agents"
            className="text-sm font-medium text-(--color-magenta-700) hover:text-(--color-magenta-800)"
          >
            All agents &rarr;
          </Link>
        </div>

        {leaders.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-(--color-text-muted)">
            No agents indexed yet.
          </div>
        ) : (
          <ol>
            {leaders.map((l, i) => (
              <li
                key={l.agentId}
                className="border-b border-(--color-border) last:border-b-0"
              >
                <Link
                  href={`/agents/${l.agentId}`}
                  className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-(--color-magenta-50)"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--color-border) bg-(--color-bg-secondary) font-mono text-xs font-semibold tabular-nums text-(--color-text-secondary)">
                    {i + 1}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-(--color-magenta-100) to-(--color-magenta-200) font-mono text-xs font-bold text-(--color-magenta-700)">
                    {(l.name ?? l.agentId).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-(--color-text-primary)">
                      {l.name ?? `Agent #${l.agentId}`}
                    </p>
                    <p className="font-mono text-xs text-(--color-text-muted)">
                      #{l.agentId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-(--color-text-primary)">
                      {l.feedbackCount.toLocaleString()}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-(--color-text-muted)">
                      reviews
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-(--color-magenta-200) bg-(--color-magenta-50) p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
          How feedback works
        </p>
        <p className="mt-3 text-sm leading-relaxed text-(--color-text-secondary)">
          Anyone holding an ERC-8004 client can leave feedback for an agent
          they&rsquo;ve transacted with. The score and a CID-addressed memo land
          in the ReputationRegistry contract. Trust scores are portable — they
          follow the agent across every product that reads the same registry.
        </p>
      </div>
    </div>
  )
}
