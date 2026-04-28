'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { AgentListItem } from '@/hooks/use-agents'
import { AgentCard } from '@/components/agents/agent-card'

interface AgentsListProps {
  readonly initialAgents: readonly AgentListItem[]
}

export function AgentsList({ initialAgents }: AgentsListProps) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? initialAgents.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.description.toLowerCase().includes(search.toLowerCase()) ||
          a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
      )
    : initialAgents

  return (
    <div>
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name, description, or tags..."
            className="w-full rounded-xl border border-(--color-border) bg-white px-4 py-3 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
          />
        </div>
      </div>

      <p className="mt-4 font-mono text-xs text-(--color-text-muted)">
        {filtered.length} agent{filtered.length !== 1 ? 's' : ''} found
        {search.trim() ? ` for "${search}"` : ''}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) py-16">
            <h3 className="text-lg font-semibold text-(--color-text-primary)">
              {search.trim() ? 'No matching agents' : 'No agents registered yet'}
            </h3>
            <p className="mt-2 max-w-sm text-center text-sm text-(--color-text-secondary)">
              {search.trim()
                ? 'Try a different search term.'
                : 'Be the first to register an agent on the registry.'}
            </p>
            {!search.trim() && (
              <Link
                href="/register"
                className="mt-6 inline-block rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-4 py-2 text-sm font-medium text-(--color-magenta-700) transition-colors hover:bg-(--color-magenta-100)"
              >
                Register an Agent
              </Link>
            )}
          </div>
        ) : (
          filtered.map((agent) => (
            <AgentCard
              key={agent.agentId}
              agentId={agent.agentId}
              name={agent.name}
              description={agent.description}
              tags={agent.tags}
              owner={agent.owner}
            />
          ))
        )}
      </div>
    </div>
  )
}
