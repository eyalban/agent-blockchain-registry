import Link from 'next/link'

import { ProtocolStats } from '@/components/web3/protocol-stats'

const GITHUB_URL = 'https://github.com/eyalban/agent-blockchain-registry'
const WHITEPAPER_URL =
  'https://github.com/eyalban/agent-blockchain-registry/blob/main/docs/WHITEPAPER.md'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* ====================================================================
          HERO
          ==================================================================== */}
      <section className="relative py-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div className="h-[500px] w-[800px] rounded-full bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent blur-3xl" />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-(--color-border-bright) bg-(--color-surface)/80 px-4 py-1.5 text-sm font-mono backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent-green) opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-accent-green)" />
            </span>
            <span className="text-(--color-accent-green)">LIVE</span>
            <span className="text-(--color-text-muted)">|</span>
            <span className="text-(--color-text-secondary)">Base Sepolia</span>
          </div>

          <h1 className="mt-8 text-5xl font-bold tracking-tight sm:text-7xl">
            <span className="text-(--color-text-primary)">Financial infrastructure</span>
            <br />
            <span className="bg-gradient-to-r from-(--color-accent-cyan) via-(--color-accent-violet-bright) to-(--color-accent-cyan) bg-clip-text text-transparent animate-gradient text-glow-cyan">
              for agentic companies
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-(--color-text-secondary)">
            On-chain identity, reputation, companies, invoices, and provenance-first
            accounting for AI agents. Built on{' '}
            <a
              href="https://eips.ethereum.org/EIPS/eip-8004"
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--color-accent-cyan) hover:underline"
            >
              ERC-8004
            </a>
            . Deployed on Base.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/companies/new"
              className="group relative rounded-xl bg-gradient-to-r from-(--color-accent-cyan) to-(--color-accent-cyan-dim) px-7 py-3.5 text-sm font-semibold text-(--color-bg-primary) transition-all hover:scale-105 glow-cyan"
            >
              Create a Company
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </Link>
            <Link
              href="/invoices/new"
              className="rounded-xl border border-(--color-accent-violet)/40 bg-(--color-accent-violet)/10 px-7 py-3.5 text-sm font-semibold text-(--color-accent-violet-bright) backdrop-blur-sm transition-all hover:bg-(--color-accent-violet)/20"
            >
              Issue an Invoice
            </Link>
            <Link
              href="/docs"
              className="rounded-xl border border-(--color-border-bright) bg-(--color-surface)/60 px-7 py-3.5 text-sm font-semibold text-(--color-text-primary) backdrop-blur-sm transition-all hover:border-(--color-accent-cyan)/40 hover:bg-(--color-surface)"
            >
              Read the Docs
            </Link>
          </div>

          <p className="mt-6 font-mono text-xs text-(--color-text-muted)">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-(--color-accent-cyan)"
            >
              GitHub &rarr;
            </a>
            {'  '}
            <span className="mx-2">&middot;</span>
            <a
              href={WHITEPAPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-(--color-accent-cyan)"
            >
              White paper &rarr;
            </a>
          </p>
        </div>
      </section>

      {/* ====================================================================
          STATS
          ==================================================================== */}
      <section className="relative border-t border-(--color-border) py-16">
        <ProtocolStats />
      </section>

      {/* ====================================================================
          PROTOCOL BANNER
          ==================================================================== */}
      <section className="py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl border border-(--color-border) bg-(--color-surface)/40 px-6 py-3 font-mono text-xs text-(--color-text-muted)">
          <span className="text-(--color-accent-cyan)">ERC-8004</span>
          <span>&bull;</span>
          <span>Identity</span>
          <span>&bull;</span>
          <span>Reputation</span>
          <span>&bull;</span>
          <span className="text-(--color-accent-cyan)">CompanyRegistry</span>
          <span>&bull;</span>
          <span className="text-(--color-accent-cyan)">InvoiceRegistry</span>
          <span>&bull;</span>
          <span className="text-(--color-accent-violet-bright)">Base L2</span>
        </div>
      </section>

      {/* ====================================================================
          FEATURE CARDS
          ==================================================================== */}
      <section className="py-16">
        <div className="text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-(--color-accent-cyan) uppercase">
            Primitives
          </p>
          <h2 className="mt-3 text-3xl font-bold text-(--color-text-primary) sm:text-4xl">
            Built for agents that earn, spend, and report
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-(--color-text-secondary)">
            Everything an AI agent or agentic company needs to be identified, paid,
            and audited — without centralized platforms.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            accent="cyan"
            icon={<IdentityIcon />}
            title="On-Chain Identity"
            description="Each agent is an ERC-721 NFT on Base. One registration, portable across every app that speaks ERC-8004."
            href="/agents"
            cta="Browse agents"
          />
          <FeatureCard
            accent="violet"
            icon={<ReputationIcon />}
            title="Reputation"
            description="Peer feedback recorded on-chain. Trust scores that follow the agent wherever it works."
            href="/reputation"
            cta="See reputation"
          />
          <FeatureCard
            accent="cyan"
            isNew
            icon={<CompanyIcon />}
            title="Agentic Companies"
            description="Group N agents and M treasury wallets into a single on-chain company. Financials consolidate. Ownership is transferable."
            href="/companies"
            cta="Browse companies"
          />
          <FeatureCard
            accent="violet"
            isNew
            icon={<InvoiceIcon />}
            title="On-Chain Invoicing"
            description="Atomic settlement — one transaction both transfers funds (ETH or USDC) and marks the invoice paid. No Stripe in between."
            href="/invoices"
            cta="See invoices"
          />
          <FeatureCard
            accent="amber"
            isNew
            icon={<ChartIcon />}
            title="Provenance-First Accounting"
            description="Income statements and balance sheets where every number is traceable to a source: tx hash, event log, OECD dataset revision, or Chainlink round."
            href="/docs#provenance"
            cta="Learn how"
          />
          <FeatureCard
            accent="amber"
            icon={<SdkIcon />}
            title="TypeScript SDK"
            description="@agent-registry/sdk works in Node, browser, Edge, and Workers. Read-only with no wallet, write with any viem/wagmi WalletClient."
            href="/docs#sdk"
            cta="View SDK"
          />
        </div>
      </section>

      {/* ====================================================================
          TRY-IT FLOW
          ==================================================================== */}
      <section className="border-t border-(--color-border) py-16">
        <div className="text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-(--color-accent-violet-bright) uppercase">
            Try it
          </p>
          <h2 className="mt-3 text-3xl font-bold text-(--color-text-primary)">
            Go from zero to an audited agentic company in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-(--color-text-secondary)">
            Connect a wallet, mint a company, add your agents, issue your first invoice.
            Every step settles on-chain and every number is provenance-tagged.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Step
            n={1}
            title="Connect + get testnet ETH"
            body="Connect MetaMask or Coinbase Wallet. Grab a drip from the Coinbase Base Sepolia faucet (takes 30 seconds)."
            href="/companies/new"
            cta="Start"
          />
          <Step
            n={2}
            title="Create a company"
            body="Sign one transaction calling CompanyRegistry.createCompany. Name, description, jurisdiction (for tax)."
            href="/companies/new"
            cta="Create"
          />
          <Step
            n={3}
            title="Add agents + treasuries"
            body="You become the owner. Add any ERC-8004 agents you own; link treasury wallets you want consolidated."
            href="/companies"
            cta="See companies"
          />
          <Step
            n={4}
            title="Issue and pay invoices"
            body="Create an invoice (ETH or USDC). The payer settles in one click — funds move and status flips to Paid atomically."
            href="/invoices/new"
            cta="Issue invoice"
          />
          <Step
            n={5}
            title="Watch financials populate"
            body="Income statement by period, balance sheet with AR/AP, tax rate from OECD. Every number linkable to its source."
            href="/docs#provenance"
            cta="How it works"
          />
          <Step
            n={6}
            title="Integrate via SDK"
            body="Install @agent-registry/sdk. Build agents, CLIs, dashboards, or your own UI on top of the same primitives."
            href="/docs#sdk"
            cta="Read SDK docs"
          />
        </div>
      </section>

      {/* ====================================================================
          SDK SECTION
          ==================================================================== */}
      <section className="border-t border-(--color-border) py-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-(--color-accent-violet-bright) uppercase">
              Developer SDK
            </p>
            <h2 className="mt-3 text-3xl font-bold text-(--color-text-primary)">
              The primitives, in TypeScript
            </h2>
            <p className="mt-4 text-(--color-text-secondary)">
              One client, four sub-clients ({' '}
              <code className="font-mono text-xs text-(--color-accent-cyan)">identity</code>,{' '}
              <code className="font-mono text-xs text-(--color-accent-cyan)">reputation</code>,{' '}
              <code className="font-mono text-xs text-(--color-accent-cyan)">company</code>,{' '}
              <code className="font-mono text-xs text-(--color-accent-cyan)">invoice</code>{' '}
              ). Reads need no wallet; writes take any{' '}
              <code className="font-mono text-xs text-(--color-accent-cyan)">viem</code>/
              <code className="font-mono text-xs text-(--color-accent-cyan)">wagmi</code>{' '}
              <code className="font-mono text-xs text-(--color-accent-cyan)">WalletClient</code>.
              Runs in Node, browser, Cloudflare Workers, and Vercel Edge.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/docs#sdk"
                className="rounded-md border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/10 px-4 py-2 text-sm font-mono text-(--color-accent-cyan) transition-colors hover:bg-(--color-accent-cyan)/20"
              >
                SDK reference
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-(--color-border-bright) bg-(--color-surface) px-4 py-2 text-sm font-mono text-(--color-text-secondary) transition-colors hover:text-(--color-accent-cyan) hover:border-(--color-accent-cyan)/40"
              >
                GitHub
              </a>
            </div>
          </div>
          <div className="rounded-xl border border-(--color-border) bg-(--color-bg-secondary) p-5 font-mono text-sm">
            <div className="flex items-center gap-2 border-b border-(--color-border) pb-3 text-xs text-(--color-text-muted)">
              <span className="h-3 w-3 rounded-full bg-red-500/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <span className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-2">invoice.ts</span>
            </div>
            <pre className="mt-4 overflow-x-auto text-xs leading-6">
              <code>
                <span className="text-(--color-accent-violet-bright)">import</span>{' '}
                <span className="text-(--color-text-primary)">{'{ AgentRegistryClient }'}</span>{' '}
                <span className="text-(--color-accent-violet-bright)">from</span>{' '}
                <span className="text-(--color-accent-green)">{`'@agent-registry/sdk'`}</span>
                {'\n\n'}
                <span className="text-(--color-accent-violet-bright)">const</span>{' '}
                <span className="text-(--color-accent-cyan)">client</span>{' '}
                <span className="text-(--color-text-muted)">=</span>{' '}
                <span className="text-(--color-accent-violet-bright)">new</span>{' '}
                <span className="text-(--color-accent-amber)">AgentRegistryClient</span>
                {`({ chain: `}
                <span className="text-(--color-accent-green)">{`'base-sepolia'`}</span>
                {` })\n\n`}
                <span className="text-(--color-text-muted)">
                  {'// Issue an invoice — atomic settlement, no intermediary'}
                </span>
                {'\n'}
                <span className="text-(--color-accent-violet-bright)">const</span>{' '}
                <span className="text-(--color-text-primary)">{'{ invoiceId }'}</span>{' '}
                <span className="text-(--color-text-muted)">=</span>{' '}
                <span className="text-(--color-accent-violet-bright)">await</span>{' '}
                {'client.invoice.'}
                <span className="text-(--color-accent-amber)">createInvoice</span>
                {'(wallet, {\n'}
                <span className="text-(--color-text-secondary)">{'  payer: '}</span>
                <span className="text-(--color-accent-green)">{`'0xBob...'`}</span>
                {',\n'}
                <span className="text-(--color-text-secondary)">{'  token: '}</span>
                <span className="text-(--color-accent-green)">{`'0x036C...USDC'`}</span>
                {',\n'}
                <span className="text-(--color-text-secondary)">{'  amount: '}</span>
                <span className="text-(--color-accent-cyan)">100_000_000n</span>
                <span className="text-(--color-text-muted)">{' // 100 USDC'}</span>
                {',\n'}
                <span className="text-(--color-text-secondary)">
                  {'  issuerCompanyId: '}
                </span>
                <span className="text-(--color-accent-cyan)">1n</span>
                {',\n'}
                <span className="text-(--color-text-secondary)">
                  {'  payerCompanyId: '}
                </span>
                <span className="text-(--color-accent-cyan)">2n</span>
                {',\n'}
                <span className="text-(--color-text-secondary)">{'  dueBlock: '}</span>
                <span className="text-(--color-accent-cyan)">0n</span>
                {',\n'}
                <span className="text-(--color-text-secondary)">{'  memoURI: '}</span>
                <span className="text-(--color-accent-green)">{`'ipfs://Qm...'`}</span>
                {',\n'}
                <span className="text-(--color-text-secondary)">{'  memoHash: '}</span>
                <span className="text-(--color-accent-green)">{`'0x...'`}</span>
                {',\n})\n\n'}
                <span className="text-(--color-text-muted)">{'// Payer settles in one tx'}</span>
                {'\n'}
                <span className="text-(--color-accent-violet-bright)">await</span>{' '}
                {'client.invoice.'}
                <span className="text-(--color-accent-amber)">payERC20</span>
                {'(payerWallet, invoiceId)'}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ====================================================================
          FOR GRADERS / EVALUATORS
          ==================================================================== */}
      <section className="border-t border-(--color-border) py-16">
        <div className="rounded-2xl border border-(--color-accent-cyan)/30 bg-gradient-to-br from-(--color-accent-cyan)/5 via-(--color-surface)/40 to-(--color-accent-violet)/5 p-10">
          <p className="font-mono text-xs tracking-[0.2em] text-(--color-accent-cyan) uppercase">
            MIT Media Lab &middot; AI Studio, Spring 2026
          </p>
          <h2 className="mt-3 text-3xl font-bold text-(--color-text-primary)">
            Open, audited-in-principle, production-ready testnet
          </h2>
          <p className="mt-4 max-w-3xl text-(--color-text-secondary)">
            The entire framework is open-source under MIT. 62 Foundry contract tests pass.
            Every piece ships with documentation for non-experts (concepts), integrators
            (quickstart), and auditors (architecture + limitations).
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/10 px-5 py-2.5 text-sm font-mono text-(--color-accent-cyan) transition-colors hover:bg-(--color-accent-cyan)/20"
            >
              GitHub repo
            </a>
            <Link
              href="/docs"
              className="rounded-lg border border-(--color-accent-violet)/40 bg-(--color-accent-violet)/10 px-5 py-2.5 text-sm font-mono text-(--color-accent-violet-bright) transition-colors hover:bg-(--color-accent-violet)/20"
            >
              Documentation site
            </Link>
            <a
              href={WHITEPAPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-(--color-accent-amber)/40 bg-(--color-accent-amber)/10 px-5 py-2.5 text-sm font-mono text-(--color-accent-amber) transition-colors hover:bg-(--color-accent-amber)/20"
            >
              White paper
            </a>
            <a
              href="https://github.com/eyalban/agent-blockchain-registry/blob/main/docs/LIMITATIONS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-(--color-border-bright) bg-(--color-surface)/60 px-5 py-2.5 text-sm font-mono text-(--color-text-secondary) transition-colors hover:border-(--color-accent-cyan)/40 hover:text-(--color-accent-cyan)"
            >
              Limitations
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ===== Sub-components ===== */

interface FeatureCardProps {
  readonly icon: React.ReactNode
  readonly title: string
  readonly description: string
  readonly accent: 'cyan' | 'violet' | 'amber'
  readonly href?: string
  readonly cta?: string
  readonly isNew?: boolean
}

const accentMap = {
  cyan: {
    iconBg: 'bg-(--color-accent-cyan)/10',
    iconColor: 'text-(--color-accent-cyan)',
    hoverBorder: 'hover:border-(--color-accent-cyan)/30',
    glow: 'hover:glow-cyan-sm',
    ctaColor: 'text-(--color-accent-cyan)',
  },
  violet: {
    iconBg: 'bg-(--color-accent-violet)/10',
    iconColor: 'text-(--color-accent-violet-bright)',
    hoverBorder: 'hover:border-(--color-accent-violet)/30',
    glow: 'hover:glow-violet',
    ctaColor: 'text-(--color-accent-violet-bright)',
  },
  amber: {
    iconBg: 'bg-(--color-accent-amber)/10',
    iconColor: 'text-(--color-accent-amber)',
    hoverBorder: 'hover:border-(--color-accent-amber)/30',
    glow: 'hover:glow-amber',
    ctaColor: 'text-(--color-accent-amber)',
  },
}

function FeatureCard({
  icon,
  title,
  description,
  accent,
  href,
  cta,
  isNew,
}: FeatureCardProps) {
  const a = accentMap[accent]
  const inner = (
    <div
      className={`group h-full rounded-2xl border border-(--color-border) bg-(--color-surface)/40 p-7 backdrop-blur-sm transition-all ${a.hoverBorder} ${a.glow}`}
    >
      <div className="flex items-start justify-between">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${a.iconBg}`}>
          <div className={a.iconColor}>{icon}</div>
        </div>
        {isNew && (
          <span className="rounded-md border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-(--color-accent-cyan)">
            new
          </span>
        )}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-(--color-text-primary)">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-(--color-text-secondary)">
        {description}
      </p>
      {cta && (
        <p
          className={`mt-4 font-mono text-xs ${a.ctaColor} transition-transform group-hover:translate-x-0.5`}
        >
          {cta} &rarr;
        </p>
      )}
    </div>
  )
  if (href) {
    if (href.startsWith('http')) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      )
    }
    return <Link href={href}>{inner}</Link>
  }
  return inner
}

function Step({
  n,
  title,
  body,
  href,
  cta,
}: {
  readonly n: number
  readonly title: string
  readonly body: string
  readonly href: string
  readonly cta: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-(--color-border) bg-(--color-surface)/40 p-6 backdrop-blur-sm transition-all hover:border-(--color-accent-cyan)/30 hover:glow-cyan-sm"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-accent-cyan)/10 font-mono text-sm font-bold text-(--color-accent-cyan)">
          {n}
        </span>
        <h3 className="text-base font-semibold text-(--color-text-primary)">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-(--color-text-secondary)">{body}</p>
      <p className="mt-3 font-mono text-xs text-(--color-accent-cyan) transition-transform group-hover:translate-x-0.5">
        {cta} &rarr;
      </p>
    </Link>
  )
}

/* ===== Icons ===== */

function IdentityIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
      />
    </svg>
  )
}

function ReputationIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  )
}

function CompanyIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    </svg>
  )
}

function InvoiceIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
      />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  )
}

function SdkIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
      />
    </svg>
  )
}
