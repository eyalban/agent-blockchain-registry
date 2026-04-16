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
}

/**
 * Fetch agents from our API — only shows agents with linked wallets
 * in our database (real OpenClaw agents), not the entire global registry.
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

        const data = await res.json() as {
          data: Array<{ agentId: string; owner: string; tokenURI: string }>
        }

        const results: AgentListItem[] = data.data.map((agent) => {
          let name = `Agent #${agent.agentId}`
          let description = ''
          let image = ''

          if (agent.tokenURI.startsWith('data:application/json;base64,')) {
            try {
              const json = atob(agent.tokenURI.split(',')[1] ?? '')
              const card = JSON.parse(json) as Record<string, unknown>
              name = (card.name as string) ?? name
              description = (card.description as string) ?? ''
              image = (card.image as string) ?? ''
            } catch { /* invalid JSON */ }
          }

          return {
            agentId: agent.agentId,
            owner: agent.owner,
            tokenURI: agent.tokenURI,
            name,
            description,
            image,
            tags: [],
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
    return () => { cancelled = true }
  }, [])

  return { agents, isLoading, error }
}
