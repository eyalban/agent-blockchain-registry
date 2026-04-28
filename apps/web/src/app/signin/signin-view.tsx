'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

import { Logo } from '@/components/ui/logo'
import { useSession } from '@/hooks/use-session'
import { truncateAddress } from '@/lib/utils'

type Mode = 'signin' | 'signup'

export function SignInView() {
  const router = useRouter()
  const { user, isLoading: sessionLoading, refresh } = useSession()
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: walletConnecting } = useConnect()
  const { disconnect } = useDisconnect()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) router.push('/')
  }, [user, router])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const path = mode === 'signin' ? '/api/v1/auth/signin' : '/api/v1/auth/signup'
      const body =
        mode === 'signin'
          ? { email, password }
          : { email, password, displayName: displayName.trim() || undefined }
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? `Failed to ${mode === 'signin' ? 'sign in' : 'create account'}`)
        return
      }
      await refresh()
      router.push('/')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col items-stretch px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl flex-1 overflow-hidden rounded-3xl border border-(--color-border) bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] lg:grid-cols-2">
        {/* Left: brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-(--color-magenta-50) via-white to-(--color-magenta-100) p-10 lg:flex">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <Logo size={32} />
              <span className="text-lg font-semibold tracking-tight text-(--color-text-primary)">
                statem8
              </span>
            </Link>
            <h2 className="mt-12 max-w-sm text-3xl font-semibold tracking-tight text-(--color-text-primary)">
              Banking and accounting,{' '}
              <span className="text-(--color-magenta-700)">built for AI agents.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-(--color-text-secondary)">
              Manage every agent, every treasury, every invoice from one
              dashboard — backed by ERC-8004 contracts on Base. Sign in with
              email or connect a wallet.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-(--color-text-secondary)">
            <Bullet>Email login for humans, wallet login for agents.</Bullet>
            <Bullet>Income statements with every line traceable to a tx.</Bullet>
            <Bullet>Open-source, MIT licensed.</Bullet>
          </ul>
        </div>

        {/* Right: auth panel */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div className="lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <Logo size={28} />
              <span className="text-base font-semibold tracking-tight text-(--color-text-primary)">
                statem8
              </span>
            </Link>
          </div>

          <div className="mt-6 lg:mt-0">
            <h1 className="text-2xl font-semibold tracking-tight text-(--color-text-primary)">
              {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
            </h1>
            <p className="mt-2 text-sm text-(--color-text-secondary)">
              {mode === 'signin'
                ? 'Use email and password, or connect a wallet to continue.'
                : 'Start managing your agents and companies in minutes.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {mode === 'signup' && (
              <Field
                id="displayName"
                label="Display name"
                value={displayName}
                onChange={setDisplayName}
                placeholder="Optional"
                autoComplete="name"
              />
            )}
            <Field
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
              required
              autoComplete="email"
              placeholder="you@company.com"
            />
            <Field
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={setPassword}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder={mode === 'signup' ? 'At least 8 characters' : ''}
              minLength={mode === 'signup' ? 8 : undefined}
            />

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-lg border border-(--color-accent-red)/30 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || sessionLoading}
              className="w-full rounded-full bg-(--color-magenta-700) px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? mode === 'signin'
                  ? 'Signing in…'
                  : 'Creating account…'
                : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-(--color-border)" />
            <span className="text-xs uppercase tracking-[0.14em] text-(--color-text-muted)">
              or
            </span>
            <span className="h-px flex-1 bg-(--color-border)" />
          </div>

          {/* Wallet auth */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">
              Continue with a wallet
            </p>
            {isConnected && address ? (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-bg-secondary) px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-(--color-text-primary)">
                    Wallet connected
                  </p>
                  <p className="font-mono text-xs text-(--color-text-muted)">
                    {truncateAddress(address)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="text-xs font-medium text-(--color-text-secondary) hover:text-(--color-magenta-700)"
                >
                  Switch
                </button>
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                {connectors.map((c) => (
                  <button
                    key={c.uid}
                    type="button"
                    onClick={() => connect({ connector: c })}
                    disabled={walletConnecting}
                    className="rounded-xl border border-(--color-border) bg-white px-4 py-3 text-left text-sm font-medium text-(--color-text-primary) transition-colors hover:border-(--color-magenta-300) hover:bg-(--color-magenta-50) disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {walletConnecting
                      ? 'Connecting…'
                      : c.name === 'Injected'
                        ? 'Browser wallet'
                        : c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-(--color-text-secondary)">
            {mode === 'signin' ? (
              <>
                New to statem8?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                  }}
                  className="font-medium text-(--color-magenta-700) hover:text-(--color-magenta-800)"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                  }}
                  className="font-medium text-(--color-magenta-700) hover:text-(--color-magenta-800)"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  autoComplete,
  placeholder,
  minLength,
}: {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onChange: (v: string) => void
  readonly type?: 'text' | 'email' | 'password'
  readonly required?: boolean
  readonly autoComplete?: string
  readonly placeholder?: string
  readonly minLength?: number
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-(--color-text-primary)"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        className="mt-1.5 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
      />
    </div>
  )
}

function Bullet({ children }: { readonly children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-(--color-magenta-700)"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M3.5 8.5L6.5 11.5L12.5 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </li>
  )
}
