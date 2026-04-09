'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { parseAbiItem } from 'viem'

import { contracts } from '@/lib/contracts'

export interface RegistryEvent {
  readonly type: 'registration' | 'tags' | 'featured' | 'activity'
  readonly agentId: bigint
  readonly blockNumber: bigint
  readonly transactionHash: string
  readonly timestamp?: number
}

/**
 * Fetch recent wrapper contract events from on-chain logs.
 * Uses viem getLogs to read past events from the wrapper contract.
 */
export function useRecentEvents(blockRange = 5000n): {
  events: RegistryEvent[]
  isLoading: boolean
} {
  const publicClient = usePublicClient()
  const [events, setEvents] = useState<RegistryEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!publicClient) return

    let cancelled = false

    async function fetchEvents(): Promise<void> {
      if (!publicClient) return
      try {
        const currentBlock = await publicClient.getBlockNumber()
        const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : 0n

        const logs = await publicClient.getLogs({
          address: contracts.wrapper.address,
          event: parseAbiItem(
            'event AgentRegisteredViaWrapper(uint256 indexed agentId, address indexed owner, string[] tags)',
          ),
          fromBlock,
          toBlock: 'latest',
        })

        if (cancelled) return

        const parsed: RegistryEvent[] = logs.map((log) => ({
          type: 'registration' as const,
          agentId: log.args.agentId ?? 0n,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        }))

        setEvents(parsed.reverse())
      } catch {
        // Contract may not have events yet
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchEvents()
    return () => {
      cancelled = true
    }
  }, [publicClient, blockRange])

  return { events, isLoading }
}
