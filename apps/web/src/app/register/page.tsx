import type { Metadata } from 'next'

import { RegistrationWizard } from '@/components/registration/registration-wizard'

export const metadata: Metadata = {
  title: 'Register Agent',
  description: 'Register a new AI agent on Base blockchain using the ERC-8004 standard.',
}

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Register Agent</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Register your AI agent on Base blockchain. Each agent can only be registered once via
        ERC-8004.
      </p>

      <div className="mt-8">
        <RegistrationWizard />
      </div>
    </div>
  )
}
