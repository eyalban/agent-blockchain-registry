'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAccount, useDisconnect, useSignMessage } from 'wagmi'

import { useSession } from '@/hooks/use-session'
import { truncateAddress } from '@/lib/utils'

export function ConnectButton() {
  const { user, isLoading, refresh, signOut } = useSession()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const [open, setOpen] = useState(false)
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
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

  // Direct EOA link via browser wallet: when the signed-in user IS the
  // wallet (e.g. they manually created a company from this UI), we let
  // them attribute the address with a single off-chain personal_sign,
  // bypassing the claim-key flow entirely. For agent-controlled wallets
  // the user uses a claim key instead — see /workspace/claim-keys.
  async function linkConnectedWallet(): Promise<void> {
    if (!address) return
    setLinking(true)
    setLinkError(null)
    try {
      const challengeRes = await fetch('/api/v1/auth/wallet/challenge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      })
      if (!challengeRes.ok) {
        const data = (await challengeRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Could not start wallet link')
      }
      const { message } = (await challengeRes.json()) as { message: string }
      const signature = await signMessageAsync({ message })
      const verifyRes = await fetch('/api/v1/auth/wallet/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, signature }),
      })
      if (!verifyRes.ok) {
        const data = (await verifyRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Verification failed')
      }
      await refresh()
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : String(err))
    } finally {
      setLinking(false)
    }
  }

  async function unlinkWallet(addr: string): Promise<void> {
    await fetch(`/api/v1/auth/wallet/unlink?walletAddress=${addr}`, {
      method: 'DELETE',
    })
    await refresh()
  }

  if (isLoading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-(--color-border)" />
  }

  if (user) {
    const initial = (user.displayName || user.email).slice(0, 1).toUpperCase()
    const connectedNotLinked =
      isConnected &&
      address &&
      !user.wallets.includes(address.toLowerCase())

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
          <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]">
            <div className="border-b border-(--color-border) px-4 py-3">
              <p className="truncate text-sm font-semibold text-(--color-text-primary)">
                {user.displayName ?? user.email}
              </p>
              {user.displayName && (
                <p className="truncate text-xs text-(--color-text-muted)">{user.email}</p>
              )}
            </div>
            <Link
              href="/workspace"
              onClick={() => setOpen(false)}
              className="block border-b border-(--color-border) px-4 py-3 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-magenta-50) hover:text-(--color-magenta-700)"
            >
              My workspace
              <span className="ml-1 text-(--color-text-muted)">&rarr;</span>
            </Link>
            <Link
              href="/workspace/claim-keys"
              onClick={() => setOpen(false)}
              className="block border-b border-(--color-border) px-4 py-3 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-magenta-50) hover:text-(--color-magenta-700)"
            >
              Claim keys
              <span className="ml-1 text-(--color-text-muted)">&rarr;</span>
            </Link>

            <div className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">
                Verified wallets
              </p>
              {user.wallets.length === 0 ? (
                <p className="mt-2 text-xs text-(--color-text-muted)">
                  No wallets attributed yet. Use a claim key to attribute
                  agents, or sign with the connected wallet below to attribute
                  an EOA you control directly.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {user.wallets.map((w) => (
                    <li
                      key={w}
                      className="flex items-center justify-between gap-2 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-1.5 font-mono text-xs"
                    >
                      <span className="flex items-center gap-2">
                        {isConnected && address?.toLowerCase() === w && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                        <span>{truncateAddress(w as `0x${string}`)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => unlinkWallet(w)}
                        className="text-[10px] uppercase tracking-[0.1em] text-(--color-text-muted) hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {connectedNotLinked && (
                <button
                  type="button"
                  onClick={linkConnectedWallet}
                  disabled={linking}
                  className="mt-3 w-full rounded-lg bg-(--color-magenta-700) px-3 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800) disabled:opacity-50"
                >
                  {linking
                    ? 'Sign in your wallet…'
                    : `Link ${truncateAddress(address!)} (you control it)`}
                </button>
              )}
              {linkError && (
                <p className="mt-2 text-xs text-red-700">{linkError}</p>
              )}
            </div>
            <div className="border-t border-(--color-border) bg-(--color-bg-secondary)">
              {isConnected && (
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="block w-full px-4 py-2.5 text-left text-sm text-(--color-text-secondary) transition-colors hover:bg-white hover:text-(--color-magenta-700)"
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
                className="block w-full border-t border-(--color-border) px-4 py-2.5 text-left text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-white hover:text-(--color-magenta-700)"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

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
