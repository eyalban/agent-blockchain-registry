import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export function Footer() {
  return (
    <footer className="border-t border-(--color-border) bg-(--color-bg-secondary)">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <Logo size={34} />
              <span className="text-lg font-semibold text-(--color-text-primary)">
                Agent Registry
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm text-(--color-text-muted)">
              Financial infrastructure for AI agents and agentic companies on the
              blockchain. On-chain identity, reputation, companies, invoices, and
              provenance-first accounting. Built on ERC-8004, deployed on Base.
            </p>
            <p className="mt-4 font-mono text-xs text-(--color-text-muted)">
              ERC-8004 &middot; Base Sepolia &middot; Chain ID 84532
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-mono text-xs tracking-[0.15em] text-(--color-text-muted) uppercase">
              Product
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/agents" className="text-sm text-(--color-text-secondary) hover:text-(--color-accent-cyan) transition-colors">
                  Agents
                </Link>
              </li>
              <li>
                <Link href="/companies" className="text-sm text-(--color-text-secondary) hover:text-(--color-accent-cyan) transition-colors">
                  Companies
                </Link>
              </li>
              <li>
                <Link href="/invoices" className="text-sm text-(--color-text-secondary) hover:text-(--color-accent-cyan) transition-colors">
                  Invoices
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-(--color-text-secondary) hover:text-(--color-accent-cyan) transition-colors">
                  Register Agent
                </Link>
              </li>
              <li>
                <Link href="/explorer" className="text-sm text-(--color-text-secondary) hover:text-(--color-accent-cyan) transition-colors">
                  Explorer
                </Link>
              </li>
            </ul>
          </div>

          {/* Developers / Docs */}
          <div>
            <h3 className="font-mono text-xs tracking-[0.15em] text-(--color-text-muted) uppercase">
              Developers
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/docs" className="text-sm text-(--color-text-secondary) hover:text-(--color-accent-cyan) transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/eyalban/agent-blockchain-registry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-(--color-text-secondary) hover:text-(--color-accent-cyan) transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/eyalban/agent-blockchain-registry/blob/main/docs/WHITEPAPER.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-(--color-text-secondary) hover:text-(--color-accent-cyan) transition-colors"
                >
                  White Paper
                </a>
              </li>
              <li>
                <a
                  href="https://eips.ethereum.org/EIPS/eip-8004"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-(--color-text-secondary) hover:text-(--color-accent-cyan) transition-colors"
                >
                  ERC-8004 Spec
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-(--color-border) pt-8">
          <p className="text-center font-mono text-xs text-(--color-text-muted)">
            Built on Base &middot; Powered by ERC-8004 Trustless Agents
          </p>
        </div>
      </div>
    </footer>
  )
}
