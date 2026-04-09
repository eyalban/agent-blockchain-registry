'use client'

import Link from 'next/link'

interface AgentCardProps {
  readonly agentId: string
  readonly name: string
  readonly description: string
  readonly tags: readonly string[]
  readonly owner: string
  readonly featured?: boolean
}

export function AgentCard({
  agentId,
  name,
  description,
  tags,
  owner,
  featured,
}: AgentCardProps) {
  return (
    <Link
      href={`/agents/${agentId}`}
      className="gradient-border gradient-border-hover group block rounded-2xl border border-(--color-border) bg-(--color-surface)/40 p-6 backdrop-blur-sm transition-all hover:bg-(--color-surface-hover)"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-(--color-accent-cyan)/20 to-(--color-accent-violet)/20 font-mono text-sm font-bold text-(--color-accent-cyan)">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-(--color-text-primary) transition-colors group-hover:text-(--color-accent-cyan)">
              {name}
            </h3>
            <p className="font-mono text-xs text-(--color-text-muted)">#{agentId}</p>
          </div>
        </div>
        {featured && (
          <span className="rounded-full border border-(--color-accent-amber)/30 bg-(--color-accent-amber)/10 px-2 py-0.5 font-mono text-xs text-(--color-accent-amber)">
            FEATURED
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-(--color-text-secondary)">{description}</p>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-2 py-0.5 font-mono text-xs text-(--color-text-muted)"
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
