import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Documentation · Agent Registry',
  description:
    'Plain-English introduction to agentic companies, on-chain invoices, and provenance-first accounting — plus SDK and API reference.',
}

const PRIMITIVES = [
  {
    name: 'Identity',
    sub: 'Canonical ERC-8004',
    desc: 'Every agent is an NFT. Public, transferable, portable across apps.',
    contract: 'IdentityRegistry',
    address: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  },
  {
    name: 'Reputation',
    sub: 'Canonical ERC-8004',
    desc: 'Clients who transacted with an agent can leave structured on-chain feedback. Reputation follows the agent across apps.',
    contract: 'ReputationRegistry',
    address: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
  },
  {
    name: 'Discovery',
    sub: 'AgentRegistryWrapper',
    desc: 'Thin layer on top of the canonical identity: tags, registration fees, featured agents, activity tracking.',
    contract: 'AgentRegistryWrapper',
    address: '0xC02DE01B0ecBcE17c4E71fc7A0Ad86764B3DF64C',
  },
  {
    name: 'Company',
    sub: 'CompanyRegistry',
    desc: 'Group N agents plus treasury wallets into an agentic company. Ownership is a single EOA (multi-sig coming in v1.1).',
    contract: 'CompanyRegistry',
    address: '0xD557AF896A116bdb9A671f2eB45baAa8e521f77f',
    isNew: true,
  },
  {
    name: 'Invoice',
    sub: 'InvoiceRegistry',
    desc: 'Issue, pay (ETH or ERC-20), cancel. One transaction both transfers funds and marks the invoice paid \u2014 AR/AP can never go stale.',
    contract: 'InvoiceRegistry',
    address: '0x645acDD5f85B52AD0CcE55B1c4f4Ac8BA00EC0Ac',
    isNew: true,
  },
]

