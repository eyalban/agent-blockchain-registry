'use client'

import { useReadContract } from 'wagmi'

import { contracts } from '@/lib/contracts'

export function useRegistrationFee(): {
  fee: bigint | undefined
  isLoading: boolean
} {
  const { data, isLoading } = useReadContract({
    ...contracts.wrapper,
    functionName: 'registrationFee',
  })

  return {
    fee: data as bigint | undefined,
    isLoading,
  }
}
