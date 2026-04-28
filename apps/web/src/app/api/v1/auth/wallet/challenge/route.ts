import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/auth'
import { issueChallenge } from '@/lib/wallet-link'

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

  const challenge = await issueChallenge(user.id, parsed.data.walletAddress)

  return NextResponse.json({
    message: challenge.message,
    expiresAt: challenge.expiresAt.toISOString(),
  })
}
