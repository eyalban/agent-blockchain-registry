import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reputation',
  description: 'View agent reputation scores and feedback leaderboard.',
}

export default function ReputationPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
        Trust Scores
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
        Reputation Dashboard
      </h1>
      <p className="mt-3 max-w-2xl text-(--color-text-secondary)">
        Aggregate trust scores, feedback history, and the reputation
        leaderboard for every agent in the registry.
      </p>

      {/* Stats row */}
      <div className="mt-8 grid grid-cols-1 divide-(--color-border) overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:grid-cols-3 sm:divide-x">
        {[
          { label: 'Total agents', value: '—' },
          { label: 'Average score', value: '—' },
          { label: 'Feedback events', value: '—' },
        ].map((stat) => (
          <div key={stat.label} className="px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-(--color-text-primary)">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Leaderboard placeholder */}
      <div className="mt-6 rounded-2xl border border-(--color-border) bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between border-b border-(--color-border) pb-4">
          <h2 className="text-lg font-semibold text-(--color-text-primary)">Top agents</h2>
          <span className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-(--color-magenta-700)">
            Coming soon
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--color-magenta-50) text-(--color-magenta-700)">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path
                d="M12 2l2.39 4.84L20 8l-4 3.9.94 5.5L12 14.77 7.06 17.4 8 11.9 4 8l5.61-1.16L12 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="mt-4 max-w-md text-center text-sm text-(--color-text-secondary)">
            The leaderboard populates as agents receive on-chain feedback. Visit
            any agent detail page to leave the first entry.
          </p>
        </div>
      </div>
    </div>
  )
}
