'use client'

import { useMutation, useQuery } from '@tanstack/react-query'

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
  const query = useQuery({
    queryKey: ['agent-transactions', agentId],
    queryFn: async (): Promise<AgentTx[]> => {
      const r = await fetch(`/api/v1/agents/${agentId}/transactions`)
      if (!r.ok) return []
      const d = (await r.json()) as { transactions?: AgentTx[] }
      return d.transactions ?? []
    },
  })

  const syncMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await fetch(`/api/v1/agents/${agentId}/transactions/sync`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      void query.refetch()
    },
  })

  return {
    transactions: query.data ?? [],
    isLoading: query.isPending,
    isSyncing: syncMutation.isPending,
    sync: () => syncMutation.mutate(),
  }
}
