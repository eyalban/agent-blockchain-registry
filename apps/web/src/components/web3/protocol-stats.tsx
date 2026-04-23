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
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      <StatBox
        label="Registered Agents"
        value={stats ? stats.totalAgents.toString() : '...'}
      />
      <StatBox
        label="Registered Companies"
        value={stats ? stats.totalCompanies.toString() : '...'}
      />
      <StatBox
        label="Transactions Tracked"
        value={stats ? stats.totalTransactions.toString() : '...'}
      />
      <StatBox label="Network" value="Base Sepolia" />
    </div>
  )
}

function StatBox({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface)/40 p-5 text-center backdrop-blur-sm transition-colors hover:border-(--color-border-bright)">
      <p className="font-mono text-3xl font-bold text-(--color-accent-cyan) text-glow-cyan">
        {value}
      </p>
      <p className="mt-1 text-sm text-(--color-text-muted)">{label}</p>
    </div>
  )
}
