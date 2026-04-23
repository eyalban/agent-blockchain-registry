'use client'

import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'

/**
 * Resolves wallet addresses to agent names. Each address is its own query so
 * results are cached and shared across components.
 */
export function useWalletNames(addresses: string[]): Map<string, string> {
  const unique = useMemo(
    () => Array.from(new Set(addresses.map((a) => a.toLowerCase()))),
    [addresses],
  )

  const results = useQueries({
    queries: unique.map((addr) => ({
      queryKey: ['wallet-name', addr],
      queryFn: async (): Promise<{ addr: string; name: string } | null> => {
        const lookup = await fetch(`/api/v1/wallets/${addr}`)
        if (!lookup.ok) return null
        const data = (await lookup.json()) as { agentId?: string }
        if (!data.agentId) return null
        const agent = await fetch(`/api/v1/agents/${data.agentId}`)
        if (!agent.ok) return { addr, name: `Agent #${data.agentId}` }
        const card = ((await agent.json()) as { card?: { name?: string } } | null)
          ?.card
        return { addr, name: card?.name ?? `Agent #${data.agentId}` }
      },
      staleTime: 5 * 60_000,
    })),
  })

  return useMemo(() => {
    const m = new Map<string, string>()
    for (const r of results) {
      if (r.data) m.set(r.data.addr, r.data.name)
    }
    return m
  }, [results])
}
