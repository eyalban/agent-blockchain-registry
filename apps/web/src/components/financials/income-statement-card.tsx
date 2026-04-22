'use client'

interface IncomeStatementData {
  revenue: number
  costOfSales: number
  grossProfit: number
  sgaExpenses: number
  operatingProfit: number
  transactionCount: number
}

interface IncomeStatementCardProps {
  readonly data: IncomeStatementData | null
  readonly isLoading: boolean
  readonly taxComputed?: boolean
  readonly taxComputedReason?: string
}

function formatEth(value: number): string {
  if (value === 0) return '\u2014'
  const abs = Math.abs(value)
  let formatted: string
  if (abs >= 0.01) formatted = abs.toFixed(4)
  else if (abs >= 0.0001) formatted = abs.toFixed(6)
  else if (abs >= 0.000001) formatted = abs.toFixed(8)
  else formatted = abs.toExponential(2)
  return value < 0 ? `(${formatted})` : formatted
}

function Row({
  label,
  value,
  bold,
  border,
  color,
}: {
  readonly label: string
  readonly value: number
  readonly bold?: boolean
  readonly border?: boolean
  readonly color?: string
}) {
  const valueColor =
    color ?? (value > 0 ? 'text-(--color-accent-green)' : value < 0 ? 'text-(--color-accent-red)' : 'text-(--color-text-muted)')

  return (
    <div
      className={`flex items-center justify-between py-2 ${border ? 'border-t border-(--color-border)' : ''}`}
    >
      <span
        className={`text-sm ${bold ? 'font-semibold text-(--color-text-primary)' : 'text-(--color-text-secondary)'}`}
      >
        {label}
      </span>
      <span className={`font-mono text-sm ${bold ? 'font-bold' : ''} ${valueColor}`}>
        {formatEth(value)} ETH
      </span>
    </div>
  )
}

export function IncomeStatementCard({
  data,
  isLoading,
  taxComputed = false,
  taxComputedReason,
}: IncomeStatementCardProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-32 rounded bg-(--color-border)" />
            <div className="h-4 w-24 rounded bg-(--color-border)" />
          </div>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) p-8 text-center">
        <p className="text-sm text-(--color-text-secondary)">
          No financial data. Sync transactions first.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-accent-amber)">
          Income Statement
        </h3>
        <span className="font-mono text-xs text-(--color-text-muted)">
          {data.transactionCount} transactions
        </span>
      </div>

      <div className="mt-4 space-y-0.5">
        <Row label="Revenue" value={data.revenue} bold />
        <Row label="Cost of Sales" value={-data.costOfSales} />
        <Row label="Gross Profit" value={data.grossProfit} bold border />
        <Row label="SGA Expenses" value={-data.sgaExpenses} />
        <div className="mt-1 border-t-2 border-(--color-accent-cyan)/30 pt-2">
          <Row
            label="Operating Profit"
            value={data.operatingProfit}
            bold
            color={
              data.operatingProfit > 0
                ? 'text-(--color-accent-green) text-glow-cyan'
                : data.operatingProfit < 0
                  ? 'text-(--color-accent-red)'
                  : 'text-(--color-text-muted)'
            }
          />
        </div>
      </div>

      {!taxComputed && (
        <div className="mt-5 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) p-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
            Tax &amp; Net Income
          </p>
          <p className="mt-1 text-xs text-(--color-text-secondary)">
            {taxComputedReason ??
              'Tax is resolved at the company level against a jurisdiction-specific rate sourced from OECD data. Link this agent to a company to see tax expense and net income.'}
          </p>
        </div>
      )}
    </div>
  )
}
