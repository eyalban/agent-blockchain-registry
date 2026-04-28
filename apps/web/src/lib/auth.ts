import { randomBytes } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

import { sql } from '@/lib/db'

export const SESSION_COOKIE = 'statem8_session'
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const BCRYPT_ROUNDS = 12

export interface SessionUser {
  readonly id: string
  readonly email: string
  readonly displayName: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function createSession(
  userId: string,
  userAgent: string | null,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  await sql`
    INSERT INTO sessions (token, user_id, expires_at, user_agent)
    VALUES (${token}, ${userId}, ${expiresAt.toISOString()}, ${userAgent})
  `
  return { token, expiresAt }
}

export async function deleteSession(token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE token = ${token}`
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const rows = (await sql`
    SELECT u.id, u.email, u.display_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
      AND s.expires_at > NOW()
    LIMIT 1
  `) as Array<{ id: string; email: string; display_name: string | null }>

  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
  }
}

export async function setSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}
