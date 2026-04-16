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
 * Classify a transaction based on addresses and direction.
 */
export function classifyTransaction(
  from: string,
  to: string,
  agentWallet: string,
  inputData: string,
): { label: TransactionLabel; direction: 'incoming' | 'outgoing' } {
  const fromLower = from.toLowerCase()
  const toLower = to.toLowerCase()
  const walletLower = agentWallet.toLowerCase()

  const isIncoming = toLower === walletLower
  const direction = isIncoming ? 'incoming' as const : 'outgoing' as const

  // Outgoing to wrapper contract = registration fee
  if (!isIncoming && toLower === WRAPPER) {
    return { label: 'registration_fee', direction }
  }

  // Outgoing to identity registry = registration
  if (!isIncoming && toLower === IDENTITY) {
    return { label: 'registration_fee', direction }
  }

  // Outgoing to reputation registry = feedback fee
  if (!isIncoming && toLower === REPUTATION) {
    return { label: 'feedback_fee', direction }
  }

  // Incoming = revenue
  if (isIncoming) {
    return { label: 'revenue', direction }
  }

  // Check input data for known patterns (LLM API calls, etc.)
  if (inputData && inputData.length > 10) {
    return { label: 'cost_of_sales', direction }
  }

  // Default outgoing = SGA expense
  return { label: 'sga_expense', direction }
}
