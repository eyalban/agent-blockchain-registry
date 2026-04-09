import type { Metadata } from 'next'

import { AgentsList } from './agents-list'

export const metadata: Metadata = {
  title: 'Agent Registry',
  description: 'Browse all registered AI agents on Base blockchain.',
}

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-cyan)">
          Registry
        </p>
        <h1 className="mt-2 text-3xl font-bold text-(--color-text-primary)">
          Agent Registry
        </h1>
        <p className="mt-2 text-(--color-text-secondary)">
          Browse and discover registered AI agents on Base.
        </p>
      </div>

      <div className="mt-8">
        <AgentsList />
      </div>
    </div>
  )
}
