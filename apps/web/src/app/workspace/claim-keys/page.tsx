import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getSessionUser } from '@/lib/auth'
import { listClaimKeys } from '@/lib/claim-keys'

import { ClaimKeysView } from './claim-keys-view'

export const metadata: Metadata = {
  title: 'Claim keys · statem8',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClaimKeysPage() {
  const user = await getSessionUser()
  if (!user) redirect('/signin?next=/workspace/claim-keys')
  const keys = await listClaimKeys(user.id)
  return <ClaimKeysView initialKeys={keys} />
}
