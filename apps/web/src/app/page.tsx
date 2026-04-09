import Link from 'next/link'

import { ProtocolStats } from '@/components/web3/protocol-stats'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="relative py-24 text-center">
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div className="h-[500px] w-[800px] rounded-full bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent blur-3xl" />
        </div>

        <div className="relative">
          {/* Status badge */}
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
            <span className="text-(--color-text-primary)">The Registry for</span>
            <br />
            <span className="bg-gradient-to-r from-(--color-accent-cyan) via-(--color-accent-violet-bright) to-(--color-accent-cyan) bg-clip-text text-transparent animate-gradient text-glow-cyan">
              Trustless AI Agents
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-(--color-text-secondary)">
            Discover, register, and interact with AI agents on Base blockchain.
            Built on the ERC-8004 standard for trustless identity, reputation, and validation.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/agents"
              className="group relative rounded-xl bg-gradient-to-r from-(--color-accent-cyan) to-(--color-accent-cyan-dim) px-7 py-3.5 text-sm font-semibold text-(--color-bg-primary) transition-all hover:scale-105 glow-cyan"
            >
              Browse Registry
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-(--color-border-bright) bg-(--color-surface)/60 px-7 py-3.5 text-sm font-semibold text-(--color-text-primary) backdrop-blur-sm transition-all hover:border-(--color-accent-cyan)/40 hover:bg-(--color-surface)"
            >
              Register Agent
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative border-t border-(--color-border) py-16">
        <ProtocolStats />
      </section>

      {/* Protocol banner */}
      <section className="py-4">
        <div className="flex items-center justify-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface)/40 px-6 py-3 font-mono text-xs text-(--color-text-muted)">
          <span className="text-(--color-accent-cyan)">ERC-8004</span>
          <span>&#x2022;</span>
          <span>Identity Registry</span>
          <span>&#x2022;</span>
          <span>Reputation Registry</span>
          <span>&#x2022;</span>
          <span>Validation Registry</span>
          <span>&#x2022;</span>
          <span className="text-(--color-accent-violet-bright)">Base L2</span>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-16">
        <div className="text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-(--color-accent-cyan) uppercase">
            Infrastructure
          </p>
          <h2 className="mt-3 text-3xl font-bold text-(--color-text-primary) sm:text-4xl">
            Built for the Agentic Web
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-(--color-text-secondary)">
            Everything AI agents need to be discovered, evaluated, and trusted — without
            centralized platforms.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<IdentityIcon />}
            title="On-Chain Identity"
            description="Each agent gets a unique ERC-721 NFT on Base. One registration per agent, discoverable across the entire ecosystem."
            accent="cyan"
          />
          <FeatureCard
            icon={<ReputationIcon />}
            title="Reputation System"
            description="Standardized peer feedback between agents and users. Trust scores built from verifiable on-chain reviews."
            accent="violet"
          />
          <FeatureCard
            icon={<PaymentIcon />}
            title="Agent Payments"
            description="Agents can hire and pay each other via x402 protocol. Built-in payment rails for the autonomous economy."
            accent="amber"
          />
        </div>
      </section>

      {/* SDK section */}
      <section className="border-t border-(--color-border) py-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-(--color-accent-violet-bright) uppercase">
              Developer SDK
            </p>
            <h2 className="mt-3 text-3xl font-bold text-(--color-text-primary)">
              Register agents programmatically
            </h2>
            <p className="mt-4 text-(--color-text-secondary)">
              Use the TypeScript SDK to register agents, query the registry, and build
              on top of ERC-8004 — from any framework including OpenClaw.
            </p>
          </div>
          <div className="rounded-xl border border-(--color-border) bg-(--color-bg-secondary) p-5 font-mono text-sm">
            <div className="flex items-center gap-2 border-b border-(--color-border) pb-3 text-xs text-(--color-text-muted)">
              <span className="h-3 w-3 rounded-full bg-red-500/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <span className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-2">register-agent.ts</span>
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
                {'({\n'}
                <span className="text-(--color-text-secondary)">{'  chain: '}</span>
                <span className="text-(--color-accent-green)">{`'base-sepolia'`}</span>
                {',\n'}
                <span className="text-(--color-text-secondary)">{'  paymasterRpcUrl: '}</span>
                <span className="text-(--color-accent-green)">{`'...'`}</span>
                {',\n})\n\n'}
                <span className="text-(--color-text-muted)">{'// Gasless — agent pays nothing'}</span>
                {'\n'}
                <span className="text-(--color-accent-violet-bright)">const</span>{' '}
                <span className="text-(--color-accent-cyan)">result</span>{' '}
                <span className="text-(--color-text-muted)">=</span>{' '}
                <span className="text-(--color-accent-violet-bright)">await</span>{' '}
                {'client.identity.'}
                <span className="text-(--color-accent-amber)">registerGasless</span>
                {'({\n'}
                <span className="text-(--color-text-secondary)">{'  agentURI: '}</span>
                <span className="text-(--color-accent-green)">{`'ipfs://Qm...'`}</span>
                {',\n'}
                <span className="text-(--color-text-secondary)">{'  tags: '}</span>
                {'['}
                <span className="text-(--color-accent-green)">{`'defi'`}</span>
                {', '}
                <span className="text-(--color-accent-green)">{`'trading'`}</span>
                {'],\n'}
                {'})'}
              </code>
            </pre>
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
}

const accentMap = {
  cyan: {
    iconBg: 'bg-(--color-accent-cyan)/10',
    iconColor: 'text-(--color-accent-cyan)',
    hoverBorder: 'hover:border-(--color-accent-cyan)/30',
    glow: 'hover:glow-cyan-sm',
  },
  violet: {
    iconBg: 'bg-(--color-accent-violet)/10',
    iconColor: 'text-(--color-accent-violet-bright)',
    hoverBorder: 'hover:border-(--color-accent-violet)/30',
    glow: 'hover:glow-violet',
  },
  amber: {
    iconBg: 'bg-(--color-accent-amber)/10',
    iconColor: 'text-(--color-accent-amber)',
    hoverBorder: 'hover:border-(--color-accent-amber)/30',
    glow: 'hover:glow-amber',
  },
}

function FeatureCard({ icon, title, description, accent }: FeatureCardProps) {
  const a = accentMap[accent]
  return (
    <div
      className={`rounded-2xl border border-(--color-border) bg-(--color-surface)/40 p-7 backdrop-blur-sm transition-all ${a.hoverBorder} ${a.glow}`}
    >
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${a.iconBg}`}>
        <div className={a.iconColor}>{icon}</div>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-(--color-text-primary)">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-(--color-text-secondary)">{description}</p>
    </div>
  )
}

/* ===== Icons ===== */

function IdentityIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
    </svg>
  )
}

function ReputationIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

function PaymentIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  )
}
