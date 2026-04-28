import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/auth'
import { sql } from '@/lib/db'

const bodySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Not signed in', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body must be JSON', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  const wallet = parsed.data.walletAddress.toLowerCase()
  await sql`
    INSERT INTO user_wallets (user_id, wallet_address)
    VALUES (${user.id}, ${wallet})
    ON CONFLICT (user_id, wallet_address) DO NOTHING
  `

  return NextResponse.json({ ok: true, walletAddress: wallet })
}

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
