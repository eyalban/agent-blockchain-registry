'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { ADDRESS_EXPLORER_URL } from '@agent-registry/shared'

import { CompanyBalanceSheet } from '@/components/financials/balance-sheet'
import { CompanyIncomeStatement } from '@/components/financials/company-income-statement'
import { useAddAgentToCompany } from '@/hooks/use-add-agent-to-company'
import { useAddTreasury } from '@/hooks/use-add-treasury'
import { useCompany } from '@/hooks/use-company'
import { useSession } from '@/hooks/use-session'
import { env } from '@/lib/env'
import { truncateAddress } from '@/lib/utils'

type Tab =
  | 'overview'
  | 'agents'
  | 'treasuries'
  | 'invoices'
  | 'financials'
  | 'balance_sheet'
  | 'taxes'

interface TabDef {
  id: Tab
  label: string
  ownerOnly?: boolean
}

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'agents', label: 'Agents' },
  { id: 'treasuries', label: 'Treasuries' },
  { id: 'invoices', label: 'Invoices', ownerOnly: true },
  { id: 'financials', label: 'Income Statement' },
  { id: 'balance_sheet', label: 'Balance Sheet' },
  { id: 'taxes', label: 'Tax Rates' },
]

interface Props {
  readonly companyId: string
}

export function CompanyDetailView({ companyId }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const { data, isLoading, reload } = useCompany(companyId)
  const { address } = useAccount()
  const { user } = useSession()
  const [showDelete, setShowDelete] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-magenta-500) border-t-transparent" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-(--color-border-bright) bg-white p-10 text-center">
        <p className="text-sm text-(--color-text-secondary)">
          Company not found.{' '}
          <Link href="/companies" className="font-medium text-(--color-magenta-700) hover:underline">
            Back to directory
          </Link>
        </p>
      </div>
    )
  }

  // Owner check: the connected browser wallet matches, OR the email-
  // account user has a verified wallet that matches. Either path is
  // proof of ownership and grants destructive operations like delete.
  const ownerLower = data.ownerAddress.toLowerCase()
  const browserOwns = address?.toLowerCase() === ownerLower
  const sessionOwns = user?.wallets.some((w) => w.toLowerCase() === ownerLower) ?? false
  const isOwner = browserOwns || sessionOwns

  return (
    <div>
      <Link
        href="/companies"
        className="inline-flex items-center gap-1 text-sm text-(--color-text-secondary) transition-colors hover:text-(--color-magenta-700)"
      >
        ← Back to Companies
      </Link>

      <div className="mt-5 rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-(--color-magenta-500) to-(--color-magenta-700) text-2xl font-semibold text-white shadow-[0_8px_20px_-8px_rgba(219,39,119,0.40)]">
            {(data.name ?? 'CO').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-(--color-text-primary)">
              {data.name ?? `Company #${data.companyId}`}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-(--color-text-secondary)">
              <span className="font-mono text-(--color-text-muted)">
                Company #{data.companyId}
              </span>
              <span className="text-(--color-border-bright)">·</span>
              <a
                href={ADDRESS_EXPLORER_URL(env.chainId, data.ownerAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono transition-colors hover:text-(--color-magenta-700)"
              >
                Owner: {truncateAddress(data.ownerAddress)}
              </a>
              {data.jurisdictionCode && (
                <span className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2 py-0.5 font-mono text-xs font-medium text-(--color-magenta-700)">
                  {data.jurisdictionCode}
                </span>
              )}
            </div>
            {data.description && (
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-secondary)">
                {data.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 divide-(--color-border) overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:grid-cols-4 sm:divide-x">
        <CKpiCell label="Member agents" value={data.members.length.toString()} />
        <CKpiCell label="Treasuries" value={data.treasuries.length.toString()} />
        <CKpiCell
          label="Jurisdiction"
          value={data.jurisdictionCode ?? '—'}
          mono
        />
        <CKpiCell
          label="Created"
          value={data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '—'}
          sub={`Block ${Number(data.createdBlock).toLocaleString()}`}
        />
      </div>

      <div className="mt-8 border-b border-(--color-border)">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.filter((t) => !t.ownerOnly || isOwner).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`-mb-px whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-b-2 border-(--color-magenta-700) text-(--color-magenta-700)'
                  : 'border-b-2 border-transparent text-(--color-text-secondary) hover:text-(--color-text-primary)'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="py-6">
        {tab === 'overview' && <OverviewTab data={data} />}
        {tab === 'agents' && (
          <AgentsTab data={data} isOwner={!!isOwner} onChange={reload} />
        )}
        {tab === 'treasuries' && (
          <TreasuriesTab data={data} isOwner={!!isOwner} onChange={reload} />
        )}
        {tab === 'invoices' && isOwner && <InvoicesTab companyId={data.companyId} />}
        {tab === 'financials' && <CompanyIncomeStatement companyId={data.companyId} />}
        {tab === 'balance_sheet' && <CompanyBalanceSheet companyId={data.companyId} />}
        {tab === 'taxes' && <TaxRatesTab companyId={data.companyId} />}
      </div>

      {isOwner && (
        <DangerZone
          companyId={data.companyId}
          companyName={data.name ?? `Company #${data.companyId}`}
          open={showDelete}
          onOpen={() => setShowDelete(true)}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}

interface InvoiceRow {
  invoiceId: string
  direction: 'incoming' | 'outgoing'
  issuerAddress: string
  payerAddress: string
  tokenSymbol: string
  amountRaw: string
  amountUsdAtIssue: number | null
  status: 'issued' | 'paid' | 'cancelled'
  issuedAt: string
  issuedTxHash: string
}

function InvoicesTab({ companyId }: { readonly companyId: string }) {
  const [rows, setRows] = useState<InvoiceRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/v1/companies/${companyId}/invoices`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) {
          const data = (await r.json().catch(() => ({}))) as { error?: string }
          throw new Error(data.error ?? `Request failed (${r.status})`)
        }
        return r.json() as Promise<{ data: InvoiceRow[] }>
      })
      .then((j) => {
        if (!cancelled) setRows(j.data)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load invoices')
        }
      })
    return () => {
      cancelled = true
    }
  }, [companyId])

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }
  if (rows === null) {
    return (
      <div className="h-32 animate-pulse rounded-2xl border border-(--color-border) bg-white" />
    )
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-(--color-border-bright) bg-white p-12 text-center">
        <p className="text-sm text-(--color-text-secondary)">
          No invoices issued by or payable to this company yet.
        </p>
        <Link
          href="/invoices/new"
          className="mt-4 inline-block rounded-full bg-(--color-magenta-700) px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-magenta-800)"
        >
          + New invoice
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-(--color-text-muted)">
          {rows.length} invoice{rows.length === 1 ? '' : 's'}
        </p>
        <Link
          href="/invoices/new"
          className="text-sm font-medium text-(--color-magenta-700) hover:text-(--color-magenta-800)"
        >
          + New invoice
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => {
              const counterparty =
                inv.direction === 'outgoing' ? inv.payerAddress : inv.issuerAddress
              const human =
                Number(inv.amountRaw) /
                10 ** (inv.tokenSymbol === 'USDC' ? 6 : 18)
              return (
                <tr
                  key={inv.invoiceId}
                  className="border-b border-(--color-border) last:border-b-0 transition-colors hover:bg-(--color-magenta-50)"
                >
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/invoices/${inv.invoiceId}`}
                      className="font-mono text-sm font-medium text-(--color-magenta-700) hover:underline"
                    >
                      #{inv.invoiceId}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
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
                  <td className="px-4 py-3.5 font-mono text-xs text-(--color-text-secondary)">
                    {truncateAddress(counterparty as `0x${string}`)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm tabular-nums text-(--color-text-primary)">
                    {human.toFixed(inv.tokenSymbol === 'USDC' ? 2 : 6)}{' '}
                    <span className="text-(--color-text-muted)">{inv.tokenSymbol}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs text-(--color-text-secondary)">
                    {inv.amountUsdAtIssue !== null
                      ? inv.amountUsdAtIssue.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 2,
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                        inv.status === 'paid'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : inv.status === 'cancelled'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-(--color-magenta-200) bg-(--color-magenta-50) text-(--color-magenta-700)'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-(--color-text-muted)">
                    {new Date(inv.issuedAt).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DangerZone({
  companyId,
  companyName,
  open,
  onOpen,
  onClose,
}: {
  readonly companyId: string
  readonly companyName: string
  readonly open: boolean
  readonly onOpen: () => void
  readonly onClose: () => void
}) {
  const router = useRouter()
  const [confirmName, setConfirmName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const matches =
    confirmName.trim().toLowerCase() === companyName.trim().toLowerCase()

  async function deleteCompany(): Promise<void> {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/companies/${companyId}/delete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmName: confirmName.trim() }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Delete failed (${res.status})`)
      }
      router.push('/workspace')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="mt-10 rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
          Danger zone
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h3 className="text-sm font-semibold text-(--color-text-primary)">
              Delete this company
            </h3>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Removes the company and its members + treasuries from the
              statem8 mirror. The on-chain CompanyRegistry record cannot be
              undone — agents that were members stay on chain and remain in
              the agent registry. Invoices keep their on-chain integrity.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            Delete company
          </button>
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-company-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) onClose()
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)]">
            <h2
              id="delete-company-title"
              className="text-lg font-semibold tracking-tight text-(--color-text-primary)"
            >
              Delete &ldquo;{companyName}&rdquo;?
            </h2>
            <p className="mt-2 text-sm text-(--color-text-secondary)">
              Type the company&rsquo;s name below to confirm. This removes it
              from the platform completely. Member agents are not deleted.
            </p>

            <label className="mt-5 block text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">
              Company name
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={companyName}
              autoFocus
              disabled={submitting}
              className="mt-1.5 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-300/30 disabled:opacity-50"
            />

            {error && (
              <p className="mt-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full px-4 py-2 text-sm font-medium text-(--color-text-secondary) transition-colors hover:text-(--color-text-primary) disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteCompany}
                disabled={!matches || submitting}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.45)] transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 disabled:shadow-none"
              >
                {submitting ? 'Deleting…' : 'Delete company'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function OverviewTab({ data }: { data: NonNullable<ReturnType<typeof useCompany>['data']> }) {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <Stat label="Agents" value={String(data.members.length)} />
      <Stat label="Treasuries" value={String(data.treasuries.length)} />
      <Stat label="Jurisdiction" value={data.jurisdictionCode ?? '—'} mono />
      <div className="sm:col-span-3 rounded-2xl border border-(--color-border) bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
          Metadata URI
        </p>
        <p className="mt-1 break-all font-mono text-xs text-(--color-text-secondary)">
          {data.metadataURI}
        </p>
      </div>
    </div>
  )
}

function AgentsTab({
  data,
  isOwner,
  onChange,
}: {
  data: NonNullable<ReturnType<typeof useCompany>['data']>
  isOwner: boolean
  onChange: () => void
}) {
  const [agentIdInput, setAgentIdInput] = useState('')
  const {
    addAgent,
    removeAgent,
    isPending,
    isConfirming,
    isSuccess,
    error,
    mirrorError,
  } = useAddAgentToCompany()

  if (isSuccess) {
    setTimeout(onChange, 500)
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-magenta-700)">
            Add Agent
          </p>
          <p className="mt-1 text-xs text-(--color-text-secondary)">
            You must own the agent in the canonical ERC-8004 registry.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-lg border border-(--color-border) bg-white px-3 py-2 font-mono text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
              placeholder="Agent ID (e.g. 4898)"
              value={agentIdInput}
              onChange={(e) => setAgentIdInput(e.target.value.replace(/\D/g, ''))}
            />
            <button
              type="button"
              disabled={!agentIdInput || isPending || isConfirming}
              onClick={() => addAgent(data.companyId, agentIdInput)}
              className="rounded-md border border-(--color-magenta-200) bg-(--color-magenta-50) px-4 py-2 text-sm font-medium text-(--color-magenta-700) hover:bg-(--color-magenta-100) disabled:opacity-40"
            >
              {isPending ? 'Sign…' : isConfirming ? 'Confirming…' : 'Add'}
            </button>
          </div>
          {(error || mirrorError) && (
            <p className="mt-2 text-xs text-(--color-accent-red)">
              {error?.message ?? mirrorError}
            </p>
          )}
        </div>
      )}

      {data.members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-(--color-border-bright) bg-white p-10 text-center">
          <p className="text-sm text-(--color-text-secondary)">No agents yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <table className="w-full">
            <thead className="border-b border-(--color-border) bg-(--color-bg-secondary)">
              <tr>
                <Th>Agent</Th>
                <Th>Added</Th>
                <Th>Tx</Th>
                {isOwner && <Th right>Action</Th>}
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr
                  key={m.agentId}
                  className="border-t border-(--color-border)/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/agents/${m.agentId}`}
                      className="text-sm font-medium text-(--color-magenta-700) hover:underline"
                    >
                      {m.name ? (
                        <>
                          <span>{m.name}</span>
                          <span className="ml-2 font-mono text-xs text-(--color-text-muted)">
                            #{m.agentId}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono">#{m.agentId}</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-(--color-text-muted)">
                    {new Date(m.addedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://sepolia.basescan.org/tx/${m.addedTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-(--color-text-muted) hover:text-(--color-magenta-700)"
                    >
                      {m.addedTxHash.slice(0, 10)}…
                    </a>
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeAgent(data.companyId, m.agentId)}
                        disabled={isPending || isConfirming}
                        className="text-xs text-(--color-accent-red) hover:underline disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TreasuriesTab({
  data,
  isOwner,
  onChange,
}: {
  data: NonNullable<ReturnType<typeof useCompany>['data']>
  isOwner: boolean
  onChange: () => void
}) {
  const [addressInput, setAddressInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const {
    addTreasury,
    removeTreasury,
    isPending,
    isConfirming,
    isSuccess,
    error,
    mirrorError,
  } = useAddTreasury()

  if (isSuccess) setTimeout(onChange, 500)

  const canSubmit = /^0x[a-fA-F0-9]{40}$/.test(addressInput.trim())

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-magenta-700)">
            Add Treasury
          </p>
          <p className="mt-1 text-xs text-(--color-text-secondary)">
            Any address whose balances + txs should consolidate into this
            company&apos;s financial statements.
          </p>
          <div className="mt-3 space-y-2">
            <input
              className="w-full rounded-lg border border-(--color-border) bg-white px-3 py-2 font-mono text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
              placeholder="0x…"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value.trim())}
            />
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-(--color-border) bg-white px-3 py-2 text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
                placeholder="Label (optional) — e.g. 'ops', 'payroll'"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                maxLength={64}
              />
              <button
                type="button"
                disabled={!canSubmit || isPending || isConfirming}
                onClick={() =>
                  addTreasury(
                    data.companyId,
                    addressInput.trim() as `0x${string}`,
                    labelInput.trim() || undefined,
                  )
                }
                className="rounded-md border border-(--color-magenta-200) bg-(--color-magenta-50) px-4 py-2 text-sm font-medium text-(--color-magenta-700) hover:bg-(--color-magenta-100) disabled:opacity-40"
              >
                {isPending ? 'Sign…' : isConfirming ? 'Confirming…' : 'Add'}
              </button>
            </div>
          </div>
          {(error || mirrorError) && (
            <p className="mt-2 text-xs text-(--color-accent-red)">
              {error?.message ?? mirrorError}
            </p>
          )}
        </div>
      )}

      {data.treasuries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-(--color-border-bright) bg-white p-10 text-center">
          <p className="text-sm text-(--color-text-secondary)">
            No treasuries yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <table className="w-full">
            <thead className="border-b border-(--color-border) bg-(--color-bg-secondary)">
              <tr>
                <Th>Address</Th>
                <Th>Label</Th>
                <Th>Added</Th>
                {isOwner && <Th right>Action</Th>}
              </tr>
            </thead>
            <tbody>
              {data.treasuries.map((t) => (
                <tr
                  key={t.address}
                  className="border-t border-(--color-border)/40"
                >
                  <td className="px-4 py-3">
                    <a
                      href={ADDRESS_EXPLORER_URL(env.chainId, t.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-(--color-magenta-700) hover:underline"
                    >
                      {truncateAddress(t.address)}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-(--color-text-secondary)">
                    {t.label ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-(--color-text-muted)">
                    {new Date(t.addedAt).toLocaleDateString()}
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          removeTreasury(
                            data.companyId,
                            t.address as `0x${string}`,
                          )
                        }
                        disabled={isPending || isConfirming}
                        className="text-xs text-(--color-accent-red) hover:underline disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface TaxRateRow {
  rate: number
  rateType: 'statutory' | 'effective' | 'override'
  source: string
  sourceRef: string
  effectiveFrom: string
  effectiveTo: string | null
  companyScoped: boolean
  jurisdictionCode: string
}

interface TaxInfo {
  resolved: TaxRateRow | null
  history: TaxRateRow[]
  jurisdictionCode: string
}

function TaxRatesTab({ companyId }: { companyId: string }) {
  const [info, setInfo] = useState<TaxInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/v1/companies/${companyId}/tax-rates`)
      .then((r) => r.json())
      .then((j: Record<string, unknown>) => {
        if (typeof j.error === 'string') setError(j.error)
        else setInfo(j as unknown as TaxInfo)
      })
      .catch((e) => setError(String(e)))
  }, [companyId])

  if (error) {
    return (
      <div className="rounded-2xl border border-(--color-magenta-200) bg-(--color-magenta-50) p-4 text-sm text-(--color-magenta-700)">
        {error}
      </div>
    )
  }

  if (!info) {
    return (
      <div className="h-24 animate-pulse rounded-2xl border border-(--color-border) bg-white" />
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
          Applicable rate today
        </p>
        {info.resolved ? (
          <div className="mt-2 space-y-1">
            <p className="text-3xl font-semibold tracking-tight text-(--color-text-primary)">
              {(info.resolved.rate * 100).toFixed(3)}%
            </p>
            <p className="text-xs text-(--color-text-secondary)">
              <span className="font-mono">{info.resolved.rateType}</span> ·{' '}
              <span className="font-mono">{info.resolved.source}</span> ·
              effective from {info.resolved.effectiveFrom}
            </p>
            <p className="break-all font-mono text-[10px] text-(--color-text-muted)">
              source: {info.resolved.sourceRef}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-(--color-magenta-700)">
            Tax rate source required — no OECD entry for {info.jurisdictionCode}{' '}
            and no company override exists. Net income cannot be computed until
            an override with a supporting tax filing is provided.
          </p>
        )}
      </div>

      {info.history.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <table className="w-full">
            <thead className="border-b border-(--color-border) bg-(--color-bg-secondary)">
              <tr>
                <Th>Rate</Th>
                <Th>Type</Th>
                <Th>Source</Th>
                <Th>From</Th>
                <Th>To</Th>
              </tr>
            </thead>
            <tbody>
              {info.history.map((h, i) => (
                <tr key={i} className="border-t border-(--color-border)/40">
                  <td className="px-4 py-3 font-mono text-sm">
                    {(h.rate * 100).toFixed(3)}%
                  </td>
                  <td className="px-4 py-3 text-xs text-(--color-text-secondary)">
                    {h.rateType}
                  </td>
                  <td className="px-4 py-3 text-xs text-(--color-text-muted)">
                    {h.source}
                  </td>
                  <td className="px-4 py-3 text-xs text-(--color-text-muted)">
                    {h.effectiveFrom}
                  </td>
                  <td className="px-4 py-3 text-xs text-(--color-text-muted)">
                    {h.effectiveTo ?? 'current'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-bold text-(--color-text-primary) ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

function CKpiCell({
  label,
  value,
  sub,
  mono,
}: {
  readonly label: string
  readonly value: string
  readonly sub?: string
  readonly mono?: boolean
}) {
  return (
    <div className="px-6 py-5">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums text-(--color-text-primary) ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 font-mono text-xs text-(--color-text-muted)">{sub}</p>}
    </div>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted) ${right ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  )
}
