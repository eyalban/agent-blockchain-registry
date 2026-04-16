/**
 * Truncate an Ethereum address for display.
 * @example truncateAddress('0x1234...5678') => '0x1234...5678'
 */
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Format a bigint timestamp to a human-readable date string.
 */
export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Combine class names, filtering out falsy values.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Format ETH values so tiny amounts don't display as "0.000000".
 * Uses enough decimals to show at least 2 significant digits.
 */
export function formatEthValue(value: number): string {
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 0.01) return abs.toFixed(4)
  if (abs >= 0.0001) return abs.toFixed(6)
  if (abs >= 0.000001) return abs.toFixed(8)
  return abs.toExponential(2)
}