const CONCEPTS = [
  {
    title: 'What is an agentic company?',
    body: 'A human company has employees, bank accounts, and financial reports. An agentic company is the same idea for AI agents: a group of ERC-8004 agents plus one or more treasury wallets whose financials consolidate. You mint one on-chain by signing a single transaction \u2014 the blockchain record is the company.',
  },
  {
    title: 'How does on-chain invoicing work?',
    body: "An invoice is a record inside the InvoiceRegistry contract: issuer, payer, amount, token, memo. The payer settles in one transaction (ETH or USDC). The contract atomically transfers funds and marks the invoice paid \u2014 there is no gap where it appears paid but the money hasn't moved.",
  },
  {
    title: 'Where do tax rates come from?',
    body: 'Nothing is hardcoded. Statutory corporate tax rates come from the OECD Corporate Tax Statistics dataset (38 jurisdictions seeded, annually refreshable). Companies can override with an effective rate, but only with a source reference (URL or IPFS hash) pointing to the underlying tax filing or CFO attestation. If no rate resolves, the UI refuses to compute tax rather than invent a number.',
  },
  {
    title: 'What does "provenance-first" mean?',
    body: 'Every USD value on every financial statement is traceable to a real source: a transaction hash, an event log, an OECD dataset revision, a Chainlink feed address + round, or a CoinGecko endpoint. Click any number and it resolves to its origin. Web2 accounting software cannot offer this \u2014 by the time data reaches the income statement, the original provenance has been stripped.',
  },
  {
    title: 'How are transaction labels cross-validated?',
    body: 'When both sides of a transaction are in our registry, we compare their independently-assigned labels. If agent A labels a transaction as "revenue" and agent B labels the counterpart as "sga_expense", matched. If both claim revenue, mismatched \u2014 surfaced as an audit flag. If only one side is in the registry, pending. Think double-entry bookkeeping with every counterparty in the world.',
  },
]

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/agents', desc: 'List registered agents (paginated).' },
  { method: 'GET', path: '/api/v1/agents/:id', desc: 'Single agent with parsed card + tags.' },
  { method: 'GET', path: '/api/v1/agents/:id/financials', desc: 'Per-agent income statement (pre-tax; tax is company-level).' },
  { method: 'POST', path: '/api/v1/agents/:id/transactions/sync', desc: 'Sync native + ERC-20 txs from Blockscout with USD snapshots.' },
  { method: 'GET', path: '/api/v1/companies', desc: 'List companies.' },
  { method: 'POST', path: '/api/v1/companies', desc: 'Mirror a createCompany tx (body: { txHash }).' },
  { method: 'GET', path: '/api/v1/companies/:id', desc: 'Company detail with members + treasuries.' },
  { method: 'GET', path: '/api/v1/companies/:id/financials/income-statement', desc: 'Company P&L by period with tax provenance.' },
  { method: 'GET', path: '/api/v1/companies/:id/financials/balance-sheet', desc: 'Company balance sheet (cash + AR/AP + equity).' },
  { method: 'POST', path: '/api/v1/companies/:id/costs', desc: 'Import off-chain costs (single or bulk).' },
  { method: 'GET', path: '/api/v1/companies/:id/tax-rates', desc: 'Resolved rate + history with full provenance.' },
  { method: 'POST', path: '/api/v1/companies/:id/tax-rates', desc: 'Record company override (requires sourceRef).' },
  { method: 'GET', path: '/api/v1/invoices', desc: 'List invoices (filter by issuer, payer, company, status).' },
  { method: 'POST', path: '/api/v1/invoices', desc: 'Mirror a createInvoice tx (body: { txHash }).' },
  { method: 'GET', path: '/api/v1/invoices/:id', desc: 'Single invoice with full lifecycle.' },
  { method: 'POST', path: '/api/v1/invoices/:id/paid', desc: 'Mirror an InvoicePaid event.' },
  { method: 'POST', path: '/api/v1/invoices/:id/cancel', desc: 'Mirror an InvoiceCancelled event.' },
  { method: 'GET', path: '/api/v1/transactions/:txHash/validations', desc: 'Counterparty reconciliation result.' },
  { method: 'POST', path: '/api/v1/admin/tax-rates/sync', desc: 'Seed OECD tax rates (one-time).' },
]

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-cyan)">
        Documentation
      </p>
      <h1 className="mt-2 text-4xl font-bold text-(--color-text-primary)">
        Agent Registry &mdash; Docs
      </h1>
      <p className="mt-3 max-w-2xl text-(--color-text-secondary)">
        Financial infrastructure for AI agents and agentic companies: on-chain
        identity, reputation, invoices, and provenance-first accounting.
        Built on{' '}
        <a
          className="text-(--color-accent-cyan) hover:underline"
          href="https://eips.ethereum.org/EIPS/eip-8004"
          target="_blank"
          rel="noopener noreferrer"
        >
          ERC-8004
        </a>{' '}
        on Base Sepolia.
      </p>

      <nav className="mt-8 flex flex-wrap gap-2">
        <Anchor href="#concepts">Concepts</Anchor>
        <Anchor href="#primitives">Primitives</Anchor>
        <Anchor href="#flow">Try it</Anchor>
        <Anchor href="#sdk">SDK</Anchor>
        <Anchor href="#api">REST API</Anchor>
        <Anchor href="#provenance">Provenance</Anchor>
      </nav>

      {/* CONCEPTS */}
      <section id="concepts" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-(--color-text-primary)">Concepts</h2>
        <p className="mt-2 text-(--color-text-secondary)">
          Plain-English primer &mdash; no blockchain background required.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {CONCEPTS.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5"
            >
              <h3 className="text-sm font-semibold text-(--color-accent-cyan)">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-(--color-text-secondary)">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PRIMITIVES */}
      <section id="primitives" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold text-(--color-text-primary)">Primitives</h2>
        <p className="mt-2 text-(--color-text-secondary)">
          Five on-chain contracts, deployed on Base Sepolia.
        </p>
        <div className="mt-5 space-y-3">
          {PRIMITIVES.map((p) => (
            <div
              key={p.contract}
              className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-(--color-text-primary)">{p.name}</h3>
                    {p.isNew && (
                      <span className="rounded-md border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-(--color-accent-cyan)">
                        new
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-(--color-text-muted)">{p.sub}</p>
                  <p className="mt-2 text-sm text-(--color-text-secondary)">{p.desc}</p>
                </div>
              </div>
              <a
                href={`https://sepolia.basescan.org/address/${p.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block break-all font-mono text-xs text-(--color-accent-cyan) hover:underline"
              >
                {p.address}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* TRY IT */}
      <section id="flow" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold text-(--color-text-primary)">Try it</h2>
        <p className="mt-2 text-(--color-text-secondary)">End-to-end flow from the live app.</p>
        <ol className="mt-5 space-y-3 text-sm text-(--color-text-secondary)">
          <Step n={1}>
            Connect a wallet (MetaMask, Coinbase Wallet). Get Base Sepolia ETH from{' '}
            <a
              href="https://portal.cdp.coinbase.com/products/faucet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--color-accent-cyan) hover:underline"
            >
              the Coinbase faucet
            </a>
            .
          </Step>
          <Step n={2}>
            Go to{' '}
            <Link href="/companies/new" className="text-(--color-accent-cyan) hover:underline">
              Companies &rarr; Create Company
            </Link>
            . Fill in name, description, and jurisdiction (e.g.{' '}
            <code className="font-mono text-xs">USA</code>). Sign one tx.
          </Step>
          <Step n={3}>
            Open your new company. Add an agent &mdash; you must own it in the canonical ERC-8004
            Identity Registry. Add a treasury wallet (any address whose balances count toward this
            company).
          </Step>
          <Step n={4}>
            Open the <strong>Income Statement</strong> tab. As soon as member agents have synced
            transactions, a full P&amp;L appears &mdash; every line traceable to on-chain events or
            imported off-chain costs.
          </Step>
          <Step n={5}>
            Open the <strong>Tax Rates</strong> tab. The statutory rate for your jurisdiction is
            already there, from the OECD dataset. Record an effective-rate override if your company
            has filed taxes.
          </Step>
          <Step n={6}>
            <Link href="/invoices/new" className="text-(--color-accent-cyan) hover:underline">
              Issue an invoice
            </Link>{' '}
            to another agent. Switch to that wallet and pay &mdash; one tx settles atomically. Both
            companies&rsquo; balance sheets update in seconds.
          </Step>
        </ol>
      </section>

      {/* SDK */}
      <section id="sdk" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold text-(--color-text-primary)">TypeScript SDK</h2>
        <p className="mt-2 text-(--color-text-secondary)">
          Install{' '}
          <code className="font-mono text-xs text-(--color-accent-cyan)">@agent-registry/sdk</code>{' '}
          and <code className="font-mono text-xs text-(--color-accent-cyan)">viem</code>. Works in
          Node, browser, Workers, and Edge runtimes.
        </p>
        <div className="mt-5 rounded-xl border border-(--color-border) bg-(--color-bg-secondary) p-5 font-mono text-sm">
          <div className="flex items-center gap-2 border-b border-(--color-border) pb-3 text-xs text-(--color-text-muted)">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <span className="h-3 w-3 rounded-full bg-green-500/60" />
            <span className="ml-2">sdk.ts</span>
          </div>
          <pre className="mt-4 overflow-x-auto text-xs leading-6">
{`import { AgentRegistryClient } from '@agent-registry/sdk'

const client = new AgentRegistryClient({ chain: 'base-sepolia' })

// Reads \u2014 no wallet needed
const company = await client.company.getCompany(1n)
const invoice = await client.invoice.getInvoice(1n)

// Writes \u2014 pass a viem WalletClient
const { invoiceId } = await client.invoice.createInvoice(walletClient, {
  payer: '0x...',
  issuerCompanyId: 1n,
  payerCompanyId: 2n,
  token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC
  amount: 100_000_000n,                                // 100 USDC
  dueBlock: 0n,
  memoURI: 'ipfs://Qm...',
  memoHash: '0x...',
})

// Pay
await client.invoice.payERC20(walletClient, invoiceId)`}
          </pre>
        </div>
      </section>

      {/* REST API */}
      <section id="api" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold text-(--color-text-primary)">REST API</h2>
        <p className="mt-2 text-(--color-text-secondary)">
          Same base URL as the app. Open, no auth required (rate limiting only).
        </p>
        <div className="mt-5 overflow-hidden rounded-xl border border-(--color-border)">
          <table className="w-full text-sm">
            <thead className="bg-(--color-bg-secondary)">
              <tr>
                <th className="px-3 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
                  Method
                </th>
                <th className="px-3 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
                  Endpoint
                </th>
                <th className="px-3 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
                  What it does
                </th>
              </tr>
            </thead>
            <tbody>
              {API_ENDPOINTS.map((e) => (
                <tr key={`${e.method}-${e.path}`} className="border-t border-(--color-border)/40">
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
                        e.method === 'GET'
                          ? 'bg-(--color-accent-cyan)/10 text-(--color-accent-cyan)'
                          : e.method === 'POST'
                            ? 'bg-(--color-accent-amber)/10 text-(--color-accent-amber)'
                            : 'bg-(--color-accent-red)/10 text-(--color-accent-red)'
                      }`}
                    >
                      {e.method}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-(--color-text-primary)">
                    {e.path}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-(--color-text-secondary)">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PROVENANCE */}
      <section id="provenance" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold text-(--color-text-primary)">
          Provenance-first accounting
        </h2>
        <p className="mt-2 text-(--color-text-secondary)">
          Every number you see in this product is traceable to a real, named source. No hardcoded
          values anywhere.
        </p>
        <div className="mt-5 space-y-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-5 text-sm">
          <p className="text-(--color-text-secondary)">
            <strong className="text-(--color-text-primary)">Token prices.</strong> Chainlink
            AggregatorV3 feeds first (
            <span className="font-mono text-xs text-(--color-accent-cyan)">ETH/USD</span>,{' '}
            <span className="font-mono text-xs text-(--color-accent-cyan)">USDC/USD</span>),
            CoinGecko historical API as fallback. Cached per-block. Every row carries{' '}
            <code className="font-mono text-xs">source</code> and{' '}
            <code className="font-mono text-xs">source_ref</code>. No peg assumed.
          </p>
          <p className="text-(--color-text-secondary)">
            <strong className="text-(--color-text-primary)">Tax rates.</strong> OECD Corporate Tax
            Statistics snapshot for 38 jurisdictions, with precedence-ordered override for
            company-specific effective rates backed by IPFS/URL documentation. If no rate resolves,
            tax is not computed.
          </p>
          <p className="text-(--color-text-secondary)">
            <strong className="text-(--color-text-primary)">Transaction labels.</strong> Calldata +
            event decoding first (high confidence); heuristic fallback (low confidence, flagged).
            When both sides of a tx are in the registry, labels are cross-reconciled &mdash;
            matched, mismatched, or pending.
          </p>
          <p className="text-(--color-text-secondary)">
            <strong className="text-(--color-text-primary)">Off-chain costs.</strong> Imported via
            CSV or API. Every row carries{' '}
            <code className="font-mono text-xs">source_ref</code> (vendor invoice id / file name).
            Never estimated.
          </p>
        </div>
      </section>

      <div className="mt-16 rounded-xl border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/5 p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-cyan)">
          Open Source
        </p>
        <h3 className="mt-2 text-lg font-bold text-(--color-text-primary)">
          The framework lives on GitHub
        </h3>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          The on-chain contracts, TypeScript SDK, and subgraph are published as an open-source
          framework. The app you are reading this on is a reference implementation that consumes
          the framework.
        </p>
        <a
          href="https://github.com/eyalban/agent-blockchain-registry"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-md border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/10 px-4 py-2 font-mono text-sm text-(--color-accent-cyan) hover:bg-(--color-accent-cyan)/20"
        >
          View on GitHub &rarr;
        </a>
      </div>
    </div>
  )
}

function Anchor({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-xs text-(--color-text-secondary) transition-colors hover:border-(--color-accent-cyan)/40 hover:text-(--color-accent-cyan)"
    >
      {children}
    </Link>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-(--color-accent-cyan)/10 font-mono text-[11px] font-bold text-(--color-accent-cyan)">
        {n}
      </span>
      <span className="pt-0.5 leading-relaxed">{children}</span>
    </li>
  )
}

