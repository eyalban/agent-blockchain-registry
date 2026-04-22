'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { contracts } from '@/lib/contracts'

export function useAddTreasury(): {
  addTreasury: (companyId: string, address: `0x${string}`, label?: string) => void
  removeTreasury: (companyId: string, address: `0x${string}`) => void
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
    | {
        kind: 'add' | 'remove'
        companyId: string
        address: `0x${string}`
        label?: string
      }
    | null
  >(null)

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const addTreasury = useCallback(
    (companyId: string, address: `0x${string}`, label?: string) => {
      setError(null)
      setMirrorError(null)
      mirroredRef.current = null
      pendingRef.current = { kind: 'add', companyId, address, label }
      try {
        writeContract({
          ...contracts.companyRegistry,
          functionName: 'addTreasury',
          args: [BigInt(companyId), address],
        })
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to submit tx'))
      }
    },
    [writeContract],
  )

  const removeTreasury = useCallback(
    (companyId: string, address: `0x${string}`) => {
      setError(null)
      setMirrorError(null)
      mirroredRef.current = null
      pendingRef.current = { kind: 'remove', companyId, address }
      try {
        writeContract({
          ...contracts.companyRegistry,
          functionName: 'removeTreasury',
          args: [BigInt(companyId), address],
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

    const url =
      pending.kind === 'add'
        ? `/api/v1/companies/${pending.companyId}/treasuries`
        : `/api/v1/companies/${pending.companyId}/treasuries/${pending.address}`
    const method = pending.kind === 'add' ? 'POST' : 'DELETE'
    const body: Record<string, unknown> = { txHash: hash }
    if (pending.kind === 'add' && pending.label) body.label = pending.label

    void fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
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
    addTreasury,
    removeTreasury,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    mirrorError,
    error: writeError ?? error,
  }
}
