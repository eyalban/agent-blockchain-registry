'use client'

import { useEffect, useState } from 'react'

export interface AgentTx {
  readonly tx_hash: string
  readonly direction: string
  readonly counterparty: string
  readonly value_eth: number
  readonly label: string
  readonly block_timestamp: string
}

export function useAgentTransactions(agentId: string): {
  transactions: AgentTx[]
  isLoading: boolean
  isSyncing: boolean
  sync: () => void
} {
  const [transactions, setTransactions] = useState<AgentTx[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  function load(): void {
    fetch(`/api/v1/agents/${agentId}/transactions`)
      .then((r) => (r.ok ? r.json() : { transactions: [] }))
      .then((d) => setTransactions((d as { transactions: AgentTx[] }).transactions ?? []))
      .catch(() => setTransactions([]))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [agentId])

  function sync(): void {
    setIsSyncing(true)
    fetch(`/api/v1/agents/${agentId}/transactions/sync`, { method: 'POST' })
      .then(() => load())
      .finally(() => setIsSyncing(false))
  }

  return { transactions, isLoading, isSyncing, sync }
}
