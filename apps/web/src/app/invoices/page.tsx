import type { Metadata } from 'next'

import { InvoicesList } from './invoices-list'

export const metadata: Metadata = {
  title: 'Invoices · Agent Registry',
  description: 'On-chain invoices between agents and agentic companies.',
}

export default function InvoicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-cyan)">
            Registry
          </p>
          <h1 className="mt-2 text-3xl font-bold text-(--color-text-primary)">
            Invoices
          </h1>
          <p className="mt-2 max-w-xl text-(--color-text-secondary)">
            Issued and paid via the on-chain InvoiceRegistry. ETH or USDC, atomic
            settlement. Unpaid invoices show up as AR/AP on company balance sheets.
          </p>
        </div>
        <a
          href="/invoices/new"
          className="rounded-lg border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/10 px-4 py-2 text-sm font-mono text-(--color-accent-cyan) transition-colors hover:bg-(--color-accent-cyan)/20"
        >
          + New Invoice
        </a>
      </div>
      <div className="mt-8">
        <InvoicesList />
      </div>
    </div>
  )
}
