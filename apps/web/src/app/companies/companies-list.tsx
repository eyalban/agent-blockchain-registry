'use client'

import Link from 'next/link'

import { useViewMode, ViewToggle } from '@/components/ui/view-toggle'
import { useCompaniesList } from '@/hooks/use-company'
import { truncateAddress } from '@/lib/utils'

export function CompaniesList() {
  const { data, total, isLoading } = useCompaniesList()
  const [view, setView] = useViewMode('statem8.companies.view')

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-(--color-border-bright) bg-white p-14 text-center">
        <p className="text-sm text-(--color-text-secondary)">
          No companies yet. Be the first to{' '}
          <Link href="/companies/new" className="font-medium text-(--color-magenta-700) hover:underline">
            create one
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-mono text-xs text-(--color-text-muted)">
          {total} {total === 1 ? 'company' : 'companies'}
        </p>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {view === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <Link
              key={c.companyId}
              href={`/companies/${c.companyId}`}
              className="group block rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-(--color-magenta-300) hover:shadow-[0_12px_28px_-12px_rgba(219,39,119,0.20)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-(--color-magenta-500) to-(--color-magenta-700) text-sm font-semibold text-white">
                  {(c.name ?? 'CO').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-(--color-text-primary) transition-colors group-hover:text-(--color-magenta-700)">
                    {c.name ?? `Company #${c.companyId}`}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="font-mono text-[11px] text-(--color-text-muted)">
                      #{c.companyId}
                    </p>
                    {c.jurisdictionCode && (
                      <span className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-(--color-magenta-700)">
                        {c.jurisdictionCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {c.description && (
                <p className="mt-4 line-clamp-2 text-sm text-(--color-text-secondary)">
                  {c.description}
                </p>
              )}
              <p className="mt-4 font-mono text-[10px] text-(--color-text-muted)">
                Owner {truncateAddress(c.ownerAddress)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <table className="w-full">
            <thead className="border-b border-(--color-border) bg-(--color-bg-secondary)">
              <tr>
                <Th>Company</Th>
                <Th>ID</Th>
                <Th>Jurisdiction</Th>
                <Th>Owner</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr
                  key={c.companyId}
                  className="border-b border-(--color-border) last:border-b-0 transition-colors hover:bg-(--color-magenta-50)"
                >
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/companies/${c.companyId}`}
                      className="flex items-center gap-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-(--color-magenta-500) to-(--color-magenta-700) font-mono text-xs font-bold text-white">
                        {(c.name ?? 'CO').slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-(--color-text-primary)">
                          {c.name ?? `Company #${c.companyId}`}
                        </span>
                        <span className="block truncate text-xs text-(--color-text-secondary)">
                          {c.description ?? 'No description'}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-(--color-text-muted)">
                    #{c.companyId}
                  </td>
                  <td className="px-4 py-3.5">
                    {c.jurisdictionCode ? (
                      <span className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-(--color-magenta-700)">
                        {c.jurisdictionCode}
                      </span>
                    ) : (
                      <span className="text-xs text-(--color-text-muted)">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-(--color-text-secondary)">
                    {truncateAddress(c.ownerAddress)}
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
