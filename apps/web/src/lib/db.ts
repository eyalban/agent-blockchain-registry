import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.warn('DATABASE_URL not set — database features disabled')
}
const DB_AVAILABLE = Boolean(DATABASE_URL)

/**
 * Neon serverless SQL client.
 * Usage: const rows = await sql`SELECT * FROM agent_wallets WHERE agent_id = ${id}`
 */
export const sql = neon(DATABASE_URL ?? '')
export { DB_AVAILABLE }

// ============================================================
// Wallet Dictionary (bidirectional agent <-> wallet mapping)
// ============================================================

export async function addWallet(
  agentId: string,
  walletAddress: string,
  isPrimary = false,
  label = 'default',
): Promise<void> {
  await sql`
    INSERT INTO agent_wallets (agent_id, wallet_address, is_primary, label)
    VALUES (${agentId}, ${walletAddress.toLowerCase()}, ${isPrimary}, ${label})
    ON CONFLICT (agent_id, wallet_address) DO UPDATE SET
      is_primary = ${isPrimary},
      label = ${label}
  `
}

export async function getWalletsByAgent(
  agentId: string,
): Promise<Array<{ wallet_address: string; is_primary: boolean; label: string }>> {
  const rows = await sql`
    SELECT wallet_address, is_primary, label FROM agent_wallets
    WHERE agent_id = ${agentId} ORDER BY is_primary DESC, added_at ASC
  `
  return rows as Array<{ wallet_address: string; is_primary: boolean; label: string }>
}

export async function getAgentByWallet(
  walletAddress: string,
): Promise<string | null> {
  const rows = await sql`
    SELECT agent_id FROM agent_wallets
    WHERE wallet_address = ${walletAddress.toLowerCase()} LIMIT 1
  `
  return rows.length > 0 ? (rows[0] as { agent_id: string }).agent_id : null
}

// ============================================================
// Transactions
// ============================================================

export interface DbTransaction {
  tx_hash: string
  agent_id: string
  wallet_address: string
  direction: string
  counterparty: string
  /** Legacy ETH-only amount. Kept for backward compatibility during rollout. */
  value_eth: number
  block_number: number
  block_timestamp: string
  label: string
  label_source: string
  memo: string | null
  gas_used: string | null
  gas_cost_eth: number | null
  /** Chain id this tx was on (84532 = Base Sepolia, 8453 = Base). */
  chain_id?: number
  /** ERC-20 token address, or null for native (ETH). */
  token_address?: string | null
  /** Symbol of the token ('ETH', 'USDC'). */
  token_symbol?: string
  /** Raw token units (e.g. wei for ETH, micro-USDC for USDC). */
  value_token?: string | null
  /** USD equivalent computed at block time from a price oracle. */
  value_usd?: number | null
  /** USD/token price used for the conversion. */
  usd_price_at_block?: number | null
  /** Provenance for the price: 'chainlink' | 'coingecko'. */
  price_source?: string | null
}

export async function insertTransaction(tx: DbTransaction): Promise<void> {
  await sql`
    INSERT INTO transactions (
      tx_hash, agent_id, wallet_address, direction, counterparty,
      value_eth, block_number, block_timestamp, label, label_source,
      memo, gas_used, gas_cost_eth,
      chain_id, token_address, token_symbol, value_token,
      value_usd, usd_price_at_block, price_source
    )
    VALUES (
      ${tx.tx_hash}, ${tx.agent_id}, ${tx.wallet_address}, ${tx.direction},
      ${tx.counterparty}, ${tx.value_eth}, ${tx.block_number}, ${tx.block_timestamp},
      ${tx.label}, ${tx.label_source}, ${tx.memo}, ${tx.gas_used}, ${tx.gas_cost_eth},
      ${tx.chain_id ?? 84532},
      ${tx.token_address ?? null},
      ${tx.token_symbol ?? null},
      ${tx.value_token ?? null},
      ${tx.value_usd ?? null},
      ${tx.usd_price_at_block ?? null},
      ${tx.price_source ?? null}
    )
    ON CONFLICT (tx_hash) DO NOTHING
  `
}

