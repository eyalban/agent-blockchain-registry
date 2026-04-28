import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/auth'
import { sql } from '@/lib/db'

interface WalletRow {
  wallet_address: string
}

export async function GET(): Promise<NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const wallets = (await sql`
    SELECT wallet_address FROM user_wallets WHERE user_id = ${user.id}
    ORDER BY linked_at ASC
  `) as WalletRow[]

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      wallets: wallets.map((w) => w.wallet_address),
    },
  })
}
