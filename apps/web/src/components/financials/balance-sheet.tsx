'use client'

import { useQuery } from '@tanstack/react-query'

interface CashLine {
  address: string
  source: 'treasury' | 'member_agent'
  label: string | null
  agentId: string | null
  tokenSymbol: string
  balanceHuman: number
  usdPrice: number | null
  usdPriceSource: string | null
  balanceUsd: number | null
}

interface BalanceSheet {
  companyId: string
  asOf: string
  blockNumber: number | null
  assets: {
    cash: CashLine[]
    cashTotalUsd: number
    accountsReceivableUsd: number
    totalUsd: number
  }
  liabilities: { accountsPayableUsd: number; totalUsd: number }
  equity: {
    contributedCapital: { totalUsd: number }
    retainedEarningsUsd: number | null
    totalUsd: number | null
  }
  reconciliation: {
    assetsUsd: number
    liabilitiesPlusEquityUsd: number | null
    discrepancyUsd: number | null
    withinTolerance: boolean | null
    externalInflowsUsd?: number
    mismatchSource?:
      | 'none'
      | 'faucet_drips_unbooked'
      | 'off_chain_costs_or_price_gaps'
  }
}

function formatUsd(v: number | null): string {
  if (v === null) return '—'
  if (v === 0) return '$0'
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: abs >= 100 ? 0 : 2,
  })
  return v < 0 ? `(${formatted})` : formatted
}

