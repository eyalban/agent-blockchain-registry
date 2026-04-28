import Link from 'next/link'

import { ProtocolStats } from '@/components/web3/protocol-stats'
import { LatestAgents } from '@/components/agents/latest-agents'
import { LatestCompanies } from '@/components/agents/latest-companies'

const GITHUB_URL = 'https://github.com/eyalban/agent-registry-framework'

// Server-render fresh data on each visit so the shortlists are in the
// initial HTML — no client-side fetch waterfall before first paint.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* ====================================================================
          HERO
          ==================================================================== */}
      <section className="relative pt-16 pb-10">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-3 py-1 text-xs font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-magenta-500) opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-magenta-600)" />
              </span>
              <span className="uppercase tracking-[0.14em] text-(--color-magenta-700)">Live</span>
              <span className="text-(--color-magenta-300)">/</span>
              <span className="text-(--color-text-secondary)">Base Sepolia · ERC-8004</span>
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.02em] text-(--color-text-primary) sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
              Banking and accounting
              <br />
              <span className="text-(--color-magenta-700)">for AI agents.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-(--color-text-secondary) sm:text-lg">
              statem8 gives every AI agent an on-chain identity, a reputation
              score, a parent company, and an audited income statement —
              issued, paid and reconciled atomically through smart contracts on
              Base.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-full bg-(--color-magenta-700) px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-all hover:bg-(--color-magenta-800)"
              >
                Sign in
                <span className="text-base">&rarr;</span>
              </Link>
              <Link
                href="/agents"
                className="inline-flex items-center gap-2 rounded-full border border-(--color-border-bright) bg-white px-6 py-3 text-sm font-semibold text-(--color-text-primary) transition-all hover:border-(--color-magenta-300) hover:text-(--color-magenta-700)"
              >
                Browse the registry
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-(--color-text-secondary) hover:text-(--color-magenta-700)"
              >
                GitHub &rarr;
              </a>
            </div>
          </div>

          {/* Right-side mini "console" */}
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[28px] bg-[radial-gradient(closest-side,rgba(236,72,153,0.16),transparent)] blur-2xl" />
            <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.10)]">
              <div className="flex items-center justify-between border-b border-(--color-border) pb-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">
                  Live network
                </p>
                <span className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-(--color-magenta-700)">
                  Base · 84532
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-y-4 text-sm">
                <ConsoleRow label="IdentityRegistry" value="ERC-8004" />
                <ConsoleRow label="ReputationRegistry" value="ERC-8004" />
                <ConsoleRow label="CompanyRegistry" value="statem8" />
                <ConsoleRow label="InvoiceRegistry" value="statem8" />
              </dl>

              <div className="mt-5 rounded-xl border border-(--color-border) bg-(--color-bg-secondary) p-4 font-mono text-[11px] leading-5 text-(--color-text-secondary)">
                <span className="text-(--color-magenta-700)">issue</span>{' '}
                <span>invoice</span>{' '}
                <span className="text-(--color-text-muted)">→</span>{' '}
                <span>payer settles</span>{' '}
                <span className="text-(--color-text-muted)">→</span>{' '}
                <span>funds + status flip atomically</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          KPI STRIP
          ==================================================================== */}
      <section className="py-6">
        <ProtocolStats />
      </section>

      {/* ====================================================================
          LIVE DATA: AGENTS + COMPANIES SHORTLISTS
          ==================================================================== */}
      <section className="pt-14 pb-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <LatestAgents limit={6} />
          </div>
          <div className="lg:col-span-2">
            <LatestCompanies limit={4} />
          </div>
        </div>
      </section>

      {/* ====================================================================
          PRODUCT PILLARS
          ==================================================================== */}
      <section className="pt-10 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-magenta-700)">
              Platform
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-(--color-text-primary) sm:text-3xl">
              Four primitives. One audited statement.
            </h2>
          </div>
          <Link
            href="/docs"
            className="hidden text-sm font-medium text-(--color-magenta-700) hover:text-(--color-magenta-800) sm:inline"
          >
            Read the docs &rarr;
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Pillar
            n="01"
            title="Identity"
            body="Every agent is an ERC-721 NFT under the canonical IdentityRegistry. One mint, portable across every app that speaks ERC-8004."
            href="/agents"
          />
          <Pillar
            n="02"
            title="Reputation"
            body="Peer feedback recorded on-chain. Trust scores follow the agent — not the platform — and are queryable by any client."
            href="/reputation"
          />
          <Pillar
            n="03"
            title="Companies"
            body="Group N agents and M treasury wallets into one company. Ownership is transferable; financials consolidate automatically."
            href="/companies"
          />
          <Pillar
            n="04"
            title="Invoicing"
            body="Atomic settlement — one transaction transfers funds (ETH or USDC) and flips the invoice to Paid. No Stripe in between."
            href="/invoices"
          />
        </div>
      </section>

      {/* ====================================================================
          WORKFLOW — what does this app actually do?
          ==================================================================== */}
      <section className="py-10">
        <div className="rounded-2xl border border-(--color-border) bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-magenta-700)">
            How it works
          </p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-(--color-text-primary) sm:text-3xl">
            From a fresh wallet to an audited agentic company in minutes.
          </h2>

          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Step
              n={1}
              title="Sign in"
              body="Use email + password, or connect a wallet. Email accounts can link a wallet later to sign transactions."
            />
            <Step
              n={2}
              title="Register agents"
              body="Mint an ERC-8004 agent NFT — name, description, capability tags, and an agent card published to IPFS or as a data URI."
            />
            <Step
              n={3}
              title="Spin up a company"
              body="Group your agents and treasury wallets under one CompanyRegistry entry. Set jurisdiction for tax handling."
            />
            <Step
              n={4}
              title="Issue + reconcile"
              body="Send invoices in ETH or USDC. The income statement and balance sheet populate automatically — every line traceable to a tx hash."
            />
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/companies/new"
              className="inline-flex items-center gap-2 rounded-full bg-(--color-magenta-700) px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-(--color-magenta-800)"
            >
              Create a company
            </Link>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-5 py-2.5 text-sm font-semibold text-(--color-magenta-700) transition-all hover:bg-(--color-magenta-100)"
            >
              Issue an invoice
            </Link>
            <Link
              href="/whitepaper"
              className="text-sm font-medium text-(--color-text-secondary) hover:text-(--color-magenta-700)"
            >
              Read the white paper &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          FOOTER NOTE
          ==================================================================== */}
      <section className="pt-2 pb-12">
        <p className="text-center font-mono text-xs text-(--color-text-muted)">
          MIT Media Lab · AI Studio Spring 2026 · open-source under MIT
        </p>
      </section>
    </div>
  )
}

/* ===== Sub-components ===== */

function ConsoleRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <>
      <dt className="font-mono text-xs text-(--color-text-muted)">{label}</dt>
      <dd className="text-right font-mono text-xs text-(--color-text-primary)">{value}</dd>
    </>
  )
}

function Pillar({
  n,
  title,
  body,
  href,
}: {
  readonly n: string
  readonly title: string
  readonly body: string
  readonly href: string
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-(--color-magenta-300) hover:shadow-[0_12px_28px_-12px_rgba(219,39,119,0.20)]"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-(--color-text-muted)">{n}</span>
        <span className="text-(--color-magenta-700) opacity-0 transition-opacity group-hover:opacity-100">
          &rarr;
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-(--color-text-primary)">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-(--color-text-secondary)">{body}</p>
    </Link>
  )
}

function Step({
  n,
  title,
  body,
}: {
  readonly n: number
  readonly title: string
  readonly body: string
}) {
  return (
    <li className="relative pl-10">
      <span className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) font-mono text-xs font-semibold text-(--color-magenta-700)">
        {n}
      </span>
      <h3 className="text-sm font-semibold text-(--color-text-primary)">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-secondary)">{body}</p>
    </li>
  )
}
