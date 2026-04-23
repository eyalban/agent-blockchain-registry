/**
 * Transaction fetching - placeholder for BaseScan V2.
 * In production, use BaseScan API with an API key.
 * For now, agents report transactions directly via POST /transactions/sync.
 */

export interface SimpleTx {
  hash: string
  from: string
  to: string
  value: string
  blockNumber: string
  timeStamp: string
  gasUsed: string
  gasPrice: string
  input: string
  isError: string
}

export async function fetchTransactions(): Promise<SimpleTx[]> {
  // BaseScan V1 deprecated, V2 requires API key.
  // Agents report their transactions directly via the sync API.
  return []
}
