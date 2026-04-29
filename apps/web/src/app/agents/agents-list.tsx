'use client'

import Link from 'next/link'
import { useState } from 'react'

import { AgentCard } from '@/components/agents/agent-card'
import { useViewMode, ViewToggle } from '@/components/ui/view-toggle'
import type { AgentListItem } from '@/hooks/use-agents'
import { truncateAddress } from '@/lib/utils'

interface AgentsListProps {
  readonly initialAgents: readonly AgentListItem[]
}

export function AgentsList({ initialAgents }: AgentsListProps) {
  const [search, setSearch] = useState('')
  const [view, setView] = useViewMode('statem8.agents.view')

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
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name, description, or tags..."
            className="w-full rounded-xl border border-(--color-border) bg-white px-4 py-3 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
          />
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      <p className="mt-4 font-mono text-xs text-(--color-text-muted)">
        {filtered.length} agent{filtered.length !== 1 ? 's' : ''} found
        {search.trim() ? ` for "${search}"` : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--color-border-bright) bg-white py-16">
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
              className="mt-6 inline-block rounded-full bg-(--color-magenta-700) px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-magenta-800)"
            >
              Register an Agent
            </Link>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.agentId}
              agentId={agent.agentId}
              name={agent.name}
              description={agent.description}
              tags={agent.tags}
              owner={agent.owner}
              companyId={agent.companyId}
              companyName={agent.companyName}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <table className="w-full">
            <thead className="border-b border-(--color-border) bg-(--color-bg-secondary)">
              <tr>
                <Th>Agent</Th>
                <Th>ID</Th>
                <Th>Tags</Th>
                <Th>Owner</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent) => (
                <tr
                  key={agent.agentId}
                  className="border-b border-(--color-border) last:border-b-0 transition-colors hover:bg-(--color-magenta-50)"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/agents/${agent.agentId}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-(--color-magenta-100) to-(--color-magenta-200) font-mono text-xs font-bold text-(--color-magenta-700)"
                      >
                        {agent.name.slice(0, 2).toUpperCase()}
                      </Link>
                      <div className="min-w-0">
                        <Link
                          href={`/agents/${agent.agentId}`}
                          className="block truncate text-sm font-medium text-(--color-text-primary) hover:text-(--color-magenta-700)"
                        >
                          {agent.name}
                        </Link>
                        <span className="block truncate text-xs text-(--color-text-secondary)">
                          {agent.description || 'No description'}
                        </span>
                        {agent.companyId && (
                          <Link
                            href={`/companies/${agent.companyId}`}
                            className="mt-1 inline-block rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2 py-0.5 text-[10px] font-medium text-(--color-magenta-700) hover:bg-(--color-magenta-100)"
                          >
                            Member of {agent.companyName ?? `Company #${agent.companyId}`}
                          </Link>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-(--color-text-muted)">
                    #{agent.agentId}
                  </td>
                  <td className="px-4 py-3.5">
                    {agent.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {agent.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2 py-0.5 font-mono text-[10px] text-(--color-magenta-700)"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-(--color-text-muted)">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-(--color-text-secondary)">
                    {truncateAddress(agent.owner as `0x${string}`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { readonly children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
      {children}
    </th>
  )
}
