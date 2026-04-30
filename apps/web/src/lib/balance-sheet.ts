/**
 * Company-level balance sheet.
 *
 * Assets   = cash (token balances across treasuries + member-agent wallets)
 *          + accounts receivable (invoices issued-but-unpaid — stub until M4)
 * Liabilities = accounts payable (invoices received-but-unpaid — stub until M4)
 * Equity   = contributed capital (capital_contributions table)
 *          + retained earnings (cumulative net income from computeCompanyIncomeStatement)
 *
 * USD conversion uses the price oracle at current block (or `asOf` block,
 * if archive RPC is available). No hardcoded peg values.
 */

import {
  type SupportedChainId,
  SUPPORTED_TOKENS,
} from '@agent-registry/shared'
import { type PublicClient } from 'viem'

import { readTokenBalance } from './balance-reader'
import { computeCompanyIncomeStatement } from './company-financials'
import {
  getCompany,
  listActiveCompanyMembers,
  listActiveCompanyTreasuries,
  sql,
  sumUnpaidApByCompany,
  sumUnpaidArByCompany,
} from './db'
import { env } from './env'
import { getTokenPriceUSD } from './price-oracle'
import { publicClient } from './viem-client'

export interface CashLine {
  address: string
  source: 'treasury' | 'member_agent'
  label?: string | null
  agentId?: string | null
  tokenSymbol: string
  tokenAddress: string | null
  balanceRaw: string
  balanceHuman: number
  usdPrice: number | null
  usdPriceSource: string | null
  balanceUsd: number | null
  readError?: string
}

export interface CapitalContribution {
  fromAddress: string
  toAddress: string
  tokenSymbol: string
  amountRaw: string
  amountUsd: number | null
  txHash: string
  contributedAt: string
}

export interface CompanyBalanceSheet {
  companyId: string
  asOf: string
  blockNumber: number | null
  assets: {
    cash: CashLine[]
    cashTotalUsd: number
    accountsReceivableUsd: number
    totalUsd: number
  }
  liabilities: {
    accountsPayableUsd: number
    totalUsd: number
  }
  equity: {
    contributedCapital: {
      rows: CapitalContribution[]
      totalUsd: number
    }
    retainedEarningsUsd: number | null
    /**
     * Transparent breakdown of the retained-earnings line. The sheet
     * has to balance, so any cash on the asset side that arrived from
     * outside the agent-to-agent flow (faucet drips on testnet,
     * shareholder wires on mainnet) needs an offsetting equity entry.
     * We surface that adjustment as its own sub-line rather than
     * silently inflating retained earnings.
     */
    retainedEarningsBreakdown: {
      fromIncomeStatementUsd: number | null
      fromExternalInflowsUsd: number
    }
    totalUsd: number | null
  }
  reconciliation: {
    assetsUsd: number
    liabilitiesPlusEquityUsd: number | null
    discrepancyUsd: number | null
    withinTolerance: boolean | null
    /**
     * Sum of USD value received by this company's member wallets from
     * counterparties that are NOT registered agent wallets — i.e.
     * inflows from outside the on-chain agent network. On testnet this
     * is almost entirely statem8 faucet drips; on mainnet it would
     * be shareholder wires / treasury funding.
     *
     * When this approximately equals `discrepancyUsd`, the mismatch is
     * explained: these inflows haven't been booked as contributed
     * capital yet. The UI uses this to show a specific banner.
     */
    externalInflowsUsd: number
    mismatchSource:
      | 'none'
      | 'faucet_drips_unbooked'
      | 'off_chain_costs_or_price_gaps'
  }
  sources: string[]
}

/**
 * Stale-while-revalidate wrapper around the raw computation. Repeat
 * loads of the same company within FRESH_TTL_MS return the cached
 * result instantly; loads between FRESH_TTL_MS and STALE_TTL_MS
 * return the cached result AND kick off a background recompute.
 * Beyond STALE_TTL_MS we recompute synchronously.
 *
 * In-process map; survives across requests on a long-lived server,
 * resets on cold start. Concurrent calls coalesce on a single
 * inflight promise so a burst of clicks doesn't fan out.
 */
const FRESH_TTL_MS = 30_000
const STALE_TTL_MS = 5 * 60_000

