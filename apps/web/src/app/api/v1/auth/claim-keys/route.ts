import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/auth'
import { createClaimKey, listClaimKeys } from '@/lib/claim-keys'

const createSchema = z.object({
  label: z.string().trim().max(80).optional(),
})

export async function GET(): Promise<NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Not signed in', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  const keys = await listClaimKeys(user.id)
  return NextResponse.json({ keys })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Not signed in', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  let raw: unknown = {}
  try {
    raw = await req.json()
  } catch {
    /* empty body is fine */
  }
  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  const { plaintext, row } = await createClaimKey(
    user.id,
    parsed.data.label?.trim() || null,
  )

  // Plaintext is returned ONLY here; we never store it. The client must
  // surface it once and then drop it.
  return NextResponse.json({ key: row, plaintext })
}
