'use client'

import dynamic from 'next/dynamic'

import { useRecentEvents } from '@/hooks/use-recent-events'
import { EventTable } from '@/components/explorer/event-table'

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

export function ExplorerView() {
  const { events, isLoading } = useRecentEvents(50000n)

  return (
    <div>
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 glow-cyan-sm">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
            Events Found
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-(--color-accent-cyan)">
            {isLoading ? '...' : events.length}
          </p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
            Network
          </p>
          <p className="mt-1 flex items-center gap-2 font-mono text-sm text-(--color-text-primary)">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent-green) opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-accent-green)" />
            </span>
            Base Sepolia
          </p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
            Contract
          </p>
          <p className="mt-1 font-mono text-xs text-(--color-text-secondary) break-all">
            0xC02D...F64C
          </p>
        </div>
      </div>

      {/* Activity chart */}
      <div className="mt-8 gradient-border rounded-2xl bg-(--color-surface) p-6">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
          Registration Activity
        </h3>
        <div className="mt-4">
          <ActivityChart events={events} />
        </div>
      </div>

      {/* Event log */}
      <div className="mt-8 gradient-border rounded-2xl bg-(--color-surface) p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent-green) opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-accent-green)" />
            </span>
            <h3 className="text-lg font-semibold text-(--color-text-primary)">Event Log</h3>
          </div>
          <span className="font-mono text-xs text-(--color-text-muted)">
            Last 50,000 blocks
          </span>
        </div>
        <div className="mt-4">
          <EventTable events={events} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
