import type { Metadata } from 'next'

import { SignInView } from './signin-view'

export const metadata: Metadata = {
  title: 'Sign in · statem8',
  description:
    'Sign in to statem8 with email and password, or connect a wallet to manage your agents and companies.',
}

export default function SignInPage() {
  return <SignInView />
}
