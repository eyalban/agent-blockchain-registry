'use client'

import { useEffect, useState } from 'react'

/**
 * Resolves wallet addresses to agent names by querying the wallet lookup API.
 * Caches results to avoid repeated calls for the same address.
 */
export function useWalletNames(addresses: string[]): Map<string, string> {
  const [names, setNames] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    if (addresses.length === 0) return

    const unique = [...new Set(addresses.map((a) => a.toLowerCase()))]
    const toFetch = unique.filter((a) => !names.has(a))
    if (toFetch.length === 0) return

    Promise.all(
      toFetch.map((addr) =>
        fetch(`/api/v1/wallets/${addr}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (!data) return null
            const agentId = (data as { agentId: string }).agentId
            // Fetch agent name from the agent detail endpoint
            return fetch(`/api/v1/agents/${agentId}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((agentData) => {
                const card = (agentData as { card?: { name?: string } } | null)?.card
                return { addr, name: card?.name ?? `Agent #${agentId}` }
              })
          })
          .catch(() => null),
      ),
    ).then((results) => {
      setNames((prev) => {
        const next = new Map(prev)
        for (const r of results) {
          if (r) next.set(r.addr, r.name)
        }
        return next
      })
    })
  }, [addresses.join(',')])

  return names
}
