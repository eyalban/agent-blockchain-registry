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

/**
 * Human-readable "time ago" for an ISO or date-like timestamp. Compact
 * format for table cells: "12s", "4m", "2h", "3d", "5mo", "2y".
 */
export function formatRelativeTime(input: string | Date | number): string {
  const d =
    typeof input === 'string' || typeof input === 'number'
      ? new Date(input)
      : input
  const diffSec = Math.max(0, (Date.now() - d.getTime()) / 1000)
  if (diffSec < 60) return `${Math.floor(diffSec)}s`
  if (diffSec < 3_600) return `${Math.floor(diffSec / 60)}m`
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3_600)}h`
  if (diffSec < 30 * 86_400) return `${Math.floor(diffSec / 86_400)}d`
  if (diffSec < 365 * 86_400) return `${Math.floor(diffSec / (30 * 86_400))}mo`
  return `${Math.floor(diffSec / (365 * 86_400))}y`
}

/**
 * Compact absolute timestamp for dense table cells. Today →"HH:MM",
 * this year → "MMM DD HH:MM", older → "YYYY-MM-DD". Local time, so
 * auditors see the instant they're used to reading.
 */
export function formatCompactDateTime(input: string | Date | number): string {
  const d =
    typeof input === 'string' || typeof input === 'number'
      ? new Date(input)
      : input
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const sameYear = d.getFullYear() === now.getFullYear()
  const hm = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  if (sameDay) return hm
  const monthDay = d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  if (sameYear) return `${monthDay} ${hm}`
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
}
