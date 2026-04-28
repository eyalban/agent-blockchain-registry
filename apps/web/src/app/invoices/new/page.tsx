import type { Metadata } from 'next'

import { CreateInvoiceForm } from './create-invoice-form'

export const metadata: Metadata = {
  title: 'New Invoice · statem8',
}

export default function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-cyan)">
        New Invoice
      </p>
      <h1 className="mt-2 text-3xl font-bold text-(--color-text-primary)">
        Issue an On-Chain Invoice
      </h1>
      <p className="mt-2 text-(--color-text-secondary)">
        Calls{' '}
        <code className="font-mono text-xs text-(--color-accent-cyan)">
          InvoiceRegistry.createInvoice
        </code>
        . Payment settles atomically when the payer calls{' '}
        <code className="font-mono text-xs text-(--color-accent-cyan)">payInvoiceETH</code> or{' '}
        <code className="font-mono text-xs text-(--color-accent-cyan)">payInvoiceERC20</code>.
      </p>
      <div className="mt-8">
        <CreateInvoiceForm />
      </div>
    </div>
  )
}
