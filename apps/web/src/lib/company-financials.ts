/**
 * Company-level financial statements.
 *
 * All USD values come from `transactions.value_usd` (snapshotted at block time
 * by the price oracle) and `off_chain_costs.amount_usd` (direct USD input at
 * import). Tax rates come from `resolveTaxRate()` backed by the OECD seed.
 * No hardcoded numbers.
 */

import { getCompany, sql } from './db'
import { type ResolvedTaxRate, resolveTaxRate } from './tax-rates'

const COGS_LABELS = new Set([
  'cost_of_sales',
  'registration_fee',
  'feedback_fee',
  'cogs_protocol_fee',
  'cogs_compute',
  'cogs_llm_api',
  'cogs_data',
  'cogs_other',
])

const OPEX_LABELS = new Set([
  'sga_expense',
  'opex_infra',
  'opex_tooling',
  'opex_salaries',
  'opex_other',
])

export type PeriodGranularity = 'monthly' | 'quarterly' | 'ytd' | 'total'

export interface IncomeStatementRow {
  /** Period label: 'YYYY-MM', 'YYYY-Q#', 'YYYY', or 'all'. */
  period: string
  periodStart: string
  periodEnd: string
  revenueUsd: number
  cogsUsd: number
  cogsOnChainUsd: number
  cogsOffChainUsd: number
  grossProfitUsd: number
  opexUsd: number
  opexOnChainUsd: number
  opexOffChainUsd: number
  operatingProfitUsd: number
  /** `null` when no tax rate is resolvable — caller must surface the banner. */
  taxRateResolved: ResolvedTaxRate | null
  /** Null when taxRateResolved is null. */
  incomeTaxUsd: number | null
  netIncomeUsd: number | null
  byLabel: Record<string, { usd: number; txCount: number }>
  byCounterparty: Array<{ counterparty: string; usd: number; txCount: number }>
  byMemberAgent: Array<{ agentId: string; revenueUsd: number; expenseUsd: number }>
}

export interface CompanyIncomeStatement {
  companyId: string
  jurisdictionCode: string | null
  granularity: PeriodGranularity
  from: string | null
  to: string | null
  rows: IncomeStatementRow[]
  totals: Omit<
    IncomeStatementRow,
    'period' | 'periodStart' | 'periodEnd' | 'taxRateResolved' | 'byLabel' | 'byCounterparty' | 'byMemberAgent'
  >
}

interface TxAggRow {
  period: string
  period_start: string
  period_end: string
  label: string
  counterparty: string | null
  agent_id: string
  value_usd: string | null
  tx_count: string
}

interface OffChainAggRow {
  period: string
  period_start: string
  period_end: string
  category: string
  amount_usd: string
  entry_count: string
}

function periodExpression(granularity: PeriodGranularity): string {
  // PG date_trunc outputs timestamp; format as ISO string in SELECT.
  if (granularity === 'monthly') return `date_trunc('month', block_timestamp)`
  if (granularity === 'quarterly') return `date_trunc('quarter', block_timestamp)`
  if (granularity === 'ytd') return `date_trunc('year', block_timestamp)`
  return `date_trunc('century', block_timestamp)` // total: collapse all into one bucket
}

function periodExpressionDate(
  granularity: PeriodGranularity,
  col: string,
): string {
  if (granularity === 'monthly') return `date_trunc('month', ${col})`
  if (granularity === 'quarterly') return `date_trunc('quarter', ${col})`
  if (granularity === 'ytd') return `date_trunc('year', ${col})`
  return `date_trunc('century', ${col})`
}

function formatPeriodLabel(
  granularity: PeriodGranularity,
  periodStartIso: string,
): string {
  const d = new Date(periodStartIso)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  if (granularity === 'monthly') return `${y}-${String(m + 1).padStart(2, '0')}`
  if (granularity === 'quarterly') return `${y}-Q${Math.floor(m / 3) + 1}`
  if (granularity === 'ytd') return `${y}`
  return 'all'
}

