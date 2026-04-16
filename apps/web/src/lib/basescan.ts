/**
 * BaseScan API client for fetching transaction history.
 * Free tier: 5 calls/sec, no API key needed for basic endpoints on testnet.
 */

const BASE_SEPOLIA_API = 'https://api-sepolia.basescan.org/api'

interface BaseScanTx {
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

/**
 * Fetch all normal transactions for an address from BaseScan.
 */
export async function fetchTransactions(
  address: string,
): Promise<BaseScanTx[]> {
  const url = `${BASE_SEPOLIA_API}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`

  const res = await fetch(url)
  if (!res.ok) return []

  const data = (await res.json()) as {
    status: string
    result: BaseScanTx[] | string
  }

  if (data.status !== '1' || !Array.isArray(data.result)) return []
  return data.result
}
