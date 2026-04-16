/**
 * Auto-classify transactions into financial categories.
 */

const WRAPPER = '0xC02DE01B0ecBcE17c4E71fc7A0Ad86764B3DF64C'.toLowerCase()
const IDENTITY = '0x8004A818BFB912233c491871b3d84c89A494BD9e'.toLowerCase()
const REPUTATION = '0x8004B663056A597Dffe9eCcC1965A193B7388713'.toLowerCase()

export type TransactionLabel =
  | 'revenue'
  | 'cost_of_sales'
  | 'sga_expense'
  | 'registration_fee'
  | 'feedback_fee'
  | 'transfer'
  | 'unclassified'

/**
 * Classify a transaction based on sender/receiver and known contract addresses.
 * Direction is determined by whether the agent wallet is the sender (from) or receiver (to).
 */
export function classifyTransaction(
  from: string,
  to: string,
  agentWallet: string,
): { label: TransactionLabel; direction: 'incoming' | 'outgoing' } {
  const fromLower = from.toLowerCase()
  const toLower = to.toLowerCase()
  const walletLower = agentWallet.toLowerCase()

  const isOutgoing = fromLower === walletLower
  const direction = isOutgoing ? 'outgoing' as const : 'incoming' as const

  if (isOutgoing) {
    if (toLower === WRAPPER || toLower === IDENTITY) return { label: 'registration_fee', direction }
    if (toLower === REPUTATION) return { label: 'feedback_fee', direction }
    return { label: 'sga_expense', direction }
  }

  // All incoming = revenue
  return { label: 'revenue', direction }
}
