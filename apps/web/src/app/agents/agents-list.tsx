'use client'

import { useState } from 'react'
import Link from 'next/link'

import { useAgents } from '@/hooks/use-agents'
import { AgentCard } from '@/components/agents/agent-card'

export function AgentsList() {
  const { agents, isLoading } = useAgents()
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.description.toLowerCase().includes(search.toLowerCase()) ||
          a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
      )
    : agents

  return (
    <div>
      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name, description, or tags..."
            className="w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) transition-all duration-200 focus:border-(--color-accent-cyan) focus:outline-none focus:ring-1 focus:ring-(--color-accent-cyan) focus:glow-cyan-sm"
          />
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="mt-4 font-mono text-xs text-(--color-text-muted)">
          {filtered.length} agent{filtered.length !== 1 ? 's' : ''} found
          {search.trim() ? ` for "${search}"` : ''}
        </p>
      )}

      {/* Agent grid */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-(--color-border) bg-(--color-surface)/40 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-(--color-border)" />
                <div className="flex-1">
                  <div className="h-4 w-24 rounded bg-(--color-border)" />
                  <div className="mt-1.5 h-3 w-16 rounded bg-(--color-border)/60" />
                </div>
              </div>
              <div className="mt-4 h-3 w-full rounded bg-(--color-border)/60" />
              <div className="mt-2 h-3 w-3/4 rounded bg-(--color-border)/60" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-(--color-surface) glow-cyan-sm">
              <span className="text-3xl">🤖</span>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-(--color-text-primary)">
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
                className="mt-6 inline-block rounded-lg border border-(--color-accent-cyan)/20 bg-(--color-accent-cyan)/5 px-4 py-2 text-sm font-medium text-(--color-accent-cyan) transition-colors hover:bg-(--color-accent-cyan)/10"
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
