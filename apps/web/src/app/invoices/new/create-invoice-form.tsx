'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { parseEther, parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { SUPPORTED_TOKENS, TX_EXPLORER_URL } from '@agent-registry/shared'

import { useCreateInvoice } from '@/hooks/use-create-invoice'
import { env } from '@/lib/env'

export function CreateInvoiceForm() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const chainTokens = SUPPORTED_TOKENS[env.chainId as keyof typeof SUPPORTED_TOKENS]

  const [payer, setPayer] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState<'ETH' | 'USDC'>('USDC')
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const {
    createInvoice,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    invoiceId,
    error,
    mirrorError,
  } = useCreateInvoice()

  useEffect(() => {
    if (isSuccess && invoiceId) {
      const t = setTimeout(() => router.push(`/invoices/${invoiceId}`), 1200)
      return () => clearTimeout(t)
    }
  }, [isSuccess, invoiceId, router])

  const canSubmit =
    isConnected &&
    /^0x[a-fA-F0-9]{40}$/.test(payer.trim()) &&
    /^\d+(\.\d+)?$/.test(amount) &&
    Number(amount) > 0 &&
    title.trim().length > 0 &&
    !isUploading &&
    !isPending &&
    !isConfirming

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!canSubmit) return

    setIsUploading(true)
    setUploadError(null)
    try {
      const res = await fetch('/api/v1/invoices/metadata', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          service: title.trim(),
        }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? `Upload failed (${res.status})`)
      }
      const { uri, memoHash } = (await res.json()) as { uri: string; memoHash: string }

      const token = chainTokens[tokenSymbol]
      const amountRaw = token.isNative
        ? parseEther(amount)
        : parseUnits(amount, token.decimals)

      createInvoice({
        payer: payer.trim() as `0x${string}`,
        token: (token.address ??
          '0x0000000000000000000000000000000000000000') as `0x${string}`,
        amountRaw,
        issuerCompanyId: 0n,
        payerCompanyId: 0n,
        dueBlock: 0n,
        memoURI: uri,
        memoHash: memoHash as `0x${string}`,
      })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <Field label="Payer (wallet)" required>
        <input
          className="w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 font-mono text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
          placeholder="0x…"
          value={payer}
          onChange={(e) => setPayer(e.target.value.trim())}
        />
      </Field>

      <div className="grid grid-cols-[1fr,auto] gap-3">
        <Field label="Amount" required>
          <input
            className="w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 font-mono text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
            placeholder="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            inputMode="decimal"
          />
        </Field>
        <Field label="Token" required>
          <select
            className="rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 font-mono text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value as 'ETH' | 'USDC')}
          >
            <option value="USDC">USDC</option>
            <option value="ETH">ETH</option>
          </select>
        </Field>
      </div>

      <Field label="Title / Service" required>
        <input
          className="w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
          maxLength={256}
          placeholder="e.g. Market analysis — Q1 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={3}
          maxLength={4096}
          className="w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      {!isConnected && (
        <p className="rounded-xl border border-(--color-magenta-200) bg-(--color-magenta-50) p-3 text-sm text-(--color-magenta-700)">
          Connect your wallet to sign the invoice creation tx.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-full bg-(--color-magenta-700) px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800) disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {isUploading
          ? 'Uploading memo to IPFS…'
          : isPending
            ? 'Waiting for wallet…'
            : isConfirming
              ? 'Confirming on-chain…'
              : isSuccess && invoiceId
                ? `Invoice #${invoiceId} created ✓`
                : 'Issue Invoice'}
      </button>

      {(uploadError || error || mirrorError) && (
        <p className="text-sm text-red-700">
          {uploadError || error?.message || mirrorError}
        </p>
      )}

      {hash && (
        <p className="font-mono text-xs text-(--color-text-muted)">
          Tx:{' '}
          <Link
            href={TX_EXPLORER_URL(env.chainId, hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--color-magenta-700) hover:underline"
          >
            {hash.slice(0, 10)}…{hash.slice(-6)}
          </Link>
        </p>
      )}
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-(--color-text-primary)">
        {label}
        {required && <span className="ml-1 text-(--color-magenta-700)">*</span>}
      </label>
      {children}
    </div>
  )
}