export async function computeCompanyIncomeStatement(params: {
  companyId: string
  granularity?: PeriodGranularity
  from?: string
  to?: string
}): Promise<CompanyIncomeStatement> {
  const { companyId } = params
  const granularity: PeriodGranularity = params.granularity ?? 'monthly'

  const company = await getCompany(companyId)
  const jurisdictionCode = company?.jurisdiction_code ?? null

  const fromClause = params.from ? params.from : '1970-01-01'
  const toClause = params.to ? params.to : '9999-12-31'

  // ─── Transactions aggregated by period + label + counterparty + agent ─────
  // We use raw SQL string interpolation for the period expression because neon
  // tagged templates treat interpolations as parameters (not SQL). The
  // granularity input is restricted to a closed enum above, so no injection.
  const txPeriod = periodExpressionDate(granularity, 'block_timestamp')
  const txQuery = `
    SELECT
      ${txPeriod}::text        AS period,
      ${txPeriod}::text        AS period_start,
      (${txPeriod} + INTERVAL '1 ${
        granularity === 'monthly'
          ? 'month'
          : granularity === 'quarterly'
            ? 'quarter'
            : granularity === 'ytd'
              ? 'year'
              : '100 year'
      }')::text AS period_end,
      label,
      counterparty,
      agent_id,
      SUM(value_usd)::text     AS value_usd,
      COUNT(*)::text           AS tx_count
    FROM transactions
    WHERE company_id = $1
      AND is_internal = FALSE
      AND block_timestamp >= $2::date
      AND block_timestamp < ($3::date + INTERVAL '1 day')
    GROUP BY ${txPeriod}, label, counterparty, agent_id
  `
  const txRows = (await sql.query(txQuery, [
    companyId,
    fromClause,
    toClause,
  ])) as TxAggRow[]

  // ─── Off-chain costs aggregated by period + category ───────────────────────
  const ocPeriod = periodExpressionDate(granularity, 'occurred_at')
  const ocQuery = `
    SELECT
      ${ocPeriod}::text        AS period,
      ${ocPeriod}::text        AS period_start,
      (${ocPeriod} + INTERVAL '1 ${
        granularity === 'monthly'
          ? 'month'
          : granularity === 'quarterly'
            ? 'quarter'
            : granularity === 'ytd'
              ? 'year'
              : '100 year'
      }')::text AS period_end,
      category,
      SUM(amount_usd)::text    AS amount_usd,
      COUNT(*)::text           AS entry_count
    FROM off_chain_costs
    WHERE company_id = $1
      AND occurred_at >= $2::date
      AND occurred_at <= $3::date
    GROUP BY ${ocPeriod}, category
  `
  const ocRows = (await sql.query(ocQuery, [
    companyId,
    fromClause,
    toClause,
  ])) as OffChainAggRow[]

  // ─── Bucket rows by period ────────────────────────────────────────────────
  const periodBuckets = new Map<
    string,
    {
      periodStart: string
      periodEnd: string
      tx: TxAggRow[]
      oc: OffChainAggRow[]
    }
  >()

  for (const row of txRows) {
    const key = row.period
    let b = periodBuckets.get(key)
    if (!b) {
      b = { periodStart: row.period_start, periodEnd: row.period_end, tx: [], oc: [] }
      periodBuckets.set(key, b)
    }
    b.tx.push(row)
  }
  for (const row of ocRows) {
    const key = row.period
    let b = periodBuckets.get(key)
    if (!b) {
      b = { periodStart: row.period_start, periodEnd: row.period_end, tx: [], oc: [] }
      periodBuckets.set(key, b)
    }
    b.oc.push(row)
  }

  const sortedPeriods = Array.from(periodBuckets.keys()).sort()

  const rows: IncomeStatementRow[] = []
  for (const key of sortedPeriods) {
    const bucket = periodBuckets.get(key)!
    const row = await buildRow({
      granularity,
      companyId,
      jurisdictionCode,
      periodStart: bucket.periodStart,
      periodEnd: bucket.periodEnd,
      txRows: bucket.tx,
      ocRows: bucket.oc,
    })
    rows.push(row)
  }

  // Totals aggregate across all rows (pre-tax fields sum; tax is recomputed
  // from the totals row using the rate applicable at `to` or today).
  const totals = {
    revenueUsd: sum(rows.map((r) => r.revenueUsd)),
    cogsUsd: sum(rows.map((r) => r.cogsUsd)),
    cogsOnChainUsd: sum(rows.map((r) => r.cogsOnChainUsd)),
    cogsOffChainUsd: sum(rows.map((r) => r.cogsOffChainUsd)),
    grossProfitUsd: sum(rows.map((r) => r.grossProfitUsd)),
    opexUsd: sum(rows.map((r) => r.opexUsd)),
    opexOnChainUsd: sum(rows.map((r) => r.opexOnChainUsd)),
    opexOffChainUsd: sum(rows.map((r) => r.opexOffChainUsd)),
    operatingProfitUsd: sum(rows.map((r) => r.operatingProfitUsd)),
    incomeTaxUsd: allDefined(rows.map((r) => r.incomeTaxUsd))
      ? sum(rows.map((r) => r.incomeTaxUsd ?? 0))
      : null,
    netIncomeUsd: allDefined(rows.map((r) => r.netIncomeUsd))
      ? sum(rows.map((r) => r.netIncomeUsd ?? 0))
      : null,
  }

  return {
    companyId,
    jurisdictionCode,
    granularity,
    from: params.from ?? null,
    to: params.to ?? null,
    rows,
    totals,
  }
}

