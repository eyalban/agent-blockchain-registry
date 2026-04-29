'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { ExportButtons, type CsvRow } from './export-buttons'

interface TaxRate {
  rate: number
  rateType: 'statutory' | 'effective' | 'override'
  source: string
  sourceRef: string
  effectiveFrom: string
  effectiveTo: string | null
}

interface IncomeStatementRow {
  period: string
  revenueUsd: number
  cogsUsd: number
  cogsOnChainUsd: number
  cogsOffChainUsd: number
  grossProfitUsd: number
  opexUsd: number
  operatingProfitUsd: number
  taxRateResolved: TaxRate | null
  incomeTaxUsd: number | null
  netIncomeUsd: number | null
  byLabel: Record<string, { usd: number; txCount: number }>
}

interface Statement {
  companyId: string
  jurisdictionCode: string | null
  granularity: string
  rows: IncomeStatementRow[]
  totals: {
    revenueUsd: number
    cogsUsd: number
    grossProfitUsd: number
    opexUsd: number
    operatingProfitUsd: number
    incomeTaxUsd: number | null
    netIncomeUsd: number | null
  }
}

function formatUsd(v: number): string {
  if (v === 0) return '—'
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: abs >= 100 ? 0 : 2,
  })
  return v < 0 ? `(${formatted})` : formatted
}

export function CompanyIncomeStatement({ companyId }: { companyId: string }) {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'ytd' | 'total'>(
    'monthly',
  )
  const { data, isPending: isLoading } = useQuery({
    queryKey: ['income-statement', companyId, period],
    queryFn: async (): Promise<Statement | null> => {
      const r = await fetch(
        `/api/v1/companies/${companyId}/financials/income-statement?period=${period}`,
      )
      return r.ok ? ((await r.json()) as Statement) : null
    },
  })

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-xl border border-(--color-border) bg-(--color-surface)" />
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) p-8 text-center">
        <p className="text-sm text-(--color-text-secondary)">
          No financial data yet. Sync transactions for member agents and import
          off-chain costs to populate this statement.
        </p>
      </div>
    )
  }

  const csvRows: CsvRow[] = [
    { label: 'Period grouping', value: period },
    { label: 'Intra-company transfers', value: 'eliminated' },
    { label: '', value: '' },
    { label: '— Totals (USD) —', value: '' },
    { label: 'Revenue', value: String(data.totals.revenueUsd) },
    { label: 'Cost of Goods Sold', value: String(-data.totals.cogsUsd) },
    { label: 'Gross Profit', value: String(data.totals.grossProfitUsd) },
    { label: 'Operating Expenses', value: String(-data.totals.opexUsd) },
    { label: 'Operating Profit', value: String(data.totals.operatingProfitUsd) },
    { label: 'Income Tax', value: String(data.totals.incomeTaxUsd) },
    { label: 'Net Income', value: String(data.totals.netIncomeUsd) },
    { label: '', value: '' },
    { label: '— Per-period rows —', value: '' },
    ...data.rows.flatMap((r) => [
      { label: `${r.period}: Revenue`, value: String(r.revenueUsd) },
      { label: `${r.period}: COGS`, value: String(-r.cogsUsd) },
      { label: `${r.period}: Gross Profit`, value: String(r.grossProfitUsd) },
      { label: `${r.period}: OpEx`, value: String(-r.opexUsd) },
      {
        label: `${r.period}: Operating Profit`,
        value: String(r.operatingProfitUsd),
      },
      { label: `${r.period}: Income Tax`, value: String(r.incomeTaxUsd) },
      { label: `${r.period}: Net Income`, value: String(r.netIncomeUsd) },
      { label: '', value: '' },
    ]),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent-amber)">
            Income Statement · USD
          </h3>
          <p className="mt-1 text-xs text-(--color-text-muted)">
            {data.rows.length} {data.rows.length === 1 ? 'period' : 'periods'} ·
            intra-company transfers eliminated
          </p>
        </div>
        <ExportButtons
          filename={`income-statement-${companyId}-${period}`}
          title={`Income Statement · Company #${companyId} · ${period}`}
          rows={csvRows}
        />
        <div className="flex gap-1 rounded-md border border-(--color-border) bg-(--color-bg-secondary) p-1">
          {(['monthly', 'quarterly', 'ytd', 'total'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs font-mono uppercase tracking-[0.05em] rounded ${
                period === p
                  ? 'bg-(--color-accent-cyan)/20 text-(--color-accent-cyan)'
                  : 'text-(--color-text-muted) hover:text-(--color-text-secondary)'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {data.rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) p-8 text-center">
          <p className="text-sm text-(--color-text-secondary)">
            No transactions or off-chain costs in this period yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-(--color-border)">
          <table className="w-full text-sm">
            <thead className="bg-(--color-bg-secondary)">
              <tr>
                <th className="px-3 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
                  Line
                </th>
                {data.rows.map((r) => (
                  <th
                    key={r.period}
                    className="px-3 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)"
                  >
                    {r.period}
                  </th>
                ))}
                {data.rows.length > 1 && (
                  <th className="px-3 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-accent-cyan)">
                    Total
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <Row
                label="Revenue"
                values={data.rows.map((r) => r.revenueUsd)}
                total={data.totals.revenueUsd}
                showTotal={data.rows.length > 1}
                bold
              />
              <Row
                label="Cost of Sales"
                values={data.rows.map((r) => -r.cogsUsd)}
                total={-data.totals.cogsUsd}
                showTotal={data.rows.length > 1}
              />
              <Row
                label="Gross Profit"
                values={data.rows.map((r) => r.grossProfitUsd)}
                total={data.totals.grossProfitUsd}
                showTotal={data.rows.length > 1}
                bold
                border
              />
              <Row
                label="Operating Expenses"
                values={data.rows.map((r) => -r.opexUsd)}
                total={-data.totals.opexUsd}
                showTotal={data.rows.length > 1}
              />
              <Row
                label="Operating Profit"
                values={data.rows.map((r) => r.operatingProfitUsd)}
                total={data.totals.operatingProfitUsd}
                showTotal={data.rows.length > 1}
                bold
                border
              />
              <TaxRow rows={data.rows} total={data.totals.incomeTaxUsd} />
              <NetIncomeRow rows={data.rows} total={data.totals.netIncomeUsd} />
            </tbody>
          </table>
        </div>
      )}

      {data.rows.some((r) => !r.taxRateResolved) && (
        <div className="rounded-lg border border-(--color-accent-amber)/30 bg-(--color-accent-amber)/5 p-4">
          <p className="text-sm font-semibold text-(--color-accent-amber)">
            Tax rate source required
          </p>
          <p className="mt-1 text-xs text-(--color-text-secondary)">
            One or more periods have no resolvable tax rate for{' '}
            <span className="font-mono">{data.jurisdictionCode ?? 'unknown jurisdiction'}</span>
            . Record a rate override (with a supporting tax filing or CFO
            attestation) on the Tax Rates tab to compute net income.
          </p>
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  values,
  total,
  showTotal,
  bold,
  border,
}: {
  label: string
  values: number[]
  total: number
  showTotal: boolean
  bold?: boolean
  border?: boolean
}) {
  return (
    <tr
      className={`${border ? 'border-t border-(--color-border)' : 'border-t border-(--color-border)/40'}`}
    >
      <td
        className={`px-3 py-2.5 text-xs ${bold ? 'font-semibold text-(--color-text-primary)' : 'text-(--color-text-secondary)'}`}
      >
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`px-3 py-2.5 text-right font-mono text-xs ${bold ? 'font-bold' : ''} ${
            v > 0
              ? 'text-(--color-accent-green)'
              : v < 0
                ? 'text-(--color-accent-red)'
                : 'text-(--color-text-muted)'
          }`}
        >
          {formatUsd(v)}
        </td>
      ))}
      {showTotal && (
        <td
          className={`px-3 py-2.5 text-right font-mono text-xs ${bold ? 'font-bold' : ''} ${
            total > 0
              ? 'text-(--color-accent-green)'
              : total < 0
                ? 'text-(--color-accent-red)'
                : 'text-(--color-text-muted)'
          }`}
        >
          {formatUsd(total)}
        </td>
      )}
    </tr>
  )
}