export async function getTransactionsByAgent(
  agentId: string,
  label?: string,
): Promise<DbTransaction[]> {
  if (label) {
    return await sql`
      SELECT * FROM transactions WHERE agent_id = ${agentId} AND label = ${label}
      ORDER BY block_timestamp DESC
    ` as DbTransaction[]
  }
  return await sql`
    SELECT * FROM transactions WHERE agent_id = ${agentId}
    ORDER BY block_timestamp DESC
  ` as DbTransaction[]
}

export async function updateTransactionLabel(
  txHash: string,
  label: string,
): Promise<void> {
  await sql`
    UPDATE transactions SET label = ${label}, label_source = 'manual'
    WHERE tx_hash = ${txHash}
  `
}

// ============================================================
// Companies (mirror of on-chain CompanyRegistry)
// ============================================================

export interface DbCompany {
  company_id: string
  chain_id: number
  founder_address: string
  owner_address: string
  metadata_uri: string
  name: string | null
  description: string | null
  logo_url: string | null
  jurisdiction_code: string | null
  created_tx_hash: string
  created_block: number
  created_at: string
}

export async function insertCompany(params: {
  companyId: string
  chainId: number
  founderAddress: string
  metadataURI: string
  name: string | null
  description: string | null
  logoURL: string | null
  jurisdictionCode: string | null
  createdTxHash: string
  createdBlock: number
}): Promise<void> {
  await sql`
    INSERT INTO companies (
      company_id, chain_id, founder_address, owner_address, metadata_uri,
      name, description, logo_url, jurisdiction_code,
      created_tx_hash, created_block
    ) VALUES (
      ${params.companyId}, ${params.chainId},
      ${params.founderAddress.toLowerCase()}, ${params.founderAddress.toLowerCase()},
      ${params.metadataURI},
      ${params.name}, ${params.description}, ${params.logoURL}, ${params.jurisdictionCode},
      ${params.createdTxHash}, ${params.createdBlock}
    )
    ON CONFLICT (company_id) DO NOTHING
  `
}

export async function getCompany(companyId: string): Promise<DbCompany | null> {
  const rows = (await sql`
    SELECT company_id, chain_id, founder_address, owner_address, metadata_uri,
           name, description, logo_url, jurisdiction_code,
           created_tx_hash, created_block, created_at::text
    FROM companies WHERE company_id = ${companyId} LIMIT 1
  `) as DbCompany[]
  return rows[0] ?? null
}

