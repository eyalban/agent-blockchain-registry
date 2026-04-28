'use client'

import { useCallback, useEffect, useState } from 'react'

export interface SessionUser {
  readonly id: string
  readonly email: string
  readonly displayName: string | null
  readonly wallets: readonly string[]
}

interface SessionState {
  user: SessionUser | null
  isLoading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

export function useSession(): SessionState {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/v1/auth/me', { cache: 'no-store' })
      if (!res.ok) {
        setUser(null)
        return
      }
      const data = (await res.json()) as { user: SessionUser | null }
      setUser(data.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    await fetch('/api/v1/auth/signout', { method: 'POST' })
    setUser(null)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { user, isLoading, refresh, signOut }
}
