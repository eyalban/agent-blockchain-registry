'use client'

import Link from 'next/link'
import { ConnectButton } from '@/components/web3/connect-button'
import { Logo } from '@/components/ui/logo'

const NAV_ITEMS = [
  { href: '/agents', label: 'Registry' },
  { href: '/register', label: 'Register' },
  { href: '/explorer', label: 'Explorer' },
  { href: '/reputation', label: 'Reputation' },
] as const

export function Header() {
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

        {/* Navigation */}
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

        {/* Wallet */}
        <div className="flex items-center gap-3">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
