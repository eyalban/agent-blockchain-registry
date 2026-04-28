import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getSessionUser } from '@/lib/auth'
import { getInvoice } from '@/lib/db'
import { getUserWallets } from '@/lib/workspace'

import { InvoiceDetailView } from './invoice-detail-view'

interface Props {
  readonly params: Promise<{ invoiceId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { invoiceId } = await params
  return { title: `Invoice #${invoiceId} · statem8` }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Server-side gate: an invoice page only renders for the issuer or
 * payer of that invoice (verified via signed wallet link). Anyone else
 * — even with the URL — sees a 403-style message. Logged-out users go
 * to /signin.
 */
export default async function InvoiceDetailPage({ params }: Props) {
  const { invoiceId } = await params
  const user = await getSessionUser()
  if (!user) {
    redirect(`/signin?next=/invoices/${encodeURIComponent(invoiceId)}`)
  }

  const [invoice, wallets] = await Promise.all([
    getInvoice(invoiceId),
    getUserWallets(user.id),
  ])

  if (!invoice) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Forbidden
          title="Invoice not found"
          message="No invoice with that ID has been mirrored from chain. It may not exist or it may belong to a different network."
        />
      </div>
    )
  }

  const isParty =
    wallets.includes(invoice.issuer_address.toLowerCase()) ||
    wallets.includes(invoice.payer_address.toLowerCase())

  if (!isParty) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Forbidden
          title="This invoice is private"
          message="Only the verified issuer or payer can open this page. If you control one of those wallets, link it from your account dropdown and reload."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <InvoiceDetailView invoiceId={invoiceId} />
    </div>
  )
}

function Forbidden({
  title,
  message,
}: {
  readonly title: string
  readonly message: string
}) {
  return (
    <div className="rounded-2xl border border-(--color-border) bg-white p-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-(--color-magenta-50) text-(--color-magenta-700)">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path
            d="M12 15v2m0-9a3 3 0 013 3v2H9V11a3 3 0 013-3zm-7 6a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mt-5 text-xl font-semibold text-(--color-text-primary)">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-(--color-text-secondary)">
        {message}
      </p>
      <Link
        href="/workspace"
        className="mt-6 inline-block rounded-full bg-(--color-magenta-700) px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-magenta-800)"
      >
        Back to my workspace
      </Link>
    </div>
  )
}
