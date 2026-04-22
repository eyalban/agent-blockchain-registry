/**
 * Counterparty reconciliation for transaction labels.
 *
 * Given a tx hash, looks up both sides in the `transactions` table. If both
 * sides are registered agents, compares their labels against the match matrix
 * and records the result in `tx_validations`.
 *
 * Match matrix (either direction):
 *   revenue        ↔  any expense label        → matched
 *   transfer       ↔  transfer                 → matched
 *   registration_fee / feedback_fee (both)     → matched (protocol)
 *   anything else mismatched but both definitive → mismatched
 *   one side unknown                           → pending
 */

import { sql } from './db'

const EXPENSE_LABELS = new Set<string>([
  'cost_of_sales',
  'sga_expense',
  'registration_fee',
  'feedback_fee',
  'cogs_protocol_fee',
  'cogs_compute',
  'cogs_llm_api',
  'cogs_data',
  'cogs_other',
  'opex_infra',
  'opex_tooling',
  'opex_salaries',
  'opex_other',
])

function isExpense(label: string): boolean {
  return EXPENSE_LABELS.has(label)
}

function isRevenue(label: string): boolean {
  return label === 'revenue' || label.startsWith('revenue_')
}

function classifyPair(self: string, other: string): 'matched' | 'mismatched' | 'pending' {
  if (!self || !other || self === 'unclassified' || other === 'unclassified') {
    return 'pending'
  }
  if (self === 'transfer' && other === 'transfer') return 'matched'
  if ((isRevenue(self) && isExpense(other)) || (isExpense(self) && isRevenue(other))) {
    return 'matched'
  }
  if (self === other && (isExpense(self) || isRevenue(self))) return 'matched'
  return 'mismatched'
}

interface TxRow {
  agent_id: string
  label: string
  label_confidence: string | null
  counterparty: string
  wallet_address: string
}

/**
 * Reconcile a single tx. Looks up both sides and upserts a tx_validations row
 * for each (self, other) pair where both sides are registered. Returns the
 * pairs written.
 */
export async function reconcileTx(
  txHash: string,
): Promise<
  Array<{
    selfAgentId: string
    otherAgentId: string
    status: 'matched' | 'mismatched' | 'pending'
    selfLabel: string
    otherLabel: string
  }>
> {
  const rows = (await sql`
    SELECT agent_id, label, label_confidence, counterparty, wallet_address
    FROM transactions WHERE tx_hash = ${txHash}
  `) as TxRow[]

  if (rows.length === 0) return []

  // Build index: agent_id → row. Most txs produce ≤2 rows (one per side).
  const byAgent = new Map<string, TxRow>()
  for (const r of rows) byAgent.set(r.agent_id, r)

  const results: Array<{
    selfAgentId: string
    otherAgentId: string
    status: 'matched' | 'mismatched' | 'pending'
    selfLabel: string
    otherLabel: string
  }> = []

  for (const self of rows) {
    // The counterparty address might map to a different agent_id.
    const otherAgentRows = (await sql`
      SELECT agent_id FROM agent_wallets
      WHERE wallet_address = ${self.counterparty.toLowerCase()}
      LIMIT 1
    `) as Array<{ agent_id: string }>
    const otherAgentId = otherAgentRows[0]?.agent_id
    if (!otherAgentId || otherAgentId === self.agent_id) continue

    const other = byAgent.get(otherAgentId)
    if (!other) continue

    const status = classifyPair(self.label, other.label)
    const note =
      status === 'mismatched'
        ? `Labels disagree: ${self.label} vs ${other.label}`
        : undefined

    await sql`
      INSERT INTO tx_validations (
        tx_hash, self_agent_id, other_agent_id,
        self_label, other_label, status,
        self_confidence, other_confidence, note
      ) VALUES (
        ${txHash}, ${self.agent_id}, ${otherAgentId},
        ${self.label}, ${other.label}, ${status},
        ${self.label_confidence ?? null}, ${other.label_confidence ?? null},
        ${note ?? null}
      )
      ON CONFLICT (tx_hash, self_agent_id, other_agent_id) DO UPDATE SET
        self_label = EXCLUDED.self_label,
        other_label = EXCLUDED.other_label,
        status = EXCLUDED.status,
        self_confidence = EXCLUDED.self_confidence,
        other_confidence = EXCLUDED.other_confidence,
        note = EXCLUDED.note,
        validated_at = NOW()
    `

    results.push({
      selfAgentId: self.agent_id,
      otherAgentId,
      status,
      selfLabel: self.label,
      otherLabel: other.label,
    })
  }

  return results
}

export async function getTxValidations(txHash: string): Promise<
  Array<{
    self_agent_id: string
    other_agent_id: string
    self_label: string
    other_label: string
    status: string
    note: string | null
    validated_at: string
  }>
> {
  return (await sql`
    SELECT self_agent_id, other_agent_id, self_label, other_label,
           status, note, validated_at::text
    FROM tx_validations
    WHERE tx_hash = ${txHash}
    ORDER BY validated_at DESC
  `) as Array<{
    self_agent_id: string
    other_agent_id: string
    self_label: string
    other_label: string
    status: string
    note: string | null
    validated_at: string
  }>
}
