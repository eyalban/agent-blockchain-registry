'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ConnectButton } from '@/components/web3/connect-button'
import { Logo } from '@/components/ui/logo'

const NAV_ITEMS = [
  { href: '/agents', label: 'Agents' },
  { href: '/companies', label: 'Companies' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/register', label: 'Register' },
  { href: '/explorer', label: 'Explorer' },
  { href: '/docs', label: 'Docs' },
] as const

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-(--color-border) bg-(--color-bg-primary)/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size={34} />
          <span className="text-lg font-semibold text-(--color-text-primary) transition-colors group-hover:text-(--color-accent-cyan)">
            Agent Registry
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-(--color-text-muted) transition-colors hover:text-(--color-accent-cyan) hover:bg-(--color-surface)"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ConnectButton />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-(--color-text-muted) transition-colors hover:bg-(--color-surface) md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="border-t border-(--color-border) bg-(--color-bg-primary)/95 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-(--color-text-secondary) transition-colors hover:text-(--color-accent-cyan) hover:bg-(--color-surface)"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-(--color-border) pt-3">
              <ConnectButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
