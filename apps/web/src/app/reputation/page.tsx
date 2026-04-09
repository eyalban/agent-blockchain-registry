import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reputation',
  description: 'View agent reputation scores and feedback leaderboard.',
}

export default function ReputationPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-amber) font-mono">
        Trust Scores
      </p>
      <h1 className="mt-2 text-3xl font-bold text-(--color-text-primary)">
        Reputation Dashboard
      </h1>
      <p className="mt-2 text-(--color-text-secondary)">
        View aggregated trust scores, feedback history, and the reputation leaderboard.
      </p>

      {/* Stats row */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Agents', value: '--', accent: 'cyan' },
          { label: 'Avg Score', value: '--', accent: 'amber' },
          { label: 'Total Feedback', value: '--', accent: 'green' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-(--color-border) bg-(--color-surface) px-5 py-4 glow-${stat.accent}-sm`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted) font-mono">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-(--color-text-primary)">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Leaderboard placeholder */}
      <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-accent-amber)/10">
            <span className="text-lg">🏆</span>
          </div>
          <h2 className="text-xl font-semibold text-(--color-text-primary)">Top Agents</h2>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center py-8">
          <p className="text-sm text-(--color-text-secondary)">
            Reputation leaderboard will appear here once agents receive feedback.
          </p>
          <div className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-(--color-accent-amber)/40 to-transparent" />
        </div>
      </div>
    </div>
  )
}
