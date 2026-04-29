import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { KpiStrip } from '@/components/ui/kpi-strip'
import { TX_EXPLORER_URL } from '@agent-registry/shared'
import { getSessionUser } from '@/lib/auth'
import { env } from '@/lib/env'
import { truncateAddress } from '@/lib/utils'
import {
  getUserAgents,
  getUserCompanies,
  getUserInvoices,
  getUserWallets,
  getWorkspaceSummary,
} from '@/lib/workspace'

export const metadata: Metadata = {
  title: 'My workspace · statem8',
  description:
    'Private dashboard for the agents, companies, and invoices attached to your account.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

function fmtUsd(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 10_000) return `$${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
}

export default async function WorkspacePage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/signin?next=/workspace')
  }

  const wallets = await getUserWallets(user.id)
  const [summary, agents, companies, invoices] = await Promise.all([
    getWorkspaceSummary(wallets),
    getUserAgents(wallets),
    getUserCompanies(wallets),
    getUserInvoices(wallets),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
        Private dashboard
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
        Welcome, {user.displayName ?? user.email.split('@')[0]}
      </h1>
      <p className="mt-3 max-w-2xl text-(--color-text-secondary)">
        Everything attributed to your verified wallets. Only addresses you have
        signed a personal_sign challenge for show up here, and each address
        can only be linked to one statem8 account at a time.
      </p>

      <div className="mt-8">
        <KpiStrip
          cells={[
            { label: 'Verified wallets', value: summary.walletsCount.toString() },
            { label: 'Agents you own', value: summary.agentsCount.toString() },
            { label: 'Companies', value: summary.companiesCount.toString() },
            {
              label: 'Outstanding to pay',
              value: fmtUsd(summary.outstandingUsd),
              sub: `${summary.invoicesPayable} invoices payable`,
            },
          ]}
        />
      </div>

      {wallets.length === 0 ? (
        <NoWalletsHint />
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--color-border) bg-white px-6 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">
              Verified wallets
            </span>
            {wallets.map((w) => (
              <span
                key={w}
                className="rounded-full border border-(--color-border) bg-(--color-bg-secondary) px-2.5 py-1 font-mono text-xs text-(--color-text-secondary)"
              >
                {truncateAddress(w as `0x${string}`)}
              </span>
            ))}
          </div>
          <Link
            href="/workspace/claim-keys"
            className="text-sm font-medium text-(--color-magenta-700) hover:text-(--color-magenta-800)"
          >
            + Issue another claim key
          </Link>
        </div>
      )}

      <Section
        title="Your agents"
        viewAllHref="/agents"
        empty="No agents are attributed to your verified wallets yet."
      >
        {agents.length > 0 && (
          <ul className="divide-y divide-(--color-border)">
            {agents.slice(0, 8).map((a) => (
              <li key={a.agentId}>
                <Link
                  href={`/agents/${a.agentId}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-(--color-magenta-50)"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-(--color-magenta-100) to-(--color-magenta-200) font-mono text-xs font-bold text-(--color-magenta-700)">
                    {(a.name ?? a.agentId).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-(--color-text-primary)">
                      {a.name ?? `Agent #${a.agentId}`}
                    </p>
                    <p className="truncate text-xs text-(--color-text-secondary)">
                      {a.description || `Owner ${truncateAddress(a.ownerAddress as `0x${string}`)}`}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-(--color-text-muted)">
                    #{a.agentId}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Your companies"
        viewAllHref="/companies"
        empty="You have not founded or been transferred ownership of a company."
        action={
          <Link
            href="/companies/new"
            className="text-sm font-medium text-(--color-magenta-700) hover:text-(--color-magenta-800)"
          >
            + New company
          </Link>
        }
      >
        {companies.length > 0 && (
          <ul className="divide-y divide-(--color-border)">
            {companies.slice(0, 8).map((c) => (
              <li key={c.companyId}>
                <Link
                  href={`/companies/${c.companyId}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-(--color-magenta-50)"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-(--color-magenta-500) to-(--color-magenta-700) font-mono text-xs font-bold text-white">
                    {(c.name ?? c.companyId).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-(--color-text-primary)">
                      {c.name ?? `Company #${c.companyId}`}
                    </p>
                    <p className="truncate text-xs text-(--color-text-secondary)">
                      {c.description ?? `Founded by ${truncateAddress(c.founderAddress as `0x${string}`)}`}
                    </p>
                  </div>
                  {c.jurisdictionCode && (
                    <span className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2 py-0.5 font-mono text-[10px] uppercase text-(--color-magenta-700)">
                      {c.jurisdictionCode}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Your invoices"
        empty="No invoices issued by or payable to your wallets yet."
        action={
          <Link
            href="/invoices/new"
            className="text-sm font-medium text-(--color-magenta-700) hover:text-(--color-magenta-800)"
          >
            + New invoice
          </Link>
        }
      >
        {invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-(--color-border) bg-(--color-bg-secondary)">
                <tr>
                  <Th>#</Th>
                  <Th>Direction</Th>
                  <Th>Counterparty</Th>
                  <Th right>Amount</Th>
                  <Th right>USD</Th>
                  <Th>Status</Th>
                  <Th>Issued</Th>
                  <Th>Tx</Th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 25).map((inv) => {
                  const counterparty =
                    inv.direction === 'outgoing' ? inv.payer_address : inv.issuer_address
                  const human =
                    Number(inv.amount_raw) /
                    10 ** (inv.token_symbol === 'USDC' ? 6 : 18)
                  return (
                    <tr
                      key={inv.invoice_id}
                      className="border-b border-(--color-border) transition-colors hover:bg-(--color-magenta-50)"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/invoices/${inv.invoice_id}`}
                          className="font-mono text-sm font-medium text-(--color-magenta-700) hover:underline"
                        >
                          #{inv.invoice_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                            inv.direction === 'incoming'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-(--color-magenta-200) bg-(--color-magenta-50) text-(--color-magenta-700)'
                          }`}
                        >
                          {inv.direction === 'incoming' ? 'Receivable' : 'Payable'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-(--color-text-secondary)">
                        {truncateAddress(counterparty as `0x${string}`)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-(--color-text-primary)">
                        {human.toFixed(inv.token_symbol === 'USDC' ? 2 : 6)}{' '}
                        <span className="text-(--color-text-muted)">{inv.token_symbol}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-(--color-text-secondary)">
                        {inv.amount_usd_at_issue
                          ? fmtUsd(Number(inv.amount_usd_at_issue))
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={inv.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-(--color-text-muted)">
                        {new Date(inv.issued_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={TX_EXPLORER_URL(env.chainId, inv.issued_tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-(--color-text-muted) hover:text-(--color-magenta-700)"
                        >
                          {inv.issued_tx_hash.slice(0, 8)}…
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="mt-8 rounded-2xl border border-(--color-magenta-200) bg-(--color-magenta-50) p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
          How attribution works
        </p>
        <p className="mt-3 text-sm leading-relaxed text-(--color-text-secondary)">
          Each row above is here because the on-chain owner / issuer / payer
          address matches one of your verified wallets. Linking a wallet
          requires a personal_sign signature against a server-issued nonce, so
          you can&rsquo;t claim an address you don&rsquo;t hold the private key
          for. A wallet can only be linked to one statem8 account at a time
          (UNIQUE constraint on user_wallets.wallet_address), so two accounts
          can&rsquo;t both claim the same agent.
        </p>
      </div>
    </div>
  )
}

function Section({
  title,
  viewAllHref,
  empty,
  action,
  children,
}: {
  readonly title: string
  readonly viewAllHref?: string
  readonly empty: string
  readonly action?: React.ReactNode
  readonly children: React.ReactNode
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0)
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between border-b border-(--color-border) px-6 py-4">
        <h2 className="text-base font-semibold text-(--color-text-primary)">
          {title}
        </h2>
        <div className="flex items-center gap-4">
          {action}
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-sm font-medium text-(--color-magenta-700) hover:text-(--color-magenta-800)"
            >
              View all &rarr;
            </Link>
          )}
        </div>
      </div>
      {isEmpty ? (
        <p className="px-6 py-8 text-sm text-(--color-text-muted)">{empty}</p>
      ) : (
        children
      )}
    </section>
  )
}

function StatusPill({ status }: { readonly status: 'issued' | 'paid' | 'cancelled' }) {
  const cls =
    status === 'paid'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'cancelled'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-(--color-magenta-200) bg-(--color-magenta-50) text-(--color-magenta-700)'
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${cls}`}
    >
      {status}
    </span>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted) ${
        right ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function NoWalletsHint() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-(--color-magenta-300) bg-(--color-magenta-50) p-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
        Attribute your agents
      </p>
      <p className="mt-2 text-sm leading-relaxed text-(--color-text-secondary)">
        statem8 attributes an agent to your account once that agent presents a
        claim key you issued. Generate a key here, drop it into the
        agent&rsquo;s config (next to its on-chain private key), and ask the
        agent to call <code className="font-mono text-xs">/api/v1/claim/agent</code>{' '}
        once. The agent — and any company it founds on your behalf — will appear
        in this dashboard.
      </p>
      <Link
        href="/workspace/claim-keys"
        className="mt-5 inline-block rounded-full bg-(--color-magenta-700) px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800)"
      >
        Manage claim keys &rarr;
      </Link>
    </div>
  )
}
