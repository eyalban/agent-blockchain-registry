import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { sql } from '@/lib/db'
import {
  createSession,
  hashPassword,
  setSessionCookie,
} from '@/lib/auth'

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().max(80).optional(),
})

interface ExistingRow {
  id: string
}
interface InsertRow {
  id: string
  email: string
  display_name: string | null
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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
      { error: 'Invalid input', code: 'VALIDATION', details: parsed.error.format() },
      { status: 400 },
    )
  }

  const { email, password, displayName } = parsed.data

  const existing = (await sql`
    SELECT id FROM users WHERE LOWER(email) = ${email} LIMIT 1
  `) as ExistingRow[]
  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'An account with that email already exists', code: 'EMAIL_TAKEN' },
      { status: 409 },
    )
  }

  const passwordHash = await hashPassword(password)
  const inserted = (await sql`
    INSERT INTO users (email, password_hash, display_name)
    VALUES (${email}, ${passwordHash}, ${displayName ?? null})
    RETURNING id, email, display_name
  `) as InsertRow[]

  const user = inserted[0]
  if (!user) {
    return NextResponse.json(
      { error: 'Failed to create account', code: 'INTERNAL' },
      { status: 500 },
    )
  }

  const userAgent = req.headers.get('user-agent')
  const { token, expiresAt } = await createSession(user.id, userAgent)
  await setSessionCookie(token, expiresAt)

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    },
  })
}