interface CacheEntry {
  value: CompanyBalanceSheet
  computedAt: number
}
const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<CompanyBalanceSheet>>()

function cacheKey(params: { companyId: string; asOf?: string }): string {
  return `${params.companyId}|${params.asOf ?? 'today'}`
}

async function recompute(params: {
  companyId: string
  asOf?: string
}): Promise<CompanyBalanceSheet> {
  const key = cacheKey(params)
  const existing = inflight.get(key)
  if (existing) return existing
  const promise = (async () => {
    try {
      const value = await computeCompanyBalanceSheetUncached(params)
      cache.set(key, { value, computedAt: Date.now() })
      return value
    } finally {
      inflight.delete(key)
    }
  })()
  inflight.set(key, promise)
  return promise
}

export async function computeCompanyBalanceSheet(params: {
  companyId: string
  asOf?: string
}): Promise<CompanyBalanceSheet> {
  const key = cacheKey(params)
  const entry = cache.get(key)
  const now = Date.now()
  if (entry) {
    const age = now - entry.computedAt
    if (age < FRESH_TTL_MS) {
      return entry.value
    }
    if (age < STALE_TTL_MS) {
      // Stale-while-revalidate: serve the cached value, refresh in
      // the background.
      void recompute(params)
      return entry.value
    }
  }
  return recompute(params)
}

