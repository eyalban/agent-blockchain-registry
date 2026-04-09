'use client'

import { useCallback, useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

import { contracts } from '@/lib/contracts'

interface UseGiveFeedbackReturn {
  giveFeedback: (
    agentId: bigint,
    value: bigint,
    valueDecimals: number,
    tag1: string,
    tag2: string,
    endpoint: string,
    feedbackURI: string,
    feedbackHash: `0x${string}`,
  ) => void
  hash: `0x${string}` | undefined
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
}

const ZERO_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as const

export function useGiveFeedback(): UseGiveFeedbackReturn {
  const [error, setError] = useState<Error | null>(null)

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const giveFeedback = useCallback(
    (
      agentId: bigint,
      value: bigint,
      valueDecimals: number,
      tag1: string,
      tag2: string,
      endpoint: string,
      feedbackURI: string,
      feedbackHash: `0x${string}`,
    ) => {
      setError(null)
      try {
        writeContract({
          ...contracts.reputationRegistry,
          functionName: 'giveFeedback',
          args: [
            agentId,
            value,
            valueDecimals,
            tag1,
            tag2,
            endpoint,
            feedbackURI,
            feedbackHash || ZERO_HASH,
          ],
        })
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Feedback submission failed'))
      }
    },
    [writeContract],
  )

  return {
    giveFeedback,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError ?? error,
  }
}