function TaxRow({
  rows,
  total,
}: {
  rows: IncomeStatementRow[]
  total: number | null
}) {
  return (
    <tr className="border-t border-(--color-border)/40">
      <td className="px-3 py-2.5 text-xs text-(--color-text-secondary)">
        <div>Income Tax</div>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {rows.map((r, i) =>
            r.taxRateResolved ? (
              <span
                key={i}
                title={`${r.taxRateResolved.source} · ref: ${r.taxRateResolved.sourceRef}`}
                className="rounded border border-(--color-border) bg-(--color-bg-secondary) px-1.5 py-0.5 font-mono text-[10px] text-(--color-text-muted)"
              >
                {r.period}: {(r.taxRateResolved.rate * 100).toFixed(2)}% ·{' '}
                {r.taxRateResolved.source}
              </span>
            ) : (
              <span
                key={i}
                className="rounded border border-(--color-accent-amber)/40 bg-(--color-accent-amber)/10 px-1.5 py-0.5 font-mono text-[10px] text-(--color-accent-amber)"
              >
                {r.period}: rate missing
              </span>
            ),
          )}
        </div>
      </td>
      {rows.map((r, i) => (
        <td
          key={i}
          className="px-3 py-2.5 text-right font-mono text-xs text-(--color-text-secondary)"
        >
          {r.incomeTaxUsd === null ? '—' : formatUsd(-r.incomeTaxUsd)}
        </td>
      ))}
      {rows.length > 1 && (
        <td className="px-3 py-2.5 text-right font-mono text-xs text-(--color-text-secondary)">
          {total === null ? '—' : formatUsd(-total)}
        </td>
      )}
    </tr>
  )
}

function NetIncomeRow({
  rows,
  total,
}: {
  rows: IncomeStatementRow[]
  total: number | null
}) {
  return (
    <tr className="border-t-2 border-(--color-accent-cyan)/30">
      <td className="px-3 py-3 text-xs font-bold text-(--color-text-primary)">
        Net Income
      </td>
      {rows.map((r, i) => (
        <td
          key={i}
          className={`px-3 py-3 text-right font-mono text-xs font-bold ${
            r.netIncomeUsd === null
              ? 'text-(--color-text-muted)'
              : r.netIncomeUsd > 0
                ? 'text-(--color-accent-green) text-glow-cyan'
                : r.netIncomeUsd < 0
                  ? 'text-(--color-accent-red)'
                  : 'text-(--color-text-muted)'
          }`}
        >
          {r.netIncomeUsd === null ? '—' : formatUsd(r.netIncomeUsd)}
        </td>
      ))}
      {rows.length > 1 && (
        <td
          className={`px-3 py-3 text-right font-mono text-xs font-bold ${
            total === null
              ? 'text-(--color-text-muted)'
              : total > 0
                ? 'text-(--color-accent-green)'
                : total < 0
                  ? 'text-(--color-accent-red)'
                  : 'text-(--color-text-muted)'
          }`}
        >
          {total === null ? '—' : formatUsd(total)}
        </td>
      )}
    </tr>
  )
}
