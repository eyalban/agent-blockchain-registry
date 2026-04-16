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
