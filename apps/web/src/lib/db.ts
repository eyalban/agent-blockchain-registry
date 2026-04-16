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
  value_eth: number
  block_number: number
  block_timestamp: string
  label: string
  label_source: string
  memo: string | null
  gas_used: string | null
  gas_cost_eth: number | null
}

export async function insertTransaction(tx: DbTransaction): Promise<void> {
  await sql`
    INSERT INTO transactions (tx_hash, agent_id, wallet_address, direction, counterparty,
      value_eth, block_number, block_timestamp, label, label_source, memo, gas_used, gas_cost_eth)
    VALUES (${tx.tx_hash}, ${tx.agent_id}, ${tx.wallet_address}, ${tx.direction},
      ${tx.counterparty}, ${tx.value_eth}, ${tx.block_number}, ${tx.block_timestamp},
      ${tx.label}, ${tx.label_source}, ${tx.memo}, ${tx.gas_used}, ${tx.gas_cost_eth})
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
// Income Statement (computed on-the-fly)
// ============================================================

export interface IncomeStatement {
  agentId: string
  revenue: number
  costOfSales: number
  grossProfit: number
  sgaExpenses: number
  operatingProfit: number
  taxRate: number
  incomeTaxExpense: number
  netIncome: number
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
  const taxRate = 0.3
  const incomeTaxExpense = operatingProfit > 0 ? operatingProfit * taxRate : 0
  const netIncome = operatingProfit - incomeTaxExpense

  return {
    agentId,
    revenue,
    costOfSales,
    grossProfit,
    sgaExpenses,
    operatingProfit,
    taxRate,
    incomeTaxExpense,
    netIncome,
    transactionCount: Number(row.tx_count),
  }
}
