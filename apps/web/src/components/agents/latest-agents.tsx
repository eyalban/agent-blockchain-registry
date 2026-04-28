import Link from 'next/link'

import { getAgentsPage } from '@/lib/agents-cache'

export async function LatestAgents({ limit = 6 }: { readonly limit?: number }) {
  const { data } = await getAgentsPage(limit, 0).catch(() => ({ data: [] }))
  const agents = data.map((a) => ({
    agentId: a.agentId,
    owner: a.owner,
    name: a.name ?? `Agent #${a.agentId}`,
    description: a.description ?? '',
  }))

  return (
    <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between border-b border-(--color-border) px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-(--color-text-primary)">
            Recently registered agents
          </h3>
          <p className="text-xs text-(--color-text-muted)">
            Live from the IdentityRegistry on Base Sepolia
          </p>
        </div>
        <Link
          href="/agents"
          className="text-sm font-medium text-(--color-magenta-700) hover:text-(--color-magenta-800)"
        >
          View all &rarr;
        </Link>
      </div>
      <ul className="divide-y divide-(--color-border)">
        {agents.length === 0 ? (
          <li className="px-6 py-10 text-center text-sm text-(--color-text-muted)">
            No agents registered yet.
          </li>
        ) : (
          agents.map((a) => (
            <li key={a.agentId}>
              <Link
                href={`/agents/${a.agentId}`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-(--color-magenta-50)"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-(--color-magenta-100) to-(--color-magenta-200) font-mono text-xs font-bold text-(--color-magenta-700)">
                  {a.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate text-sm font-medium text-(--color-text-primary)">
                      {a.name}
                    </p>
                    <p className="font-mono text-xs text-(--color-text-muted)">
                      #{a.agentId}
                    </p>
                  </div>
                  <p className="truncate text-xs text-(--color-text-secondary)">
                    {a.description || 'No description'}
                  </p>
                </div>
                <p className="hidden font-mono text-xs text-(--color-text-muted) sm:block">
                  {a.owner.slice(0, 6)}…{a.owner.slice(-4)}
                </p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
