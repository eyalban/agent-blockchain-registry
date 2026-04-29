'use client'

import { useEffect, useState } from 'react'

export interface AgentListItem {
  readonly agentId: string
  readonly owner: string
  readonly tokenURI: string
  readonly name: string
  readonly description: string
  readonly image: string
  readonly tags: string[]
  readonly companyId: string | null
  readonly companyName: string | null
}

/**
 * Fetch agents from our API. The server returns the union of agents
 * with linked wallets and active company members, with name /
 * description / image already resolved from the agent card metadata
 * (data: URIs and ipfs:// URIs alike). We keep the inline data-URI
 * decode as a client-side fallback for legacy responses that didn't
 * include the resolved fields.
 */
export function useAgents(): {
  agents: AgentListItem[]
  isLoading: boolean
  error: Error | null
} {
  const [agents, setAgents] = useState<AgentListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchAgents(): Promise<void> {
      try {
        const res = await fetch('/api/v1/agents?pageSize=100')
        if (!res.ok) throw new Error('Failed to fetch agents')

        const data = (await res.json()) as {
          data: Array<{
            agentId: string
            owner: string
            tokenURI: string
            name?: string | null
            description?: string | null
            image?: string | null
            companyId?: string | null
            companyName?: string | null
          }>
        }

        const results: AgentListItem[] = data.data.map((agent) => {
          let name = agent.name ?? null
          let description = agent.description ?? null
          let image = agent.image ?? null

          // Fallback: inline data: URIs may not be resolved server-side.
          if (
            (!name || !description || !image) &&
            agent.tokenURI.startsWith('data:application/json;base64,')
          ) {
            try {
              const json = atob(agent.tokenURI.split(',')[1] ?? '')
              const card = JSON.parse(json) as Record<string, unknown>
              if (!name && typeof card.name === 'string') name = card.name
              if (!description && typeof card.description === 'string')
                description = card.description
              if (!image && typeof card.image === 'string') image = card.image
            } catch {
              /* invalid JSON */
            }
          }

          return {
            agentId: agent.agentId,
            owner: agent.owner,
            tokenURI: agent.tokenURI,
            name: name ?? `Agent #${agent.agentId}`,
            description: description ?? '',
            image: image ?? '',
            tags: [],
            companyId: agent.companyId ?? null,
            companyName: agent.companyName ?? null,
          }
        })

        if (!cancelled) {
          setAgents(results)
          setIsLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to fetch agents'))
          setIsLoading(false)
        }
      }
    }

    fetchAgents()
    return () => {
      cancelled = true
    }
  }, [])

  return { agents, isLoading, error }
}
