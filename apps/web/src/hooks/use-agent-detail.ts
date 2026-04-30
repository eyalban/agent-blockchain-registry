'use client'

import { useEffect, useState } from 'react'
import { useReadContract } from 'wagmi'

import { contracts } from '@/lib/contracts'

interface AgentApiResponse {
  agentId: string
  owner: string | null
  tokenURI: string | null
  card: { name?: string | null; description?: string | null } | null
  source?: string
}

export function useAgentDetail(agentId: bigint): {
  tokenURI: string | undefined
  owner: string | undefined
  isLoading: boolean
} {
  const { data: tokenURI, isLoading: uriLoading, isError: uriError } = useReadContract({
    ...contracts.identityRegistry,
    functionName: 'tokenURI',
    args: [agentId],
  })

  const { data: owner, isLoading: ownerLoading, isError: ownerError } = useReadContract({
    ...contracts.identityRegistry,
    functionName: 'ownerOf',
    args: [agentId],
  })

  // When the on-chain reads settle without data (e.g. the agent is in
  // the cache mirror but not yet on chain), fall back to the API which
  // serves cached metadata. This keeps the agent page usable for any
  // mirror-only agent.
  const [fallback, setFallback] = useState<AgentApiResponse | null | 'pending'>(
    null,
  )
  const onChainSettled = !uriLoading && !ownerLoading
  const onChainEmpty = onChainSettled && (!tokenURI || !owner || uriError || ownerError)

  useEffect(() => {
    if (!onChainEmpty || fallback !== null) return
    let cancelled = false
    fetch(`/api/v1/agents/${agentId.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: AgentApiResponse | null) => {
        if (!cancelled) setFallback(j ?? 'pending')
      })
      .catch(() => {
        if (!cancelled) setFallback('pending')
      })
    return () => {
      cancelled = true
    }
  }, [onChainEmpty, fallback, agentId])

  // Synthesize a data-URI tokenURI from the cached card so the existing
  // parser in agent-detail-view treats it the same as on-chain data.
  let resolvedTokenURI = tokenURI as string | undefined
  const fb = fallback === 'pending' ? null : fallback
  if (!resolvedTokenURI && fb) {
    if (fb.tokenURI) {
      resolvedTokenURI = fb.tokenURI
    } else if (fb.card) {
      // The downstream parser in agent-detail-view does plain
      // atob(...) + JSON.parse, which treats output as Latin1. To keep
      // names readable (no mojibake) we ASCII-fy non-Latin1 punctuation
      // before encoding. This is purely cosmetic for cache-only agents.
      const asciify = (s: string | null | undefined): string | null =>
        typeof s === 'string'
          ? s
              .replace(/[‐-―]/g, '-') // hyphens / dashes
              .replace(/[‘’‚‛]/g, "'")
              .replace(/[“”„‟]/g, '"')
              .replace(/[…]/g, '...')
              // strip anything still outside Latin1 — fall back to ID
              // if that empties the string.
              .replace(/[^\x00-\xff]/g, '')
          : null
      const card = {
        name: asciify(fb.card.name),
        description: asciify(fb.card.description),
      }
      const json = JSON.stringify(card)
      const b64 =
        typeof window === 'undefined'
          ? Buffer.from(json, 'binary').toString('base64')
          : btoa(json)
      resolvedTokenURI = 'data:application/json;base64,' + b64
    }
  }

  // While we're settling on-chain reads OR awaiting the fallback fetch
  // for a cache-only agent, isLoading stays true so the page shows its
  // spinner instead of momentarily flashing "Agent #ID" / "Not found".
  const fallbackPending = onChainEmpty && fallback === null
  return {
    tokenURI: resolvedTokenURI,
    owner: (owner as string | undefined) ?? fb?.owner ?? undefined,
    isLoading: uriLoading || ownerLoading || fallbackPending,
  }
}
