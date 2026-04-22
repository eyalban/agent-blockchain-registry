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
      className="space-y-5 rounded-xl border border-(--color-border) bg-(--color-surface) p-6"
    >
      <Field label="Payer (wallet)" required>
        <input
          className="w-full rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 font-mono text-sm text-(--color-text-primary) focus:border-(--color-accent-cyan) focus:outline-none"
          placeholder="0x…"
          value={payer}
          onChange={(e) => setPayer(e.target.value.trim())}
        />
      </Field>

      <div className="grid grid-cols-[1fr,auto] gap-3">
        <Field label="Amount" required>
          <input
            className="w-full rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 font-mono text-sm text-(--color-text-primary) focus:border-(--color-accent-cyan) focus:outline-none"
            placeholder="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            inputMode="decimal"
          />
        </Field>
        <Field label="Token" required>
          <select
            className="rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 font-mono text-sm text-(--color-text-primary) focus:border-(--color-accent-cyan) focus:outline-none"
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
          className="w-full rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) focus:border-(--color-accent-cyan) focus:outline-none"
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
          className="w-full rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) focus:border-(--color-accent-cyan) focus:outline-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      {!isConnected && (
        <p className="rounded-md border border-(--color-accent-amber)/30 bg-(--color-accent-amber)/5 p-3 text-sm text-(--color-accent-amber)">
          Connect your wallet to sign the invoice creation tx.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-gradient-to-r from-(--color-accent-cyan) to-(--color-accent-violet) px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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
        <p className="text-sm text-(--color-accent-red)">
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
            className="text-(--color-accent-cyan) hover:underline"
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
      <label className="block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
        {label}
        {required && <span className="ml-1 text-(--color-accent-amber)">*</span>}
      </label>
      {children}
    </div>
  )
}
