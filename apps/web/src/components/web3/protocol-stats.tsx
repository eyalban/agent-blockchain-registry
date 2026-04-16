'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalAgents: number
  totalTransactions: number
}

/**
 * Shows stats sourced from our database (only real agents with linked wallets),
 * NOT from the global canonical registry which includes tokens from other projects.
 */
export function ProtocolStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStats(): Promise<void> {
      try {
        const res = await fetch('/api/v1/stats')
        if (!res.ok) return
        const data = await res.json() as { totalAgents?: number; totalTransactions?: number }
        if (!cancelled) {
          setStats({
            totalAgents: data.totalAgents ?? 0,
            totalTransactions: data.totalTransactions ?? 0,
          })
        }
      } catch { /* ignore */ }
    }

    fetchStats()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
      <StatBox label="Registered Agents" value={stats ? stats.totalAgents.toString() : '...'} />
      <StatBox label="Transactions Tracked" value={stats ? stats.totalTransactions.toString() : '...'} />
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
