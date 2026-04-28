import type { Metadata } from 'next'

import { CreateInvoiceForm } from './create-invoice-form'

export const metadata: Metadata = {
  title: 'New Invoice · statem8',
}

export default function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
        New Invoice
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
        Issue an On-Chain Invoice
      </h1>
      <p className="mt-3 text-(--color-text-secondary)">
        Calls{' '}
        <code className="rounded border border-(--color-magenta-200) bg-(--color-magenta-50) px-1.5 py-0.5 font-mono text-xs text-(--color-magenta-700)">
          InvoiceRegistry.createInvoice
        </code>
        . Payment settles atomically when the payer calls{' '}
        <code className="rounded border border-(--color-magenta-200) bg-(--color-magenta-50) px-1.5 py-0.5 font-mono text-xs text-(--color-magenta-700)">payInvoiceETH</code>{' '}
        or{' '}
        <code className="rounded border border-(--color-magenta-200) bg-(--color-magenta-50) px-1.5 py-0.5 font-mono text-xs text-(--color-magenta-700)">payInvoiceERC20</code>.
      </p>
      <div className="mt-8">
        <CreateInvoiceForm />
      </div>
    </div>
  )
}
