'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { contracts } from '@/lib/contracts'

interface UseCreateCompanyReturn {
  createCompany: (metadataURI: string) => void
  hash: `0x${string}` | undefined
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  companyId: string | null
  mirrorError: string | null
  error: Error | null
}

export function useCreateCompany(): UseCreateCompanyReturn {
  const [error, setError] = useState<Error | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [mirrorError, setMirrorError] = useState<string | null>(null)
  const mirroredRef = useRef<`0x${string}` | null>(null)

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createCompany = useCallback(
    (metadataURI: string) => {
      setError(null)
      setCompanyId(null)
      setMirrorError(null)
      try {
        writeContract({
          ...contracts.companyRegistry,
          functionName: 'createCompany',
          args: [metadataURI],
        })
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to submit tx'))
      }
    },
    [writeContract],
  )

  useEffect(() => {
    if (!isSuccess || !hash) return
    if (mirroredRef.current === hash) return
    mirroredRef.current = hash

    void fetch('/api/v1/companies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ txHash: hash }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string }
          setMirrorError(j.error ?? `API returned ${r.status}`)
          return null
        }
        return (await r.json()) as { companyId: string }
      })
      .then((j) => {
        if (j?.companyId) setCompanyId(j.companyId)
      })
      .catch((e) => setMirrorError(e instanceof Error ? e.message : String(e)))
  }, [hash, isSuccess])

  return {
    createCompany,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    companyId,
    mirrorError,
    error: writeError ?? error,
  }
}
