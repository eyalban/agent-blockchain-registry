import type { Metadata } from 'next'

import { InvoiceDetailView } from './invoice-detail-view'

interface Props {
  readonly params: Promise<{ invoiceId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { invoiceId } = await params
  return { title: `Invoice #${invoiceId} · statem8` }
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { invoiceId } = await params
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <InvoiceDetailView invoiceId={invoiceId} />
    </div>
  )
}
