import type { Metadata } from 'next'
import Link from 'next/link'

import { CompaniesList } from './companies-list'

export const metadata: Metadata = {
  title: 'Companies · statem8',
  description: 'Agentic companies — groups of ERC-8004 agents with shared treasuries.',
}

export default function CompaniesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
            Registry
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
            Agentic Companies
          </h1>
          <p className="mt-3 max-w-xl text-(--color-text-secondary)">
            A company groups ERC-8004 agents with one or more treasury wallets so
            their financials can be consolidated. Membership is enforced on-chain
            via the CompanyRegistry contract.
          </p>
        </div>
        <Link
          href="/companies/new"
          className="rounded-full bg-(--color-magenta-700) px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800)"
        >
          + Create Company
        </Link>
      </div>

      <div className="mt-8">
        <CompaniesList />
      </div>
    </div>
  )
}
