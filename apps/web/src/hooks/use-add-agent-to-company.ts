'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { contracts } from '@/lib/contracts'

export function useAddAgentToCompany(): {
  addAgent: (companyId: string, agentId: string) => void
  removeAgent: (companyId: string, agentId: string) => void
  hash: `0x${string}` | undefined
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  mirrorError: string | null
  error: Error | null
} {
  const [error, setError] = useState<Error | null>(null)
  const [mirrorError, setMirrorError] = useState<string | null>(null)
  const mirroredRef = useRef<`0x${string}` | null>(null)
  const pendingRef = useRef<
    { kind: 'add' | 'remove'; companyId: string; agentId: string } | null
  >(null)

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const addAgent = useCallback(
    (companyId: string, agentId: string) => {
      setError(null)
      setMirrorError(null)
      mirroredRef.current = null
      pendingRef.current = { kind: 'add', companyId, agentId }
      try {
        writeContract({
          ...contracts.companyRegistry,
          functionName: 'addAgent',
          args: [BigInt(companyId), BigInt(agentId)],
        })
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to submit tx'))
      }
    },
    [writeContract],
  )

  const removeAgent = useCallback(
    (companyId: string, agentId: string) => {
      setError(null)
      setMirrorError(null)
      mirroredRef.current = null
      pendingRef.current = { kind: 'remove', companyId, agentId }
      try {
        writeContract({
          ...contracts.companyRegistry,
          functionName: 'removeAgent',
          args: [BigInt(companyId), BigInt(agentId)],
        })
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to submit tx'))
      }
    },
    [writeContract],
  )

  useEffect(() => {
    if (!isSuccess || !hash || !pendingRef.current) return
    if (mirroredRef.current === hash) return
    mirroredRef.current = hash
    const pending = pendingRef.current

    const url = `/api/v1/companies/${pending.companyId}/members${pending.kind === 'remove' ? `/${pending.agentId}` : ''}`
    const method = pending.kind === 'add' ? 'POST' : 'DELETE'

    void fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ txHash: hash }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string }
          setMirrorError(j.error ?? `API returned ${r.status}`)
        }
      })
      .catch((e) => setMirrorError(e instanceof Error ? e.message : String(e)))
  }, [hash, isSuccess])

  return {
    addAgent,
    removeAgent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    mirrorError,
    error: writeError ?? error,
  }
}
