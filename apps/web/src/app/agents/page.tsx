import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agent Registry',
  description: 'Browse all registered AI agents on Base blockchain.',
}

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-cyan) font-mono">
            Registry
          </p>
          <h1 className="mt-2 text-3xl font-bold text-(--color-text-primary)">
            Agent Registry
          </h1>
          <p className="mt-2 text-(--color-text-secondary)">
            Browse and discover registered AI agents on Base.
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mt-8 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search agents by name, description, or tags..."
            className="w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) transition-all duration-200 focus:border-(--color-accent-cyan) focus:outline-none focus:ring-1 focus:ring-(--color-accent-cyan) focus:glow-cyan-sm"
          />
        </div>
      </div>

      {/* Agent grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Empty state */}
        <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-(--color-surface) glow-cyan-sm">
            <span className="text-3xl">🤖</span>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-(--color-text-primary)">
            No agents registered yet
          </h3>
          <p className="mt-2 max-w-sm text-center text-sm text-(--color-text-secondary)">
            Be the first to register an agent on the registry.
          </p>
          <div className="mt-6">
            <span className="inline-block rounded-lg border border-(--color-accent-cyan)/20 bg-(--color-accent-cyan)/5 px-4 py-2 text-sm font-medium text-(--color-accent-cyan)">
              Register an Agent
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
