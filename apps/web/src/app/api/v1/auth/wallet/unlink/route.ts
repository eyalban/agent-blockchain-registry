import { NextResponse, type NextRequest } from 'next/server'

import { getSessionUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Not signed in', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }

  const wallet = req.nextUrl.searchParams.get('walletAddress')?.toLowerCase()
  if (!wallet || !/^0x[a-f0-9]{40}$/.test(wallet)) {
    return NextResponse.json(
      { error: 'Invalid wallet', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  await sql`
    DELETE FROM user_wallets
    WHERE user_id = ${user.id} AND wallet_address = ${wallet}
  `
  return NextResponse.json({ ok: true })
}
