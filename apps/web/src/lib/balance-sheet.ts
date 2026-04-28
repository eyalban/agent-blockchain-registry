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

export async function computeCompanyBalanceSheet(params: {
  companyId: string
  asOf?: string
}): Promise<CompanyBalanceSheet> {
  const { companyId } = params
  const asOf = params.asOf ?? new Date().toISOString().slice(0, 10)

  const [company, members, treasuries] = await Promise.all([
    getCompany(companyId),
    listActiveCompanyMembers(companyId),
    listActiveCompanyTreasuries(companyId),
  ])

  if (!company) {
    throw new Error(`Company ${companyId} not found`)
  }

  const chainId = company.chain_id as SupportedChainId
  const sources: string[] = []

  // Resolve block for asOf (today = latest; past date requires archive RPC).
  const client = publicClient as PublicClient
  const latest = await client.getBlock({ blockTag: 'latest' })
  const blockNumber = Number(latest.number)

  // ─── Cash: for every whitelisted token, for every treasury and member wallet
  const walletList: Array<{
    address: `0x${string}`
    source: CashLine['source']
    label?: string | null
    agentId?: string | null
  }> = []
  for (const t of treasuries) {
    walletList.push({
      address: t.address as `0x${string}`,
      source: 'treasury',
      label: t.label,
    })
  }
  for (const m of members) {
    // Look up the agent's linked wallets
    const agentWallets = (await sql`
      SELECT wallet_address FROM agent_wallets WHERE agent_id = ${m.agent_id}
    `) as Array<{ wallet_address: string }>
    for (const aw of agentWallets) {
      walletList.push({
        address: aw.wallet_address as `0x${string}`,
        source: 'member_agent',
        agentId: m.agent_id,
      })
    }
  }

  const cash: CashLine[] = []
  let cashTotalUsd = 0
  const tokens = Object.values(SUPPORTED_TOKENS[chainId])
  for (const entry of walletList) {
    for (const token of tokens) {
      const read = await readTokenBalance(chainId, entry.address, token)
      if (!read || read.balanceRaw === 0n) continue

      const price = await getTokenPriceUSD({
        chainId,
        token,
        blockNumber,
        blockTimestamp: new Date(Number(latest.timestamp) * 1000),
      })
      if (price) {
        sources.push(`${token.symbol} price: ${price.source}`)
      }

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
  }

  // ─── AR/AP: sum of unpaid invoices issued/received by this company.
  const [accountsReceivableUsd, accountsPayableUsd] = await Promise.all([
    sumUnpaidArByCompany(companyId),
    sumUnpaidApByCompany(companyId),
  ])
  if (accountsReceivableUsd > 0) sources.push('AR: InvoiceRegistry')
  if (accountsPayableUsd > 0) sources.push('AP: InvoiceRegistry')

  // ─── Contributed capital (from capital_contributions table; M3.3).
  const capRows = (await sql`
    SELECT from_address, to_address, token_symbol, amount_raw::text,
           amount_usd::text, tx_hash, contributed_at::text
    FROM capital_contributions
    WHERE company_id = ${companyId}
      AND contributed_at <= (${asOf}::date + INTERVAL '1 day')
    ORDER BY contributed_at ASC
  `) as Array<{
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

  // ─── Retained earnings: sum net income from company's inception to asOf.
  const incomeStatement = await computeCompanyIncomeStatement({
    companyId,
    granularity: 'total',
    from: company.created_at.slice(0, 10),
    to: asOf,
  })
  const retainedEarningsUsd = incomeStatement.totals.netIncomeUsd
  sources.push('retained earnings: income statement')

  const equityTotalUsd =
    retainedEarningsUsd !== null
      ? contributedCapitalUsd + retainedEarningsUsd
      : null

  const assetsUsd = cashTotalUsd + accountsReceivableUsd
  const liabilitiesPlusEquityUsd =
    equityTotalUsd !== null ? accountsPayableUsd + equityTotalUsd : null
  const discrepancyUsd =
    liabilitiesPlusEquityUsd !== null ? assetsUsd - liabilitiesPlusEquityUsd : null
  // 0.1% tolerance for FX rounding across many tokens.
  const withinTolerance =
    discrepancyUsd === null
      ? null
      : Math.abs(discrepancyUsd) <= Math.max(1, Math.abs(assetsUsd) * 0.001)

  // Reconciliation-mismatch diagnosis. We try two signals, in order:
  //
  //  1. Sum USD value received by this company's member wallets from a
  //     counterparty that isn't a registered agent wallet — i.e. inflows
  //     from outside the on-chain agent network. If this covers most of
  //     the discrepancy, we have a concrete number to show. (Relies on
  //     the tx indexer having picked up the faucet-drip transactions;
  //     often it hasn't on testnet because the sync scope is per-agent
  //     and starts after the drip.)
  //
  //  2. Fallback heuristic: on Base Sepolia (chainId 84532) the only
  //     source of outside ETH is the statem8 faucet. If contributed
  //     capital is $0 and the discrepancy is positive, the cash had to
  //     come from the faucet — regardless of whether we indexed the
  //     drip txs.
  const externalRows = (await sql`
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
  `) as Array<{ total: string }>
  const externalInflowsUsd = Number(externalRows[0]?.total ?? 0)

  const isTestnet = company.chain_id === 84532

  let mismatchSource: 'none' | 'faucet_drips_unbooked' | 'off_chain_costs_or_price_gaps'
  if (withinTolerance !== false || discrepancyUsd === null) {
    mismatchSource = 'none'
  } else if (
    externalInflowsUsd > 0 &&
    // Discrepancy is explained if external inflows cover ≥80% of it and
    // aren't dramatically larger (which would suggest something else
    // like unbooked treasury outflows).
    Math.abs(discrepancyUsd - externalInflowsUsd) <=
      Math.max(1, Math.abs(discrepancyUsd) * 0.2)
  ) {
    mismatchSource = 'faucet_drips_unbooked'
  } else if (
    isTestnet &&
    discrepancyUsd > 0 &&
    contributedCapitalUsd === 0
  ) {
    // Fallback: on testnet with no booked capital, a positive
    // discrepancy is the faucet.
    mismatchSource = 'faucet_drips_unbooked'
  } else {
    mismatchSource = 'off_chain_costs_or_price_gaps'
  }

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
      totalUsd: equityTotalUsd,
    },
    reconciliation: {
      assetsUsd,
      liabilitiesPlusEquityUsd,
      discrepancyUsd,
      withinTolerance,
      externalInflowsUsd,
      mismatchSource,
    },
    sources: Array.from(new Set(sources)),
  }
}

// Unused suppression: env is imported for future expansion (tax jurisdiction
// for balance-sheet notes, etc.); referenced here to silence lint for now.
export const _balanceSheetEnvHandle = env
