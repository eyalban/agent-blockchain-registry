import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/auth'
import { verifyAndLink } from '@/lib/wallet-link'

const bodySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
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

  const result = await verifyAndLink(
    user.id,
    parsed.data.walletAddress,
    parsed.data.signature,
  )
  if (!result.ok) {
    const status = result.code === 'WALLET_OWNED_BY_OTHER_USER' ? 409 : 400
    return NextResponse.json(
      { error: result.message, code: result.code },
      { status },
    )
  }

  return NextResponse.json({ ok: true, walletAddress: result.walletAddress })
}
