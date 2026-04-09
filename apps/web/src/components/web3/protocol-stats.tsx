'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'

import { contracts } from '@/lib/contracts'

interface Stats {
  totalAgents: number
  registrationFee: string
}

export function ProtocolStats() {
  const publicClient = usePublicClient()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!publicClient) return

    let cancelled = false

    async function fetchStats(): Promise<void> {
      if (!publicClient) return

      // Count agents
      let total = 0
      for (let i = 1; i <= 1000; i++) {
        try {
          await publicClient.readContract({
            ...contracts.identityRegistry,
            functionName: 'ownerOf',
            args: [BigInt(i)],
          })
          total++
        } catch {
          break
        }
      }

      // Get fee
      let fee = '0'
      try {
        const result = await publicClient.readContract({
          ...contracts.wrapper,
          functionName: 'registrationFee',
        })
        const wei = result as bigint
        fee = (Number(wei) / 1e18).toString()
      } catch {
        // wrapper may not be deployed
      }

      if (!cancelled) {
        setStats({ totalAgents: total, registrationFee: fee })
      }
    }

    fetchStats()
    return () => { cancelled = true }
  }, [publicClient])

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      <StatBox
        label="Registered Agents"
        value={stats ? stats.totalAgents.toString() : '...'}
      />
      <StatBox label="Total Feedback" value="0" />
      <StatBox label="Unique Owners" value={stats ? stats.totalAgents.toString() : '...'} />
      <StatBox label="Reg. Fee" value={stats ? `${stats.registrationFee} ETH` : '...'} />
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
