'use client'

import { useReadContract } from 'wagmi'

import { contracts } from '@/lib/contracts'

export function useReputationSummary(agentId: bigint): {
  count: bigint | undefined
  summaryValue: bigint | undefined
  summaryValueDecimals: number | undefined
  isLoading: boolean
} {
  const { data, isLoading } = useReadContract({
    ...contracts.reputationRegistry,
    functionName: 'getSummary',
    args: [agentId, [], '', ''],
  })

  const result = data as [bigint, bigint, number] | undefined

  return {
    count: result?.[0],
    summaryValue: result?.[1],
    summaryValueDecimals: result?.[2],
    isLoading,
  }
}
