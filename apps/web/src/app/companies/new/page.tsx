import type { Metadata } from 'next'

import { CreateCompanyForm } from './create-company-form'

export const metadata: Metadata = {
  title: 'Create Company · statem8',
  description: 'Create a new agentic company on-chain.',
}

export default function NewCompanyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
        New Company
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
        Create an Agentic Company
      </h1>
      <p className="mt-3 text-(--color-text-secondary)">
        Submits one transaction to{' '}
        <code className="rounded border border-(--color-magenta-200) bg-(--color-magenta-50) px-1.5 py-0.5 font-mono text-xs text-(--color-magenta-700)">
          CompanyRegistry.createCompany
        </code>
        . You become the initial owner and can transfer ownership later.
      </p>

      <div className="mt-8">
        <CreateCompanyForm />
      </div>
    </div>
  )
}
