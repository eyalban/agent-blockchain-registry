'use client'

import Link from 'next/link'

import { useCompaniesList } from '@/hooks/use-company'
import { truncateAddress } from '@/lib/utils'

export function CompaniesList() {
  const { data, total, isLoading } = useCompaniesList()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl border border-(--color-border) bg-(--color-surface)"
          />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) p-12 text-center">
        <p className="text-sm text-(--color-text-secondary)">
          No companies yet. Be the first to{' '}
          <Link href="/companies/new" className="text-(--color-accent-cyan) hover:underline">
            create one
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 font-mono text-xs text-(--color-text-muted)">
        {total} {total === 1 ? 'company' : 'companies'}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((c) => (
          <Link
            key={c.companyId}
            href={`/companies/${c.companyId}`}
            className="group rounded-xl border border-(--color-border) bg-(--color-surface) p-5 transition-colors hover:border-(--color-accent-cyan)/50"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-(--color-accent-cyan) to-(--color-accent-violet) text-sm font-bold text-white">
                {(c.name ?? 'CO').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-(--color-text-primary) group-hover:text-(--color-accent-cyan)">
                  {c.name ?? `Company #${c.companyId}`}
                </h3>
                <p className="mt-0.5 font-mono text-[11px] text-(--color-text-muted)">
                  #{c.companyId}
                  {c.jurisdictionCode && (
                    <>
                      {' · '}
                      <span className="text-(--color-text-secondary)">
                        {c.jurisdictionCode}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            {c.description && (
              <p className="mt-3 line-clamp-2 text-sm text-(--color-text-secondary)">
                {c.description}
              </p>
            )}
            <p className="mt-3 font-mono text-[10px] text-(--color-text-muted)">
              Owner {truncateAddress(c.ownerAddress)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
