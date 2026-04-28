import type { Metadata } from 'next'
import Link from 'next/link'

import { KpiStrip } from '@/components/ui/kpi-strip'
import { getInvoiceStats } from '@/lib/aggregate-stats'

import { InvoicesList } from './invoices-list'

export const metadata: Metadata = {
  title: 'Invoices · statem8',
  description: 'On-chain invoices between agents and agentic companies.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatUsdShort(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 10_000) return `$${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
}

export default async function InvoicesPage() {
  const stats = await getInvoiceStats()
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
            Registry
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
            Invoices
          </h1>
          <p className="mt-3 max-w-xl text-(--color-text-secondary)">
            Issued and paid via the on-chain InvoiceRegistry. ETH or USDC, atomic
            settlement. Unpaid invoices show up as AR/AP on company balance sheets.
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="rounded-full bg-(--color-magenta-700) px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800)"
        >
          + New Invoice
        </Link>
      </div>
      <div className="mt-8">
        <KpiStrip
          cells={[
            { label: 'Invoices', value: stats.total.toLocaleString() },
            {
              label: 'Total invoiced',
              value: formatUsdShort(stats.totalInvoicedUsd),
              sub: 'USD at issue',
            },
            {
              label: 'Paid',
              value: formatUsdShort(stats.totalPaidUsd),
              sub: 'Settled on-chain',
            },
            {
              label: 'Outstanding',
              value: formatUsdShort(stats.outstandingUsd),
              sub: `${stats.last30dCount} new in 30d`,
            },
          ]}
        />
      </div>

      <div className="mt-6">
        <InvoicesList />
      </div>
    </div>
  )
}