export async function listCompanies(
  limit: number,
  offset: number,
  founder?: string,
): Promise<{ rows: DbCompany[]; total: number }> {
  const founderLower = founder?.toLowerCase() ?? null
  const rows = (await sql`
    SELECT company_id, chain_id, founder_address, owner_address, metadata_uri,
           name, description, logo_url, jurisdiction_code,
           created_tx_hash, created_block, created_at::text
    FROM companies
    WHERE (${founderLower}::text IS NULL OR founder_address = ${founderLower})
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as DbCompany[]
  const countRows = (await sql`
    SELECT COUNT(*)::int AS c FROM companies
    WHERE (${founderLower}::text IS NULL OR founder_address = ${founderLower})
  `) as Array<{ c: number }>
  return { rows, total: countRows[0]?.c ?? 0 }
}

export async function updateCompanyOwner(
  companyId: string,
  newOwner: string,
): Promise<void> {
  await sql`
    UPDATE companies SET owner_address = ${newOwner.toLowerCase()}
    WHERE company_id = ${companyId}
  `
}

export async function updateCompanyMetadataMirror(
  companyId: string,
  metadataURI: string,
  parsed: {
    name: string | null
    description: string | null
    logoURL: string | null
    jurisdictionCode: string | null
  },
): Promise<void> {
  await sql`
    UPDATE companies SET
      metadata_uri = ${metadataURI},
      name = ${parsed.name},
      description = ${parsed.description},
      logo_url = ${parsed.logoURL},
      jurisdiction_code = ${parsed.jurisdictionCode}
    WHERE company_id = ${companyId}
  `
}

export async function addCompanyMember(params: {
  companyId: string
  agentId: string
  addedTxHash: string
}): Promise<void> {
  await sql`
    INSERT INTO company_members (company_id, agent_id, added_tx_hash)
    VALUES (${params.companyId}, ${params.agentId}, ${params.addedTxHash})
    ON CONFLICT (company_id, agent_id) DO UPDATE SET
      added_tx_hash = EXCLUDED.added_tx_hash,
      added_at = NOW(),
      removed_tx_hash = NULL,
      removed_at = NULL
  `
}

export async function removeCompanyMember(params: {
  companyId: string
  agentId: string
  removedTxHash: string
}): Promise<void> {
  await sql`
    UPDATE company_members SET
      removed_tx_hash = ${params.removedTxHash},
      removed_at = NOW()
    WHERE company_id = ${params.companyId} AND agent_id = ${params.agentId}
  `
}

export async function listActiveCompanyMembers(
  companyId: string,
): Promise<Array<{ agent_id: string; added_at: string; added_tx_hash: string }>> {
  const rows = (await sql`
    SELECT agent_id, added_at::text, added_tx_hash
    FROM company_members
    WHERE company_id = ${companyId} AND removed_at IS NULL
    ORDER BY added_at DESC
  `) as Array<{ agent_id: string; added_at: string; added_tx_hash: string }>
  return rows
}

export async function addCompanyTreasury(params: {
  companyId: string
  address: string
  label: string | null
  addedTxHash: string
}): Promise<void> {
  await sql`
    INSERT INTO company_treasuries (company_id, address, label, added_tx_hash)
    VALUES (${params.companyId}, ${params.address.toLowerCase()}, ${params.label}, ${params.addedTxHash})
    ON CONFLICT (company_id, address) DO UPDATE SET
      label = EXCLUDED.label,
      added_tx_hash = EXCLUDED.added_tx_hash,
      added_at = NOW(),
      removed_tx_hash = NULL,
      removed_at = NULL
  `
}

export async function removeCompanyTreasury(params: {
  companyId: string
  address: string
  removedTxHash: string
}): Promise<void> {
  await sql`
    UPDATE company_treasuries SET
      removed_tx_hash = ${params.removedTxHash},
      removed_at = NOW()
    WHERE company_id = ${params.companyId}
      AND address = ${params.address.toLowerCase()}
  `
}

export async function listActiveCompanyTreasuries(
  companyId: string,
): Promise<Array<{ address: string; label: string | null; added_at: string }>> {
  const rows = (await sql`
    SELECT address, label, added_at::text
    FROM company_treasuries
    WHERE company_id = ${companyId} AND removed_at IS NULL
    ORDER BY added_at DESC
  `) as Array<{ address: string; label: string | null; added_at: string }>
  return rows
}

export async function findCompanyByAgent(agentId: string): Promise<string | null> {
  const rows = (await sql`
    SELECT company_id FROM company_members
    WHERE agent_id = ${agentId} AND removed_at IS NULL
    LIMIT 1
  `) as Array<{ company_id: string }>
  return rows[0]?.company_id ?? null
}

export async function findCompanyByWallet(address: string): Promise<string | null> {
  // Check if the wallet is a treasury of any active company.
  const treasuryRows = (await sql`
    SELECT company_id FROM company_treasuries
    WHERE address = ${address.toLowerCase()} AND removed_at IS NULL
    LIMIT 1
  `) as Array<{ company_id: string }>
  if (treasuryRows[0]) return treasuryRows[0].company_id

  // Otherwise check if the wallet maps to an agent that's a member of a company.
  const memberRows = (await sql`
    SELECT cm.company_id FROM company_members cm
    JOIN agent_wallets aw ON aw.agent_id = cm.agent_id
    WHERE aw.wallet_address = ${address.toLowerCase()}
      AND cm.removed_at IS NULL
    LIMIT 1
  `) as Array<{ company_id: string }>
  return memberRows[0]?.company_id ?? null
}

// ============================================================
// Invoices (mirror of on-chain InvoiceRegistry)
// ============================================================

export interface DbInvoice {
  invoice_id: string
  chain_id: number
  issuer_address: string
  payer_address: string
  issuer_company_id: string | null
  payer_company_id: string | null
  issuer_agent_id: string | null
  payer_agent_id: string | null
  token_address: string | null
  token_symbol: string
  amount_raw: string
  amount_usd_at_issue: string | null
  usd_price_at_issue: string | null
  price_source: string | null
  due_block: number | null
  memo_uri: string
  memo_hash: string
  status: 'issued' | 'paid' | 'cancelled'
  issued_at: string
  issued_block: number
  issued_tx_hash: string
  paid_at: string | null
  paid_block: number | null
  paid_tx_hash: string | null
  cancelled_at: string | null
  cancelled_tx_hash: string | null
}

export async function insertInvoice(params: {
  invoiceId: string
  chainId: number
  issuerAddress: string
  payerAddress: string
  issuerCompanyId: string | null
  payerCompanyId: string | null
  issuerAgentId: string | null
  payerAgentId: string | null
  tokenAddress: string | null
  tokenSymbol: string
  amountRaw: string
  amountUsdAtIssue: number | null
  usdPriceAtIssue: number | null
  priceSource: string | null
  dueBlock: number | null
  memoUri: string
  memoHash: string
  issuedAt: string
  issuedBlock: number
  issuedTxHash: string
}): Promise<void> {
  await sql`
    INSERT INTO invoices (
      invoice_id, chain_id, issuer_address, payer_address,
      issuer_company_id, payer_company_id, issuer_agent_id, payer_agent_id,
      token_address, token_symbol, amount_raw, amount_usd_at_issue,
      usd_price_at_issue, price_source, due_block, memo_uri, memo_hash,
      status, issued_at, issued_block, issued_tx_hash
    ) VALUES (
      ${params.invoiceId}, ${params.chainId},
      ${params.issuerAddress.toLowerCase()}, ${params.payerAddress.toLowerCase()},
      ${params.issuerCompanyId}, ${params.payerCompanyId},
      ${params.issuerAgentId}, ${params.payerAgentId},
      ${params.tokenAddress?.toLowerCase() ?? null}, ${params.tokenSymbol},
      ${params.amountRaw}, ${params.amountUsdAtIssue},
      ${params.usdPriceAtIssue}, ${params.priceSource},
      ${params.dueBlock}, ${params.memoUri}, ${params.memoHash},
      'issued', ${params.issuedAt}, ${params.issuedBlock}, ${params.issuedTxHash}
    )
    ON CONFLICT (invoice_id) DO NOTHING
  `
}

export async function markInvoicePaid(params: {
  invoiceId: string
  paidAt: string
  paidBlock: number
  paidTxHash: string
}): Promise<void> {
  await sql`
    UPDATE invoices SET
      status = 'paid',
      paid_at = ${params.paidAt},
      paid_block = ${params.paidBlock},
      paid_tx_hash = ${params.paidTxHash}
    WHERE invoice_id = ${params.invoiceId}
      AND status = 'issued'
  `
}

export async function markInvoiceCancelled(params: {
  invoiceId: string
  cancelledAt: string
  cancelledTxHash: string
}): Promise<void> {
  await sql`
    UPDATE invoices SET
      status = 'cancelled',
      cancelled_at = ${params.cancelledAt},
      cancelled_tx_hash = ${params.cancelledTxHash}
    WHERE invoice_id = ${params.invoiceId}
      AND status = 'issued'
  `
}

export async function getInvoice(invoiceId: string): Promise<DbInvoice | null> {
  const rows = (await sql`
    SELECT invoice_id, chain_id, issuer_address, payer_address,
           issuer_company_id, payer_company_id, issuer_agent_id, payer_agent_id,
           token_address, token_symbol, amount_raw::text, amount_usd_at_issue::text,
           usd_price_at_issue::text, price_source, due_block, memo_uri, memo_hash,
           status, issued_at::text, issued_block, issued_tx_hash,
           paid_at::text, paid_block, paid_tx_hash,
           cancelled_at::text, cancelled_tx_hash
    FROM invoices WHERE invoice_id = ${invoiceId} LIMIT 1
  `) as DbInvoice[]
  return rows[0] ?? null
}

export async function listInvoicesByParty(params: {
  issuerAddress?: string
  payerAddress?: string
  companyId?: string
  status?: string
  limit?: number
}): Promise<DbInvoice[]> {
  const limit = params.limit ?? 100
  const rows = (await sql`
    SELECT invoice_id, chain_id, issuer_address, payer_address,
           issuer_company_id, payer_company_id, issuer_agent_id, payer_agent_id,
           token_address, token_symbol, amount_raw::text, amount_usd_at_issue::text,
           usd_price_at_issue::text, price_source, due_block, memo_uri, memo_hash,
           status, issued_at::text, issued_block, issued_tx_hash,
           paid_at::text, paid_block, paid_tx_hash,
           cancelled_at::text, cancelled_tx_hash
    FROM invoices
    WHERE (${params.issuerAddress ?? null}::text IS NULL
           OR issuer_address = LOWER(${params.issuerAddress ?? null}))
      AND (${params.payerAddress ?? null}::text IS NULL
           OR payer_address = LOWER(${params.payerAddress ?? null}))
      AND (${params.companyId ?? null}::text IS NULL
           OR issuer_company_id = ${params.companyId ?? null}
           OR payer_company_id = ${params.companyId ?? null})
      AND (${params.status ?? null}::text IS NULL
           OR status = ${params.status ?? null})
    ORDER BY issued_at DESC
    LIMIT ${limit}
  `) as DbInvoice[]
  return rows
}

export async function sumUnpaidArByCompany(companyId: string): Promise<number> {
  const rows = (await sql`
    SELECT COALESCE(SUM(amount_usd_at_issue), 0)::text AS total
    FROM invoices
    WHERE issuer_company_id = ${companyId} AND status = 'issued'
  `) as Array<{ total: string }>
  return Number(rows[0]?.total ?? '0')
}

export async function sumUnpaidApByCompany(companyId: string): Promise<number> {
  const rows = (await sql`
    SELECT COALESCE(SUM(amount_usd_at_issue), 0)::text AS total
    FROM invoices
    WHERE payer_company_id = ${companyId} AND status = 'issued'
  `) as Array<{ total: string }>
  return Number(rows[0]?.total ?? '0')
}

// ============================================================
// Income Statement (computed on-the-fly)
// ============================================================
//
// Tax and net income are intentionally NOT computed at the agent level — tax
// is an entity-level concept that applies to a company, not an individual
// agent. The per-agent statement stops at Operating Profit; the UI shows
// "Tax computed at company level" in its place. Company-level tax resolution
// goes through `resolveTaxRate()` in `./tax-rates.ts` and the `tax_rates`
// table, sourced from OECD data with full provenance.

export interface IncomeStatement {
  agentId: string
  revenue: number
  costOfSales: number
  grossProfit: number
  sgaExpenses: number
  operatingProfit: number
  transactionCount: number
}

export async function computeIncomeStatement(
  agentId: string,
): Promise<IncomeStatement> {
  const rows = await sql`
    SELECT
      COALESCE(SUM(CASE WHEN label = 'revenue' THEN value_eth ELSE 0 END), 0) as revenue,
      COALESCE(SUM(CASE WHEN label IN ('cost_of_sales', 'registration_fee', 'feedback_fee') THEN value_eth ELSE 0 END), 0) as cost_of_sales,
      COALESCE(SUM(CASE WHEN label = 'sga_expense' THEN value_eth ELSE 0 END), 0) as sga_expenses,
      COUNT(*) as tx_count
    FROM transactions WHERE agent_id = ${agentId}
  `

  const row = rows[0] as {
    revenue: string
    cost_of_sales: string
    sga_expenses: string
    tx_count: string
  }

  const revenue = Number(row.revenue)
  const costOfSales = Number(row.cost_of_sales)
  const sgaExpenses = Number(row.sga_expenses)
  const grossProfit = revenue - costOfSales
  const operatingProfit = grossProfit - sgaExpenses

  return {
    agentId,
    revenue,
    costOfSales,
    grossProfit,
    sgaExpenses,
    operatingProfit,
    transactionCount: Number(row.tx_count),
  }
}