export function CompanyBalanceSheet({ companyId }: { companyId: string }) {
  const { data, isPending: isLoading, error } = useQuery({
    queryKey: ['balance-sheet', companyId],
    queryFn: async (): Promise<BalanceSheet> => {
      const r = await fetch(
        `/api/v1/companies/${companyId}/financials/balance-sheet`,
      )
      if (!r.ok) {
        const j = (await r.json()) as { error?: string }
        throw new Error(j.error ?? `Request failed (${r.status})`)
      }
      return (await r.json()) as BalanceSheet
    },
  })

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-xl border border-(--color-border) bg-(--color-surface)" />
    )
  }
  if (error) {
    return (
      <div className="rounded-xl border border-(--color-accent-red)/40 bg-(--color-accent-red)/5 p-4 text-sm text-(--color-accent-red)">
        {error.message}
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent-amber)">
          Balance Sheet · USD · As Of {data.asOf}
        </h3>
        {data.blockNumber !== null && (
          <p className="mt-1 font-mono text-[10px] text-(--color-text-muted)">
            Block {data.blockNumber.toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Assets">
          <Line label="Cash (on-chain)" value={data.assets.cashTotalUsd} />
          {data.assets.cash.length > 0 && (
            <div className="mt-1 ml-4 space-y-0.5 pb-2">
              {data.assets.cash.map((c, i) => (
                <p
                  key={i}
                  className="font-mono text-[11px] text-(--color-text-muted)"
                >
                  {c.balanceHuman.toFixed(c.tokenSymbol === 'ETH' ? 6 : 2)}{' '}
                  {c.tokenSymbol} @{' '}
                  {c.address.slice(0, 6)}…{c.address.slice(-4)}
                  {c.balanceUsd !== null && (
                    <>
                      {' · '}
                      <span className="text-(--color-text-secondary)">
                        {formatUsd(c.balanceUsd)}
                      </span>
                    </>
                  )}
                  {c.usdPriceSource && (
                    <>
                      {' ('}
                      <span className="text-(--color-text-muted)">
                        price: {c.usdPriceSource}
                      </span>
                      {')'}
                    </>
                  )}
                </p>
              ))}
            </div>
          )}
          <Line
            label="Accounts Receivable"
            value={data.assets.accountsReceivableUsd}
            hint="Unpaid invoices issued via InvoiceRegistry"
          />
          <TotalLine label="Total Assets" value={data.assets.totalUsd} />
        </Panel>

        <Panel title="Liabilities &amp; Equity">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
            Liabilities
          </p>
          <Line
            label="Accounts Payable"
            value={data.liabilities.accountsPayableUsd}
            hint="Unpaid invoices received via InvoiceRegistry"
          />
          <Subtotal label="Total Liabilities" value={data.liabilities.totalUsd} />

          <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
            Equity
          </p>
          <Line
            label="Contributed Capital"
            value={data.equity.contributedCapital.totalUsd}
            hint="Funder → treasury/member-agent inflows"
          />
          <Line
            label="Retained Earnings"
            value={data.equity.retainedEarningsUsd}
            hint="Cumulative net income since inception"
          />
          <Subtotal label="Total Equity" value={data.equity.totalUsd} />

          <TotalLine
            label="Total Liabilities + Equity"
            value={data.reconciliation.liabilitiesPlusEquityUsd}
          />
        </Panel>
      </div>

      <ReconciliationBanner recon={data.reconciliation} />
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-(--color-accent-cyan)">
        {title}
      </p>
      <div className="mt-3 space-y-1">{children}</div>
    </div>
  )
}

function Line({
  label,
  value,
  hint,
}: {
  label: string
  value: number | null
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between py-1">
        <span className="text-sm text-(--color-text-secondary)">{label}</span>
        <span className="font-mono text-sm text-(--color-text-primary)">
          {formatUsd(value)}
        </span>
      </div>
      {hint && (
        <p className="text-[10px] text-(--color-text-muted) ml-0.5">{hint}</p>
      )}
    </div>
  )
}

function Subtotal({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between border-t border-(--color-border) py-1 mt-0.5">
      <span className="text-sm font-semibold text-(--color-text-primary)">
        {label}
      </span>
      <span className="font-mono text-sm font-bold text-(--color-text-primary)">
        {formatUsd(value)}
      </span>
    </div>
  )
}

function TotalLine({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="mt-2 flex items-center justify-between rounded-md border-t-2 border-(--color-accent-cyan)/40 bg-(--color-accent-cyan)/5 px-2 py-2">
      <span className="text-sm font-bold text-(--color-text-primary)">
        {label}
      </span>
      <span className="font-mono text-sm font-bold text-(--color-accent-cyan)">
        {formatUsd(value)}
      </span>
    </div>
  )
}

function ReconciliationBanner({
  recon,
}: {
  recon: BalanceSheet['reconciliation']
}) {
  if (recon.withinTolerance === null) {
    return (
      <div className="rounded-lg border border-(--color-accent-amber)/30 bg-(--color-accent-amber)/5 p-3">
        <p className="text-xs text-(--color-accent-amber)">
          Reconciliation skipped — retained earnings not computable until a tax
          rate is resolvable (see Tax Rates tab).
        </p>
      </div>
    )
  }
  if (recon.withinTolerance) {
    return (
      <div className="rounded-lg border border-(--color-accent-green)/30 bg-(--color-accent-green)/5 p-3">
        <p className="text-xs text-(--color-accent-green)">
          Balance sheet reconciled: assets ≈ liabilities + equity (diff{' '}
          {formatUsd(recon.discrepancyUsd ?? 0)}).
        </p>
      </div>
    )
  }
  if (recon.mismatchSource === 'faucet_drips_unbooked') {
    const inflow = recon.externalInflowsUsd ?? 0
    return (
      <div className="rounded-lg border border-(--color-accent-amber)/40 bg-(--color-accent-amber)/5 p-3">
        <p className="text-xs text-(--color-accent-amber)">
          Reconciliation mismatch: {formatUsd(recon.discrepancyUsd)}.{' '}
          {inflow > 0 ? (
            <>
              This company&rsquo;s member wallets received{' '}
              {formatUsd(inflow)} of ETH from the Statemate faucet, which
              hasn&rsquo;t been booked as contributed capital yet — so assets
              exceed equity by roughly that amount.
            </>
          ) : (
            <>
              This is Base Sepolia, contributed capital is $0, and the cash
              in member wallets had to come from somewhere — on testnet that
              &lsquo;somewhere&rsquo; is the Statemate faucet. Those drips
              haven&rsquo;t been booked as contributed capital yet, so assets
              exceed equity by the amount the faucet dripped in.
            </>
          )}{' '}
          Record these inflows as capital contributions to reconcile.
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-(--color-accent-red)/40 bg-(--color-accent-red)/5 p-3">
      <p className="text-xs text-(--color-accent-red)">
        Reconciliation mismatch: {formatUsd(recon.discrepancyUsd)}. Possible
        causes: unrecorded capital contributions, missing off-chain cost
        imports, or price-source gaps. Review source rows.
      </p>
    </div>
  )
}
