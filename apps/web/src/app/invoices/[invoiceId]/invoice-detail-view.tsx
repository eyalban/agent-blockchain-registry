'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import {
  ADDRESS_EXPLORER_URL,
  TX_EXPLORER_URL,
} from '@agent-registry/shared'

import { useInvoice } from '@/hooks/use-invoices'
import { usePayInvoice } from '@/hooks/use-pay-invoice'
import { env } from '@/lib/env'
import { truncateAddress } from '@/lib/utils'

interface Props {
  readonly invoiceId: string
}

function formatUsd(v: number | null): string {
  if (v === null) return '—'
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
}

export function InvoiceDetailView({ invoiceId }: Props) {
  const { address } = useAccount()
  const { data, isLoading, reload } = useInvoice(invoiceId)
  const {
    approve,
    pay,
    cancel,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    mirrorError,
  } = usePayInvoice()

  const [memo, setMemo] = useState<{ title?: string; description?: string } | null>(null)
  useEffect(() => {
    if (!data?.memoUri) return
    const url = data.memoUri.startsWith('ipfs://')
      ? `https://gateway.pinata.cloud/ipfs/${data.memoUri.slice(7)}`
      : data.memoUri
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setMemo(j))
      .catch(() => setMemo(null))
  }, [data?.memoUri])

  useEffect(() => {
    if (isSuccess) setTimeout(reload, 700)
  }, [isSuccess, reload])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-accent-cyan) border-t-transparent" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) p-10 text-center">
        <p className="text-sm text-(--color-text-secondary)">
          Invoice not found.{' '}
          <Link href="/invoices" className="text-(--color-accent-cyan) hover:underline">
            Back to all invoices
          </Link>
        </p>
      </div>
    )
  }

  const isNative = data.tokenAddress === null
  const humanAmount = Number(data.amountRaw) / 10 ** (data.tokenSymbol === 'USDC' ? 6 : 18)
  const isIssuer = address && address.toLowerCase() === data.issuerAddress.toLowerCase()
  const isPayer = address && address.toLowerCase() === data.payerAddress.toLowerCase()
  const canPay = isPayer && data.status === 'issued'
  const canCancel = isIssuer && data.status === 'issued'

  return (
    <div>
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1 text-sm text-(--color-text-secondary) transition-colors hover:text-(--color-accent-cyan)"
      >
        ← Back to Invoices
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-(--color-text-muted)">
            Invoice #{data.invoiceId}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-(--color-text-primary)">
            {memo?.title ?? `Invoice #${data.invoiceId}`}
          </h1>
        </div>
        <span
          className={`rounded-md px-3 py-1 text-xs font-mono uppercase tracking-[0.1em] ${
            data.status === 'paid'
              ? 'border border-(--color-accent-green)/30 bg-(--color-accent-green)/10 text-(--color-accent-green)'
              : data.status === 'cancelled'
                ? 'border border-(--color-accent-red)/30 bg-(--color-accent-red)/10 text-(--color-accent-red)'
                : 'border border-(--color-accent-amber)/30 bg-(--color-accent-amber)/10 text-(--color-accent-amber)'
          }`}
        >
          {data.status}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card label="From">
          <a
            href={ADDRESS_EXPLORER_URL(env.chainId, data.issuerAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-(--color-accent-cyan) hover:underline"
          >
            {truncateAddress(data.issuerAddress)}
          </a>
          {data.issuerAgentId && (
            <p className="mt-1 font-mono text-xs text-(--color-text-muted)">
              Agent #{data.issuerAgentId}
            </p>
          )}
          {data.issuerCompanyId && (
            <p className="mt-1 font-mono text-xs text-(--color-text-muted)">
              Company #{data.issuerCompanyId}
            </p>
          )}
        </Card>
        <Card label="To">
          <a
            href={ADDRESS_EXPLORER_URL(env.chainId, data.payerAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-(--color-accent-cyan) hover:underline"
          >
            {truncateAddress(data.payerAddress)}
          </a>
          {data.payerAgentId && (
            <p className="mt-1 font-mono text-xs text-(--color-text-muted)">
              Agent #{data.payerAgentId}
            </p>
          )}
          {data.payerCompanyId && (
            <p className="mt-1 font-mono text-xs text-(--color-text-muted)">
              Company #{data.payerCompanyId}
            </p>
          )}
        </Card>
      </div>

      <div className="mt-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
          Amount
        </p>
        <p className="mt-1 text-3xl font-bold text-(--color-text-primary)">
          {humanAmount.toFixed(data.tokenSymbol === 'USDC' ? 2 : 6)} {data.tokenSymbol}
        </p>
        {data.amountUsdAtIssue !== null && (
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            ≈ {formatUsd(data.amountUsdAtIssue)} at issue time
            {data.priceSource && (
              <span className="ml-1 font-mono text-[10px] text-(--color-text-muted)">
                (price: {data.priceSource})
              </span>
            )}
          </p>
        )}
      </div>

      {memo?.description && (
        <div className="mt-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
            Description
          </p>
          <p className="mt-1 text-sm text-(--color-text-primary) whitespace-pre-wrap">
            {memo.description}
          </p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-5 space-y-2">
        <Detail
          label="Memo URI"
          value={data.memoUri}
          mono
          truncate
        />
        <Detail label="Issued" value={new Date(data.issuedAt).toLocaleString()} />
        <Detail
          label="Issue Tx"
          value={data.issuedTxHash.slice(0, 10) + '…'}
          href={TX_EXPLORER_URL(env.chainId, data.issuedTxHash)}
          mono
        />
        {data.paidAt && (
          <Detail label="Paid" value={new Date(data.paidAt).toLocaleString()} />
        )}
        {data.paidTxHash && (
          <Detail
            label="Payment Tx"
            value={data.paidTxHash.slice(0, 10) + '…'}
            href={TX_EXPLORER_URL(env.chainId, data.paidTxHash)}
            mono
          />
        )}
      </div>

      {(canPay || canCancel) && (
        <div className="mt-6 rounded-xl border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/5 p-5">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-accent-cyan)">
            Actions
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {canPay && !isNative && (
              <button
                type="button"
                onClick={() =>
                  approve(data.tokenAddress as `0x${string}`, BigInt(data.amountRaw))
                }
                disabled={isPending || isConfirming}
                className="rounded-md border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/10 px-4 py-2 text-sm text-(--color-accent-cyan) hover:bg-(--color-accent-cyan)/20 disabled:opacity-40"
              >
                1. Approve {data.tokenSymbol}
              </button>
            )}
            {canPay && (
              <button
                type="button"
                onClick={() =>
                  pay({
                    invoiceId: data.invoiceId,
                    isNative,
                    tokenAddress: data.tokenAddress as `0x${string}` | undefined,
                    amountRaw: BigInt(data.amountRaw),
                  })
                }
                disabled={isPending || isConfirming}
                className="rounded-md bg-gradient-to-r from-(--color-accent-cyan) to-(--color-accent-violet) px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                {isNative ? '2. Pay' : '2. Pay'} {humanAmount.toFixed(2)}{' '}
                {data.tokenSymbol}
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={() => cancel(data.invoiceId)}
                disabled={isPending || isConfirming}
                className="rounded-md border border-(--color-accent-red)/30 bg-(--color-accent-red)/10 px-4 py-2 text-sm text-(--color-accent-red) hover:bg-(--color-accent-red)/20 disabled:opacity-40"
              >
                Cancel Invoice
              </button>
            )}
          </div>
          {(isPending || isConfirming) && (
            <p className="mt-3 text-xs text-(--color-text-muted)">
              {isPending ? 'Waiting for wallet…' : 'Confirming on-chain…'}
            </p>
          )}
          {(error || mirrorError) && (
            <p className="mt-3 text-xs text-(--color-accent-red)">
              {error?.message ?? mirrorError}
            </p>
          )}
          {hash && (
            <p className="mt-2 font-mono text-[10px] text-(--color-text-muted)">
              Last tx:{' '}
              <a
                href={TX_EXPLORER_URL(env.chainId, hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--color-accent-cyan)"
              >
                {hash.slice(0, 10)}…
              </a>
            </p>
          )}
          {!isNative && canPay && (
            <p className="mt-3 text-[11px] text-(--color-text-muted)">
              ERC-20 payments require a one-time <code>approve</code> before{' '}
              <code>pay</code>. USDC on Base mainnet supports EIP-2612 permit
              (single tx) — enhancement tracked for v1.1.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function Detail({
  label,
  value,
  href,
  mono,
  truncate,
}: {
  label: string
  value: string
  href?: string
  mono?: boolean
  truncate?: boolean
}) {
  const valueClass = `${mono ? 'font-mono' : ''} ${truncate ? 'truncate' : ''} text-xs text-(--color-text-primary)`
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-(--color-text-muted)">
        {label}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${valueClass} hover:text-(--color-accent-cyan)`}
        >
          {value}
        </a>
      ) : (
        <span className={valueClass}>{value}</span>
      )}
    </div>
  )
}
