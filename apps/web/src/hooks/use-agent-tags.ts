'use client'

import { useReadContract } from 'wagmi'

import { contracts } from '@/lib/contracts'

export function useAgentTags(agentId: bigint | undefined): {
  tags: string[] | undefined
  isLoading: boolean
} {
  const { data, isLoading } = useReadContract({
    ...contracts.wrapper,
    functionName: 'agentTags',
    args: agentId !== undefined ? [agentId] : undefined,
    query: { enabled: agentId !== undefined },
  })

  return {
    tags: data as string[] | undefined,
    isLoading,
  }
}
