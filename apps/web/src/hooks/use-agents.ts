'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'

import { contracts } from '@/lib/contracts'

export interface AgentListItem {
  readonly agentId: string
  readonly owner: string
  readonly tokenURI: string
  readonly name: string
  readonly description: string
  readonly image: string
  readonly tags: string[]
}

/**
 * Fetch all registered agents by iterating token IDs on the Identity Registry.
 * Parses agent card JSON from data URIs and fetches tags from the wrapper.
 */
export function useAgents(): {
  agents: AgentListItem[]
  isLoading: boolean
  error: Error | null
} {
  const publicClient = usePublicClient()
  const [agents, setAgents] = useState<AgentListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!publicClient) return

    let cancelled = false

    async function fetchAgents(): Promise<void> {
      if (!publicClient) return
      const results: AgentListItem[] = []

      for (let i = 1; i <= 100; i++) {
        try {
          const [owner, tokenURI] = await Promise.all([
            publicClient.readContract({
              ...contracts.identityRegistry,
              functionName: 'ownerOf',
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              ...contracts.identityRegistry,
              functionName: 'tokenURI',
              args: [BigInt(i)],
            }),
          ])

          // Try to get tags from wrapper
          let tags: string[] = []
          try {
            const result = await publicClient.readContract({
              ...contracts.wrapper,
              functionName: 'agentTags',
              args: [BigInt(i)],
            })
            tags = result as string[]
          } catch {
            // Agent may not be registered through wrapper
          }

          // Parse agent card
          let name = `Agent #${i}`
          let description = ''
          let image = ''
          const uri = tokenURI as string

          if (uri.startsWith('data:application/json;base64,')) {
            try {
              const json = atob(uri.split(',')[1] ?? '')
              const card = JSON.parse(json) as Record<string, unknown>
              name = (card.name as string) ?? name
              description = (card.description as string) ?? ''
              image = (card.image as string) ?? ''
            } catch {
              // Invalid JSON
            }
          }

          if (cancelled) return

          results.push({
            agentId: i.toString(),
            owner: owner as string,
            tokenURI: uri,
            name,
            description,
            image,
            tags,
          })
        } catch {
          // Token doesn't exist — we've reached the end
          break
        }
      }

      if (!cancelled) {
        setAgents(results)
        setIsLoading(false)
      }
    }

    fetchAgents().catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e : new Error('Failed to fetch agents'))
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [publicClient])

  return { agents, isLoading, error }
}