async function buildRow(args: {
  granularity: PeriodGranularity
  companyId: string
  jurisdictionCode: string | null
  periodStart: string
  periodEnd: string
  txRows: TxAggRow[]
  ocRows: OffChainAggRow[]
}): Promise<IncomeStatementRow> {
  const {
    granularity,
    companyId,
    jurisdictionCode,
    periodStart,
    periodEnd,
    txRows,
    ocRows,
  } = args

  const byLabel: Record<string, { usd: number; txCount: number }> = {}
  const byCounterpartyMap = new Map<string, { usd: number; txCount: number }>()
  const byAgentMap = new Map<string, { revenueUsd: number; expenseUsd: number }>()

  let revenueUsd = 0
  let cogsOnChainUsd = 0
  let opexOnChainUsd = 0

  for (const r of txRows) {
    const usd = Number(r.value_usd ?? 0)
    const count = Number(r.tx_count)
    const labelKey = r.label

    byLabel[labelKey] = byLabel[labelKey] ?? { usd: 0, txCount: 0 }
    byLabel[labelKey].usd += usd
    byLabel[labelKey].txCount += count

    const isRevenue = r.label === 'revenue' || r.label.startsWith('revenue_')
    const isCogs = COGS_LABELS.has(r.label)
    const isOpex = OPEX_LABELS.has(r.label)

    if (isRevenue) revenueUsd += usd
    else if (isCogs) cogsOnChainUsd += usd
    else if (isOpex) opexOnChainUsd += usd

    if (r.counterparty) {
      const cp = byCounterpartyMap.get(r.counterparty) ?? { usd: 0, txCount: 0 }
      cp.usd += usd
      cp.txCount += count
      byCounterpartyMap.set(r.counterparty, cp)
    }

    const agent = byAgentMap.get(r.agent_id) ?? { revenueUsd: 0, expenseUsd: 0 }
    if (isRevenue) agent.revenueUsd += usd
    else if (isCogs || isOpex) agent.expenseUsd += usd
    byAgentMap.set(r.agent_id, agent)
  }

  let cogsOffChainUsd = 0
  let opexOffChainUsd = 0
  for (const r of ocRows) {
    const usd = Number(r.amount_usd)
    const labelKey = r.category

    byLabel[labelKey] = byLabel[labelKey] ?? { usd: 0, txCount: 0 }
    byLabel[labelKey].usd += usd
    byLabel[labelKey].txCount += Number(r.entry_count)

    if (COGS_LABELS.has(r.category)) cogsOffChainUsd += usd
    else if (OPEX_LABELS.has(r.category)) opexOffChainUsd += usd
    else opexOffChainUsd += usd // unknown categories default to OpEx
  }

  const cogsUsd = cogsOnChainUsd + cogsOffChainUsd
  const opexUsd = opexOnChainUsd + opexOffChainUsd
  const grossProfitUsd = revenueUsd - cogsUsd
  const operatingProfitUsd = grossProfitUsd - opexUsd

  // Tax: resolve at the midpoint of the period (good enough for monthly/
  // quarterly). For 'total' buckets, use today.
  const taxAsOf =
    granularity === 'total'
      ? new Date()
      : new Date(
          (new Date(periodStart).getTime() + new Date(periodEnd).getTime()) / 2,
        )

  const taxRateResolved = jurisdictionCode
    ? await resolveTaxRate({ companyId, jurisdictionCode, asOf: taxAsOf })
    : null

  const incomeTaxUsd =
    taxRateResolved && operatingProfitUsd > 0
      ? operatingProfitUsd * taxRateResolved.rate
      : taxRateResolved
        ? 0
        : null
  const netIncomeUsd =
    taxRateResolved !== null && incomeTaxUsd !== null
      ? operatingProfitUsd - incomeTaxUsd
      : null

  const byCounterparty = Array.from(byCounterpartyMap.entries())
    .map(([counterparty, v]) => ({ counterparty, ...v }))
    .sort((a, b) => Math.abs(b.usd) - Math.abs(a.usd))
    .slice(0, 20)

  const byMemberAgent = Array.from(byAgentMap.entries())
    .map(([agentId, v]) => ({ agentId, ...v }))
    .sort((a, b) => b.revenueUsd + b.expenseUsd - (a.revenueUsd + a.expenseUsd))

  return {
    period: formatPeriodLabel(granularity, periodStart),
    periodStart,
    periodEnd,
    revenueUsd,
    cogsUsd,
    cogsOnChainUsd,
    cogsOffChainUsd,
    grossProfitUsd,
    opexUsd,
    opexOnChainUsd,
    opexOffChainUsd,
    operatingProfitUsd,
    taxRateResolved,
    incomeTaxUsd,
    netIncomeUsd,
    byLabel,
    byCounterparty,
    byMemberAgent,
  }
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0)
}

function allDefined<T>(xs: (T | null)[]): boolean {
  return xs.every((x) => x !== null)
}
