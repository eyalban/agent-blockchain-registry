'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { contracts } from '@/lib/contracts'

const ERC20_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

export interface PayInvoiceInput {
  invoiceId: string
  isNative: boolean
  tokenAddress?: `0x${string}`
  amountRaw: bigint
}

export function usePayInvoice(): {
  approve: (tokenAddress: `0x${string}`, amountRaw: bigint) => void
  pay: (input: PayInvoiceInput) => void
  cancel: (invoiceId: string) => void
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
  const pendingRef = useRef<{ kind: 'pay' | 'cancel'; invoiceId: string } | null>(null)

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = useCallback(
    (tokenAddress: `0x${string}`, amountRaw: bigint) => {
      setError(null)
      setMirrorError(null)
      mirroredRef.current = null
      pendingRef.current = null // approve has no mirror side effect
      try {
        writeContract({
          address: tokenAddress,
          abi: ERC20_APPROVE_ABI,
          functionName: 'approve',
          args: [contracts.invoiceRegistry.address, amountRaw],
        })
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Approve failed'))
      }
    },
    [writeContract],
  )

  const pay = useCallback(
    (input: PayInvoiceInput) => {
      setError(null)
      setMirrorError(null)
      mirroredRef.current = null
      pendingRef.current = { kind: 'pay', invoiceId: input.invoiceId }
      try {
        if (input.isNative) {
          writeContract({
            ...contracts.invoiceRegistry,
            functionName: 'payInvoiceETH',
            args: [BigInt(input.invoiceId)],
            value: input.amountRaw,
          })
        } else {
          writeContract({
            ...contracts.invoiceRegistry,
            functionName: 'payInvoiceERC20',
            args: [BigInt(input.invoiceId)],
          })
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Pay failed'))
      }
    },
    [writeContract],
  )

  const cancel = useCallback(
    (invoiceId: string) => {
      setError(null)
      setMirrorError(null)
      mirroredRef.current = null
      pendingRef.current = { kind: 'cancel', invoiceId }
      try {
        writeContract({
          ...contracts.invoiceRegistry,
          functionName: 'cancelInvoice',
          args: [BigInt(invoiceId)],
        })
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Cancel failed'))
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
      pending.kind === 'pay'
        ? `/api/v1/invoices/${pending.invoiceId}/paid`
        : `/api/v1/invoices/${pending.invoiceId}/cancel`

    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ txHash: hash }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string }
          setMirrorError(j.error ?? `API ${r.status}`)
        }
      })
      .catch((e) => setMirrorError(e instanceof Error ? e.message : String(e)))
  }, [hash, isSuccess])

  return {
    approve,
    pay,
    cancel,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    mirrorError,
    error: writeError ?? error,
  }
}
