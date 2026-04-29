import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/auth'
import { revokeClaimKey } from '@/lib/claim-keys'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  _req: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Not signed in', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  const { id } = await params
  const ok = await revokeClaimKey(user.id, id)
  if (!ok) {
    return NextResponse.json(
      { error: 'Key not found or already revoked', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }
  return NextResponse.json({ ok: true })
}
