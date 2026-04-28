'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

import { useSession } from '@/hooks/use-session'
import { truncateAddress } from '@/lib/utils'

export function ConnectButton() {
  const { user, isLoading, refresh, signOut } = useSession()
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Auto-link a freshly connected wallet to the signed-in account so the user
  // doesn't have to click a separate "link" button. Idempotent on the server.
  useEffect(() => {
    if (!user || !isConnected || !address) return
    const lower = address.toLowerCase()
    if (user.wallets.includes(lower)) return
    void fetch('/api/v1/auth/link-wallet', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ walletAddress: lower }),
    }).then(() => refresh())
  }, [user, isConnected, address, refresh])

  if (isLoading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-(--color-border)" />
  }

  // Signed-in via email — primary state. Wallet, if connected, lives inside
  // the dropdown.
  if (user) {
    const initial = (user.displayName || user.email).slice(0, 1).toUpperCase()
    return (
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-full border border-(--color-border) bg-white px-2 py-1 pr-3 text-sm font-medium text-(--color-text-primary) shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-(--color-magenta-300)"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-(--color-magenta-500) to-(--color-magenta-700) text-xs font-semibold text-white">
            {initial}
          </span>
          <span className="hidden max-w-[160px] truncate sm:inline">
            {user.displayName ?? user.email}
          </span>
          <svg className="h-3 w-3 text-(--color-text-muted)" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]">
            <div className="border-b border-(--color-border) px-4 py-3">
              <p className="truncate text-sm font-semibold text-(--color-text-primary)">
                {user.displayName ?? user.email}
              </p>
              {user.displayName && (
                <p className="truncate text-xs text-(--color-text-muted)">{user.email}</p>
              )}
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">
                Wallets
              </p>
              {user.wallets.length === 0 && !isConnected ? (
                <button
                  type="button"
                  onClick={() => {
                    const c = connectors[0]
                    if (c) connect({ connector: c })
                  }}
                  disabled={isPending}
                  className="mt-2 w-full rounded-lg border border-(--color-magenta-200) bg-(--color-magenta-50) px-3 py-2 text-sm font-medium text-(--color-magenta-700) transition-colors hover:bg-(--color-magenta-100) disabled:opacity-50"
                >
                  {isPending ? 'Connecting…' : 'Link a wallet'}
                </button>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {user.wallets.map((w) => (
                    <li
                      key={w}
                      className="flex items-center justify-between gap-2 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-1.5 font-mono text-xs"
                    >
                      <span>{truncateAddress(w as `0x${string}`)}</span>
                      {isConnected && address?.toLowerCase() === w && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-(--color-accent-green)" />
                      )}
                    </li>
                  ))}
                  {isConnected &&
                    address &&
                    !user.wallets.includes(address.toLowerCase()) && (
                      <li className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-(--color-border-bright) bg-white px-3 py-1.5 font-mono text-xs text-(--color-text-muted)">
                        <span>Linking {truncateAddress(address)}…</span>
                      </li>
                    )}
                </ul>
              )}
            </div>
            <div className="border-t border-(--color-border) bg-(--color-bg-secondary)">
              {isConnected && (
                <button
                  type="button"
                  onClick={() => {
                    disconnect()
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-(--color-text-secondary) transition-colors hover:bg-(--color-magenta-50) hover:text-(--color-magenta-700)"
                >
                  Disconnect wallet
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  await signOut()
                  setOpen(false)
                  if (isConnected) disconnect()
                }}
                className="block w-full border-t border-(--color-border) px-4 py-2.5 text-left text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-magenta-50) hover:text-(--color-magenta-700)"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Wallet-only state (no email account).
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => disconnect()}
          className="rounded-full border border-(--color-border) bg-white px-3 py-1.5 font-mono text-xs text-(--color-text-secondary) shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-(--color-magenta-300) hover:text-(--color-magenta-700)"
        >
          {truncateAddress(address)}
        </button>
        <Link
          href="/signin"
          className="hidden rounded-full bg-(--color-magenta-700) px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-(--color-magenta-800) sm:inline-block"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <Link
      href="/signin"
      className="rounded-full bg-(--color-magenta-700) px-4 py-1.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800)"
    >
      Sign in
    </Link>
  )
}
