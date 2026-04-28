import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { sql } from '@/lib/db'
import {
  createSession,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth'

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
})

interface UserRow {
  id: string
  email: string
  display_name: string | null
  password_hash: string
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
      { error: 'Invalid input', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  const { email, password } = parsed.data

  const rows = (await sql`
    SELECT id, email, display_name, password_hash
    FROM users
    WHERE LOWER(email) = ${email}
    LIMIT 1
  `) as UserRow[]

  const user = rows[0]
  // Same opaque error for unknown email and bad password to avoid user enumeration.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json(
      { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
      { status: 401 },
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
