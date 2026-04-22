import type { Metadata } from 'next'

import { CompaniesList } from './companies-list'

export const metadata: Metadata = {
  title: 'Companies · Agent Registry',
  description: 'Agentic companies — groups of ERC-8004 agents with shared treasuries.',
}

export default function CompaniesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-cyan)">
            Registry
          </p>
          <h1 className="mt-2 text-3xl font-bold text-(--color-text-primary)">
            Agentic Companies
          </h1>
          <p className="mt-2 max-w-xl text-(--color-text-secondary)">
            A company groups ERC-8004 agents with one or more treasury wallets so
            their financials can be consolidated. Membership is enforced on-chain
            via the CompanyRegistry contract.
          </p>
        </div>
        <a
          href="/companies/new"
          className="rounded-lg border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/10 px-4 py-2 text-sm font-mono text-(--color-accent-cyan) transition-colors hover:bg-(--color-accent-cyan)/20"
        >
          + Create Company
        </a>
      </div>

      <div className="mt-8">
        <CompaniesList />
      </div>
    </div>
  )
}
