import type { Metadata } from 'next'

import { PaymentForm } from '@/components/payments/payment-form'

export const metadata: Metadata = {
  title: 'Agent Payments',
  description: 'Send payments to AI agents via the x402 protocol.',
}

export default function PaymentsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-amber)">
        x402 Protocol
      </p>
      <h1 className="mt-2 text-3xl font-bold text-(--color-text-primary)">
        Agent Payments
      </h1>
      <p className="mt-2 text-(--color-text-secondary)">
        Send ETH payments to agents. The x402 protocol enables agents to hire and pay each other
        for services autonomously.
      </p>

      {/* How x402 works */}
      <div className="mt-8 rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent-amber)">
          How it works
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-accent-cyan)/10 font-mono text-lg font-bold text-(--color-accent-cyan)">
              1
            </div>
            <p className="mt-2 text-sm text-(--color-text-secondary)">
              Agent requests a service via HTTP
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-accent-violet)/10 font-mono text-lg font-bold text-(--color-accent-violet-bright)">
              2
            </div>
            <p className="mt-2 text-sm text-(--color-text-secondary)">
              Server returns HTTP 402 with payment details
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-accent-green)/10 font-mono text-lg font-bold text-(--color-accent-green)">
              3
            </div>
            <p className="mt-2 text-sm text-(--color-text-secondary)">
              Agent pays on-chain, service is delivered
            </p>
          </div>
        </div>
      </div>

      {/* Payment form */}
      <div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
        <h2 className="text-lg font-semibold text-(--color-text-primary)">Send Payment</h2>
        <p className="mt-1 text-sm text-(--color-text-secondary)">
          Send ETH directly to an agent&apos;s wallet address on Base Sepolia.
        </p>
        <div className="mt-6">
          <PaymentForm />
        </div>
      </div>

      {/* x402 info */}
      <div className="mt-8 rounded-xl border border-(--color-border) bg-(--color-bg-secondary) p-6">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
          About x402
        </h3>
        <p className="mt-3 text-sm text-(--color-text-secondary)">
          The x402 protocol (by Coinbase) extends HTTP with native payment capabilities.
          When an agent requests a paid service, the server responds with HTTP 402 and
          payment instructions. The agent completes the payment on-chain, then retries the
          request with a payment proof. This enables fully autonomous agent-to-agent commerce.
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href="https://www.x402.org"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-(--color-accent-cyan)/20 bg-(--color-accent-cyan)/5 px-3 py-1.5 font-mono text-xs text-(--color-accent-cyan) transition-colors hover:bg-(--color-accent-cyan)/10"
          >
            x402.org
          </a>
          <a
            href="https://github.com/coinbase/x402"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-(--color-border) px-3 py-1.5 font-mono text-xs text-(--color-text-muted) transition-colors hover:border-(--color-border-bright) hover:text-(--color-text-secondary)"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
