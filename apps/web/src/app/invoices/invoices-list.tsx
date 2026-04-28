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

function statusPill(status: InvoiceRecord['status']): string {
  if (status === 'paid')
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'cancelled')
    return 'border-red-200 bg-red-50 text-red-700'
  return 'border-(--color-magenta-200) bg-(--color-magenta-50) text-(--color-magenta-700)'
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
            className="h-16 animate-pulse rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex w-fit gap-1 rounded-full border border-(--color-border) bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {(['all', 'issued', 'paid', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.08em] transition-colors ${
              filter === f
                ? 'bg-(--color-magenta-700) text-white shadow-[0_4px_12px_-4px_rgba(219,39,119,0.45)]'
                : 'text-(--color-text-secondary) hover:text-(--color-magenta-700)'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-(--color-border-bright) bg-white p-12 text-center">
          <p className="text-sm text-(--color-text-secondary)">
            No invoices yet.{' '}
            <Link href="/invoices/new" className="font-medium text-(--color-magenta-700) hover:underline">
              Issue one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <table className="w-full">
            <thead className="border-b border-(--color-border) bg-(--color-bg-secondary)">
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
                  className="border-t border-(--color-border) transition-colors hover:bg-(--color-magenta-50)"
                >
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/invoices/${inv.invoiceId}`}
                      className="font-mono text-sm font-medium text-(--color-magenta-700) hover:underline"
                    >
                      #{inv.invoiceId}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-(--color-text-secondary)">
                    {truncateAddress(inv.issuerAddress)} →{' '}
                    {truncateAddress(inv.payerAddress)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm text-(--color-text-primary)">
                    {(Number(inv.amountRaw) / 10 ** (inv.tokenSymbol === 'USDC' ? 6 : 18)).toFixed(
                      inv.tokenSymbol === 'USDC' ? 2 : 6,
                    )}{' '}
                    <span className="text-(--color-text-muted)">{inv.tokenSymbol}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs text-(--color-text-secondary)">
                    {formatUsd(inv.amountUsdAtIssue)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${statusPill(inv.status)}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-(--color-text-muted)">
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
