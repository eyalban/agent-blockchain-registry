'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalAgents: number
  totalCompanies: number
  totalTransactions: number
}

/**
 * Stats sourced from our local mirror of on-chain state. `totalAgents`
 * is a UNION of `agent_wallets` and active `company_members`, so an
 * agent registered through the framework's Path B / Path C flow shows
 * up immediately even before it links a separate wallet.
 */
export function ProtocolStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStats(): Promise<void> {
      try {
        const res = await fetch('/api/v1/stats')
        if (!res.ok) return
        const data = (await res.json()) as {
          totalAgents?: number
          totalCompanies?: number
          totalTransactions?: number
        }
        if (!cancelled) {
          setStats({
            totalAgents: data.totalAgents ?? 0,
            totalCompanies: data.totalCompanies ?? 0,
            totalTransactions: data.totalTransactions ?? 0,
          })
        }
      } catch {
        /* ignore */
      }
    }

    fetchStats()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="grid grid-cols-1 divide-(--color-border) overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:grid-cols-3 sm:divide-x">
      <StatBox
        label="Registered agents"
        value={stats ? stats.totalAgents.toLocaleString() : '—'}
      />
      <StatBox
        label="Registered companies"
        value={stats ? stats.totalCompanies.toLocaleString() : '—'}
      />
      <StatBox
        label="Transactions tracked"
        value={stats ? stats.totalTransactions.toLocaleString() : '—'}
      />
    </div>
  )
}

function StatBox({
  label,
  value,
  sub,
}: {
  readonly label: string
  readonly value: string
  readonly sub?: string
}) {
  return (
    <div className="px-6 py-7">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
        {value}
      </p>
      {sub && (
        <p className="mt-1 font-mono text-xs text-(--color-text-muted)">{sub}</p>
      )}
    </div>
  )
}
