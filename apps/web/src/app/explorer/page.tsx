import type { Metadata } from 'next'

import { ExplorerView } from './explorer-view'

export const metadata: Metadata = {
  title: 'Transaction Explorer',
  description: 'Explore all on-chain transactions for registered AI agents.',
}

export default function ExplorerPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-violet-bright)">
        Explorer
      </p>
      <h1 className="mt-2 text-3xl font-bold text-(--color-text-primary)">
        Transaction Explorer
      </h1>
      <p className="mt-2 text-(--color-text-secondary)">
        View all on-chain events, registration activity, and analytics for registered agents.
      </p>

      <div className="mt-8">
        <ExplorerView />
      </div>
    </div>
  )
}
