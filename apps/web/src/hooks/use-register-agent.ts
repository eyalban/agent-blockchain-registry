'use client'

import { useCallback, useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

import { contracts } from '@/lib/contracts'

/** Metadata entry matching the wrapper ABI tuple shape */
interface AbiMetadataEntry {
  readonly key: string
  readonly value: `0x${string}`
}

interface UseRegisterAgentReturn {
  registerAgent: (
    agentURI: string,
    metadata: AbiMetadataEntry[],
    tags: string[],
    fee: bigint,
  ) => void
  hash: `0x${string}` | undefined
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
}

export function useRegisterAgent(): UseRegisterAgentReturn {
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

  const registerAgent = useCallback(
    (agentURI: string, metadata: AbiMetadataEntry[], tags: string[], fee: bigint) => {
      setError(null)
      try {
        writeContract({
          ...contracts.wrapper,
          functionName: 'registerAgent',
          args: [agentURI, metadata, tags],
          value: fee,
        })
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Registration failed'))
      }
    },
    [writeContract],
  )

  return {
    registerAgent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError ?? error,
  }
}