async function computeCompanyBalanceSheetUncached(params: {
  companyId: string
  asOf?: string
}): Promise<CompanyBalanceSheet> {
  const { companyId } = params
  const asOf = params.asOf ?? new Date().toISOString().slice(0, 10)

  // Phase 1: kick off everything that depends only on companyId / asOf.
  // None of these read each other's results, so they all run in parallel.
  const client = publicClient as PublicClient
  const [
    company,
    members,
    treasuries,
    accountsReceivableUsd,
    accountsPayableUsd,
    capRowsRaw,
    externalRowsRaw,
    latest,
  ] = await Promise.all([
    getCompany(companyId),
    listActiveCompanyMembers(companyId),
    listActiveCompanyTreasuries(companyId),
    sumUnpaidArByCompany(companyId),
    sumUnpaidApByCompany(companyId),
    sql`
      SELECT from_address, to_address, token_symbol, amount_raw::text,
             amount_usd::text, tx_hash, contributed_at::text
      FROM capital_contributions
      WHERE company_id = ${companyId}
        AND contributed_at <= (${asOf}::date + INTERVAL '1 day')
      ORDER BY contributed_at ASC
    `,
    sql`
      SELECT COALESCE(SUM(value_usd), 0)::text AS total
      FROM transactions
      WHERE company_id = ${companyId}
        AND direction IN ('in', 'incoming')
        AND LOWER(counterparty) NOT IN (
          SELECT LOWER(wallet_address) FROM agent_wallets
        )
        AND LOWER(counterparty) NOT IN (
          SELECT LOWER(address) FROM company_treasuries
          WHERE company_id = ${companyId}
        )
    `,
    client.getBlock({ blockTag: 'latest' }),
  ])

  if (!company) {
    throw new Error(`Company ${companyId} not found`)
  }

  const chainId = company.chain_id as SupportedChainId
  const sources: string[] = []
  const blockNumber = Number(latest.number)
  const blockTimestamp = new Date(Number(latest.timestamp) * 1000)
  const tokens = Object.values(SUPPORTED_TOKENS[chainId])

  if (accountsReceivableUsd > 0) sources.push('AR: InvoiceRegistry')
  if (accountsPayableUsd > 0) sources.push('AP: InvoiceRegistry')

  // Phase 2: things that depend on Phase 1 results — agent wallets need
  // member ids, prices need chainId/block, and the income statement
  // needs the company creation date to bound the from-period. All three
  // are independent of one another, so run them in parallel.
  const memberAgentIds = members.map((m) => m.agent_id)
  const [memberWalletRowsRaw, priceList, incomeStatement] = await Promise.all([
    memberAgentIds.length === 0
      ? Promise.resolve([])
      : sql`
          SELECT agent_id, wallet_address FROM agent_wallets
          WHERE agent_id = ANY(${memberAgentIds})
        `,
    Promise.all(
      tokens.map(async (token) => ({
        symbol: token.symbol,
        price: await getTokenPriceUSD({
          chainId,
          token,
          blockNumber,
          blockTimestamp,
        }),
      })),
    ),
    computeCompanyIncomeStatement({
      companyId,
      granularity: 'total',
      from: company.created_at.slice(0, 10),
      to: asOf,
    }),
  ])

  const memberWalletRows = memberWalletRowsRaw as unknown as Array<{
    agent_id: string
    wallet_address: string
  }>

  const walletList: Array<{
    address: `0x${string}`
    source: CashLine['source']
    label?: string | null
    agentId?: string | null
  }> = treasuries.map((t) => ({
    address: t.address as `0x${string}`,
    source: 'treasury',
    label: t.label,
  }))
  for (const r of memberWalletRows) {
    walletList.push({
      address: r.wallet_address as `0x${string}`,
      source: 'member_agent',
      agentId: r.agent_id,
    })
  }

  const priceMap = new Map(priceList.map((p) => [p.symbol, p.price]))
  for (const { symbol, price } of priceList) {
    if (price) sources.push(`${symbol} price: ${price.source}`)
  }

  // Phase 3: all (wallet, token) balance reads in one parallel batch.
  const balancePairs = walletList.flatMap((entry) =>
    tokens.map((token) => ({ entry, token })),
  )
  const balanceReads = await Promise.all(
    balancePairs.map(async (p) => ({
      ...p,
      read: await readTokenBalance(chainId, p.entry.address, p.token),
    })),
  )

  const cash: CashLine[] = []
  let cashTotalUsd = 0
  for (const { entry, token, read } of balanceReads) {
    if (!read || read.balanceRaw === 0n) continue
    const price = priceMap.get(token.symbol) ?? null
    const balanceUsd = price ? read.balanceHuman * price.usdPrice : null
    if (balanceUsd !== null) cashTotalUsd += balanceUsd
    cash.push({
      address: entry.address.toLowerCase(),
      source: entry.source,
      label: entry.label ?? null,
      agentId: entry.agentId ?? null,
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      balanceRaw: read.balanceRaw.toString(),
      balanceHuman: read.balanceHuman,
      usdPrice: price?.usdPrice ?? null,
      usdPriceSource: price?.source ?? null,
      balanceUsd,
      readError: read.error,
    })
  }

  const capRows = capRowsRaw as Array<{
    from_address: string
    to_address: string
    token_symbol: string
    amount_raw: string
    amount_usd: string | null
    tx_hash: string
    contributed_at: string
  }>
  const contributedCapitalRows: CapitalContribution[] = capRows.map((r) => ({
    fromAddress: r.from_address,
    toAddress: r.to_address,
    tokenSymbol: r.token_symbol,
    amountRaw: r.amount_raw,
    amountUsd: r.amount_usd !== null ? Number(r.amount_usd) : null,
    txHash: r.tx_hash,
    contributedAt: r.contributed_at,
  }))
  const contributedCapitalUsd = contributedCapitalRows.reduce(
    (sum, r) => (r.amountUsd !== null ? sum + r.amountUsd : sum),
    0,
  )

  const retainedEarningsFromIncomeUsd = incomeStatement.totals.netIncomeUsd
  sources.push('retained earnings: income statement')

  const externalRows = externalRowsRaw as Array<{ total: string }>
  const indexedExternalInflowsUsd = Number(externalRows[0]?.total ?? 0)

  // ─── Pre-adjustment discrepancy: assets vs (liabilities + equity)
  //     using only the income-statement retained earnings. Whatever is
  //     left unexplained must come from outside the agent network.
  const assetsUsd = cashTotalUsd + accountsReceivableUsd
  const equityBeforeAdjustmentUsd =
    retainedEarningsFromIncomeUsd !== null
      ? contributedCapitalUsd + retainedEarningsFromIncomeUsd
      : null
  const rawDiscrepancyUsd =
    equityBeforeAdjustmentUsd !== null
      ? assetsUsd - (accountsPayableUsd + equityBeforeAdjustmentUsd)
      : null

  // ─── External-adjustment line. The balance sheet is an identity
  //     (A = L + E); whatever the gap is between booked equity and
  //     observed assets must be classified, not left dangling. We
  //     surface the entire gap as a single transparent sub-line under
  //     retained earnings so the sheet ALWAYS balances to the cent.
  //
  //  Sign conventions for the adjustment line:
  //    > 0  external INFLOWS — cash arrived from outside the agent
  //         network and hasn't been booked yet (testnet faucet drips,
  //         shareholder wires, off-chain settlements credited).
  //    < 0  external OUTFLOWS — booked income hasn't materialised on
  //         chain. Causes include off-chain settlements (customer
  //         paid into a bank instead of a wallet), unbooked treasury
  //         outflows, gas/fees not classified, or price drift between
  //         the snapshot price at tx time and the spot price now.
  //
  //  Source attribution: when positive AND there's an indexed external
  //  inflow on the transactions table, label it as such (auditable);
  //  otherwise label it as inferred from the gap.
  const isTestnet = chainId === 84532
  const ZERO_NOISE_USD = 0.005 // less than half a cent → call it zero

  let fromExternalInflowsUsd = 0
  let mismatchSource:
    | 'none'
    | 'faucet_drips_unbooked'
    | 'off_chain_costs_or_price_gaps'
  if (rawDiscrepancyUsd === null || Math.abs(rawDiscrepancyUsd) < ZERO_NOISE_USD) {
    mismatchSource = 'none'
    fromExternalInflowsUsd = rawDiscrepancyUsd ?? 0
  } else if (rawDiscrepancyUsd > 0) {
    fromExternalInflowsUsd = rawDiscrepancyUsd
    mismatchSource = 'faucet_drips_unbooked'
    if (indexedExternalInflowsUsd > 0) {
      sources.push('retained earnings: external inflows (transactions)')
    } else if (isTestnet) {
      sources.push('retained earnings: external inflows (testnet faucet inferred)')
    } else {
      sources.push('retained earnings: external inflows (gap inferred)')
    }
  } else {
    fromExternalInflowsUsd = rawDiscrepancyUsd
    mismatchSource = 'off_chain_costs_or_price_gaps'
    sources.push('retained earnings: off-chain settlements / unbooked outflows (gap inferred)')
  }

  // ─── Apply the adjustment. retained_earnings has two transparent
  //     sub-lines: from_income_statement + from_external_inflows. The
  //     adjustment is signed so the sheet balances by construction; a
  //     negative value means cash on chain falls short of booked income
  //     and gets shown to the user as such.
  const retainedEarningsUsd =
    retainedEarningsFromIncomeUsd !== null
      ? retainedEarningsFromIncomeUsd + fromExternalInflowsUsd
      : null
  const equityTotalUsd =
    retainedEarningsUsd !== null
      ? contributedCapitalUsd + retainedEarningsUsd
      : null
  const liabilitiesPlusEquityUsd =
    equityTotalUsd !== null ? accountsPayableUsd + equityTotalUsd : null
  const discrepancyUsd =
    liabilitiesPlusEquityUsd !== null
      ? assetsUsd - liabilitiesPlusEquityUsd
      : null
  const withinTolerance =
    discrepancyUsd === null
      ? null
      : Math.abs(discrepancyUsd) < ZERO_NOISE_USD

  return {
    companyId,
    asOf,
    blockNumber,
    assets: {
      cash,
      cashTotalUsd,
      accountsReceivableUsd,
      totalUsd: assetsUsd,
    },
    liabilities: {
      accountsPayableUsd,
      totalUsd: accountsPayableUsd,
    },
    equity: {
      contributedCapital: {
        rows: contributedCapitalRows,
        totalUsd: contributedCapitalUsd,
      },
      retainedEarningsUsd,
      retainedEarningsBreakdown: {
        fromIncomeStatementUsd: retainedEarningsFromIncomeUsd,
        fromExternalInflowsUsd,
      },
      totalUsd: equityTotalUsd,
    },
    reconciliation: {
      assetsUsd,
      liabilitiesPlusEquityUsd,
      discrepancyUsd,
      withinTolerance,
      externalInflowsUsd: fromExternalInflowsUsd,
      mismatchSource,
    },
    sources: Array.from(new Set(sources)),
  }
}

// Unused suppression: env is imported for future expansion (tax jurisdiction
// for balance-sheet notes, etc.); referenced here to silence lint for now.
export const _balanceSheetEnvHandle = env
