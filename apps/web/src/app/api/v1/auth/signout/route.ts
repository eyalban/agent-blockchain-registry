import { NextResponse } from 'next/server'

import {
  clearSessionCookie,
  deleteSession,
  getSessionToken,
} from '@/lib/auth'

export async function POST(): Promise<NextResponse> {
  const token = await getSessionToken()
  if (token) await deleteSession(token)
  await clearSessionCookie()
  return NextResponse.json({ ok: true })
}
