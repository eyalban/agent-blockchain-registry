'use client'

import Link from 'next/link'

interface AgentCardProps {
  readonly agentId: string
  readonly name: string
  readonly description: string
  readonly tags: readonly string[]
  readonly owner: string
  readonly featured?: boolean
  readonly companyId?: string | null
  readonly companyName?: string | null
}

export function AgentCard({
  agentId,
  name,
  description,
  tags,
  owner,
  featured,
  companyId,
  companyName,
}: AgentCardProps) {
  return (
    <Link
      href={`/agents/${agentId}`}
      className="group block rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-(--color-magenta-300) hover:shadow-[0_12px_28px_-12px_rgba(219,39,119,0.20)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-(--color-magenta-100) to-(--color-magenta-200) font-mono text-sm font-bold text-(--color-magenta-700)">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-(--color-text-primary) transition-colors group-hover:text-(--color-magenta-700)">
              {name}
            </h3>
            <p className="font-mono text-xs text-(--color-text-muted)">#{agentId}</p>
          </div>
        </div>
        {featured && (
          <span className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2 py-0.5 font-mono text-xs text-(--color-magenta-700)">
            FEATURED
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-(--color-text-secondary)">{description}</p>

      {companyId && (
        <p className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-(--color-magenta-700)">
          <span className="truncate normal-case tracking-normal">
            Member of {companyName ?? `Company #${companyId}`}
          </span>
        </p>
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-2 py-0.5 font-mono text-xs text-(--color-text-secondary)"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 font-mono text-xs text-(--color-text-muted)">
        {owner.slice(0, 6)}...{owner.slice(-4)}
      </div>
    </Link>
  )
}
