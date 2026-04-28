import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getSessionUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Invoices · statem8',
  description: 'Private invoice dashboard for the signed-in account.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Invoices are private. The platform does not publish a directory of
 * every issuer/payer pair. The public surface is intentionally empty:
 * if you're signed in we route you to your workspace, otherwise we
 * route you to sign-in.
 */
export default async function InvoicesPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/signin?next=/workspace')
  }
  redirect('/workspace#invoices')
}
