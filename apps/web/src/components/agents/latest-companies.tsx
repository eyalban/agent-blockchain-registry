'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface CompanyRow {
  readonly companyId: string
  readonly name: string | null
  readonly description: string | null
  readonly jurisdictionCode: string | null
  readonly founderAddress: string
}

export function LatestCompanies({ limit = 4 }: { readonly limit?: number }) {
  const [companies, setCompanies] = useState<CompanyRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/v1/companies?limit=${limit}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { data?: CompanyRow[] } | null) => {
        if (!cancelled) setCompanies(data?.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setCompanies([])
      })
    return () => {
      cancelled = true
    }
  }, [limit])

  return (
    <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between border-b border-(--color-border) px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-(--color-text-primary)">
            Recently created companies
          </h3>
          <p className="text-xs text-(--color-text-muted)">
            Each one consolidates N agents and M treasury wallets
          </p>
        </div>
        <Link
          href="/companies"
          className="text-sm font-medium text-(--color-magenta-700) hover:text-(--color-magenta-800)"
        >
          View all &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-1 divide-y divide-(--color-border) sm:grid-cols-2 sm:divide-y-0">
        {companies === null ? (
          Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="space-y-2 px-6 py-5 sm:border-b sm:border-(--color-border)">
              <div className="h-4 w-40 animate-pulse rounded bg-(--color-border)" />
              <div className="h-3 w-56 animate-pulse rounded bg-(--color-border)/60" />
            </div>
          ))
        ) : companies.length === 0 ? (
          <div className="col-span-full px-6 py-10 text-center text-sm text-(--color-text-muted)">
            No companies created yet.
          </div>
        ) : (
          companies.slice(0, limit).map((c, idx) => (
            <Link
              key={c.companyId}
              href={`/companies/${c.companyId}`}
              className={`block px-6 py-5 transition-colors hover:bg-(--color-magenta-50) ${
                idx < companies.length - (companies.length % 2 === 0 ? 2 : 1)
                  ? 'sm:border-b sm:border-(--color-border)'
                  : ''
              } ${idx % 2 === 0 ? 'sm:border-r sm:border-(--color-border)' : ''}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-semibold text-(--color-text-primary)">
                  {c.name ?? `Company #${c.companyId}`}
                </p>
                <p className="shrink-0 font-mono text-xs text-(--color-text-muted)">
                  #{c.companyId}
                </p>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-(--color-text-secondary)">
                {c.description ?? 'No description'}
              </p>
              <div className="mt-2 flex items-center gap-2 font-mono text-xs text-(--color-text-muted)">
                {c.jurisdictionCode && (
                  <span className="rounded border border-(--color-border) bg-(--color-bg-secondary) px-1.5 py-0.5 uppercase">
                    {c.jurisdictionCode}
                  </span>
                )}
                <span>
                  {c.founderAddress.slice(0, 6)}…{c.founderAddress.slice(-4)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
