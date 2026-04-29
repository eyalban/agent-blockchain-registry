import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getSessionUser } from '@/lib/auth'

import { LinkWalletView } from './link-wallet-view'

export const metadata: Metadata = {
  title: 'Link a wallet · statem8',
}

export const dynamic = 'force-dynamic'

export default async function LinkWalletPage() {
  const user = await getSessionUser()
  if (!user) redirect('/signin?next=/workspace/link-wallet')
  return <LinkWalletView />
}
