'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { contracts } from '@/lib/contracts'

export interface CreateInvoiceInput {
  payer: `0x${string}`
  token: `0x${string}` // 0x0…0 for ETH
  amountRaw: bigint
  issuerCompanyId: bigint
  payerCompanyId: bigint
  dueBlock: bigint
  memoURI: string
  memoHash: `0x${string}`
}

export function useCreateInvoice(): {
  createInvoice: (input: CreateInvoiceInput) => void
  hash: `0x${string}` | undefined
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  invoiceId: string | null
  mirrorError: string | null
  error: Error | null
} {
  const [error, setError] = useState<Error | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [mirrorError, setMirrorError] = useState<string | null>(null)
  const mirroredRef = useRef<`0x${string}` | null>(null)

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createInvoice = useCallback(
    (input: CreateInvoiceInput) => {
      setError(null)
      setInvoiceId(null)
      setMirrorError(null)
      try {
        writeContract({
          ...contracts.invoiceRegistry,
          functionName: 'createInvoice',
          args: [
            input.payer,
            input.issuerCompanyId,
            input.payerCompanyId,
            input.token,
            input.amountRaw,
            input.dueBlock,
            input.memoURI,
            input.memoHash,
          ],
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

    void fetch('/api/v1/invoices', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ txHash: hash }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string }
          setMirrorError(j.error ?? `API ${r.status}`)
          return null
        }
        return (await r.json()) as { invoiceId: string }
      })
      .then((j) => {
        if (j?.invoiceId) setInvoiceId(j.invoiceId)
      })
      .catch((e) => setMirrorError(e instanceof Error ? e.message : String(e)))
  }, [hash, isSuccess])

  return {
    createInvoice,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    invoiceId,
    mirrorError,
    error: writeError ?? error,
  }
}
