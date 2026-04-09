'use client'

import Link from 'next/link'

import { TX_EXPLORER_URL } from '@agent-registry/shared'

import type { RegistryEvent } from '@/hooks/use-recent-events'

interface EventTableProps {
  readonly events: readonly RegistryEvent[]
  readonly isLoading: boolean
}

export function EventTable({ events, isLoading }: EventTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-(--color-accent-cyan) border-t-transparent" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-(--color-text-secondary)">No events found yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-(--color-border)">
            <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
              Type
            </th>
            <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
              Agent
            </th>
            <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
              Block
            </th>
            <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
              Tx Hash
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={`${event.transactionHash}-${event.agentId}`}
              className="border-b border-(--color-border)/50 transition-colors hover:bg-(--color-surface-hover)"
            >
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-(--color-accent-cyan)/20 bg-(--color-accent-cyan)/5 px-2 py-0.5 font-mono text-xs text-(--color-accent-cyan)">
                  <span className="h-1.5 w-1.5 rounded-full bg-(--color-accent-cyan)" />
                  {event.type}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/agents/${event.agentId.toString()}`}
                  className="font-mono text-(--color-accent-violet-bright) hover:underline"
                >
                  #{event.agentId.toString()}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-(--color-text-secondary)">
                {event.blockNumber.toString()}
              </td>
              <td className="px-4 py-3">
                <a
                  href={TX_EXPLORER_URL(84532, event.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-(--color-text-secondary) transition-colors hover:text-(--color-accent-cyan)"
                >
                  {event.transactionHash.slice(0, 10)}...{event.transactionHash.slice(-6)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
