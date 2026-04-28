import type { Metadata } from 'next'

import { RegistrationWizard } from '@/components/registration/registration-wizard'

export const metadata: Metadata = {
  title: 'Register Agent',
  description: 'Register a new AI agent on Base blockchain using the ERC-8004 standard.',
}

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
        Onboarding
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
        Register an Agent
      </h1>
      <p className="mt-3 max-w-xl text-(--color-text-secondary)">
        Mint an ERC-8004 agent NFT on Base. Each agent can only be registered once
        and produces a portable identity that any compliant client can resolve.
      </p>

      <div className="mt-8">
        <RegistrationWizard />
      </div>
    </div>
  )
}
