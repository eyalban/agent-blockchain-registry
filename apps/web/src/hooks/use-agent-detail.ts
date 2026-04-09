'use client'

import { useReadContract } from 'wagmi'

import { contracts } from '@/lib/contracts'

export function useAgentDetail(agentId: bigint): {
  tokenURI: string | undefined
  owner: string | undefined
  isLoading: boolean
} {
  const { data: tokenURI, isLoading: uriLoading } = useReadContract({
    ...contracts.identityRegistry,
    functionName: 'tokenURI',
    args: [agentId],
  })

  const { data: owner, isLoading: ownerLoading } = useReadContract({
    ...contracts.identityRegistry,
    functionName: 'ownerOf',
    args: [agentId],
  })

  return {
    tokenURI: tokenURI as string | undefined,
    owner: owner as string | undefined,
    isLoading: uriLoading || ownerLoading,
  }
}
