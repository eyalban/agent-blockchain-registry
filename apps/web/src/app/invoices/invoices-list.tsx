'use client'

import Link from 'next/link'
import { useState } from 'react'

import { useInvoices, type InvoiceRecord } from '@/hooks/use-invoices'
import { truncateAddress } from '@/lib/utils'

type Filter = 'all' | 'issued' | 'paid' | 'cancelled'

function formatUsd(v: number | null): string {
  if (v === null) return '—'
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
}

function statusBadge(status: InvoiceRecord['status']): string {
  if (status === 'paid') return 'text-(--color-accent-green)'
  if (status === 'cancelled') return 'text-(--color-accent-red)'
  return 'text-(--color-accent-amber)'
}

export function InvoicesList() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data, isLoading } = useInvoices({
    status: filter === 'all' ? undefined : filter,
  })

  if (isLoading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border border-(--color-border) bg-(--color-surface)"
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-md border border-(--color-border) bg-(--color-bg-secondary) p-1 w-fit">
        {(['all', 'issued', 'paid', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-[0.05em] rounded ${
              filter === f
                ? 'bg-(--color-accent-cyan)/20 text-(--color-accent-cyan)'
                : 'text-(--color-text-muted) hover:text-(--color-text-secondary)'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) p-10 text-center">
          <p className="text-sm text-(--color-text-secondary)">
            No invoices yet.{' '}
            <Link href="/invoices/new" className="text-(--color-accent-cyan) hover:underline">
              Issue one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-(--color-border)">
          <table className="w-full">
            <thead className="bg-(--color-bg-secondary)">
              <tr>
                <Th>#</Th>
                <Th>Issuer → Payer</Th>
                <Th right>Amount</Th>
                <Th right>USD</Th>
                <Th>Status</Th>
                <Th>Issued</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((inv) => (
                <tr
                  key={inv.invoiceId}
                  className="border-t border-(--color-border)/40 hover:bg-(--color-surface-hover)"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/invoices/${inv.invoiceId}`}
                      className="font-mono text-sm text-(--color-accent-cyan) hover:underline"
                    >
                      #{inv.invoiceId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-(--color-text-secondary)">
                    {truncateAddress(inv.issuerAddress)} →{' '}
                    {truncateAddress(inv.payerAddress)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-(--color-text-primary)">
                    {(Number(inv.amountRaw) / 10 ** (inv.tokenSymbol === 'USDC' ? 6 : 18)).toFixed(
                      inv.tokenSymbol === 'USDC' ? 2 : 6,
                    )}{' '}
                    {inv.tokenSymbol}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-(--color-text-secondary)">
                    {formatUsd(inv.amountUsdAtIssue)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.1em] ${statusBadge(inv.status)}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-(--color-text-muted)">
                    {new Date(inv.issuedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted) ${right ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  )
}
