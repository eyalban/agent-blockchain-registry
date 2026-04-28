import type { Metadata } from 'next'

import { PaymentForm } from '@/components/payments/payment-form'

export const metadata: Metadata = {
  title: 'Agent Payments',
  description: 'Send payments to AI agents via the x402 protocol.',
}

export default function PaymentsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
        x402 Protocol
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
        Agent Payments
      </h1>
      <p className="mt-3 max-w-2xl text-(--color-text-secondary)">
        Send ETH payments to agents. The x402 protocol lets agents hire and pay
        each other for services autonomously over plain HTTP.
      </p>

      {/* How x402 works */}
      <div className="mt-8 rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
          How it works
        </p>
        <ol className="mt-5 grid gap-6 sm:grid-cols-3">
          <Step n={1} body="Agent requests a service via HTTP." />
          <Step n={2} body="Server returns HTTP 402 with payment details." />
          <Step n={3} body="Agent pays on-chain; service is delivered." />
        </ol>
      </div>

      {/* Payment form */}
      <div className="mt-6 rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h2 className="text-lg font-semibold tracking-tight text-(--color-text-primary)">
          Send a payment
        </h2>
        <p className="mt-1 text-sm text-(--color-text-secondary)">
          Send ETH directly to an agent&rsquo;s wallet address on Base Sepolia.
        </p>
        <div className="mt-6">
          <PaymentForm />
        </div>
      </div>

      {/* x402 info */}
      <div className="mt-6 rounded-2xl border border-(--color-magenta-200) bg-(--color-magenta-50) p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
          About x402
        </p>
        <p className="mt-3 text-sm leading-relaxed text-(--color-text-secondary)">
          The x402 protocol (by Coinbase) extends HTTP with native payment
          capabilities. When an agent requests a paid service, the server
          responds with HTTP 402 and payment instructions. The agent completes
          the payment on-chain, then retries the request with a proof. The
          result: fully autonomous agent-to-agent commerce.
        </p>
        <div className="mt-5 flex gap-2">
          <a
            href="https://www.x402.org"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-(--color-magenta-200) bg-white px-4 py-1.5 font-mono text-xs font-medium text-(--color-magenta-700) transition-colors hover:bg-(--color-magenta-100)"
          >
            x402.org
          </a>
          <a
            href="https://github.com/coinbase/x402"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-(--color-border) bg-white px-4 py-1.5 font-mono text-xs text-(--color-text-secondary) transition-colors hover:border-(--color-magenta-300) hover:text-(--color-magenta-700)"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}

function Step({ n, body }: { readonly n: number; readonly body: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) font-mono text-sm font-semibold text-(--color-magenta-700)">
        {n}
      </span>
      <p className="pt-1 text-sm leading-relaxed text-(--color-text-secondary)">
        {body}
      </p>
    </li>
  )
}
