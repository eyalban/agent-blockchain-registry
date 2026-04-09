/**
 * IPFS upload via Pinata.
 * Falls back to data URI encoding if Pinata keys are not configured.
 */

const PINATA_API_URL = 'https://api.pinata.cloud'
const PINATA_API_KEY = process.env.PINATA_API_KEY ?? ''
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY ?? ''
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? 'https://gateway.pinata.cloud/ipfs/'

export const isPinataConfigured = Boolean(PINATA_API_KEY && PINATA_SECRET_KEY)

/**
 * Upload JSON to IPFS via Pinata.
 * Returns the IPFS URI (ipfs://Qm...).
 */
export async function uploadToIPFS(
  json: Record<string, unknown>,
  name: string,
): Promise<string> {
  if (!isPinataConfigured) {
    // Fallback: encode as data URI
    const encoded = Buffer.from(JSON.stringify(json)).toString('base64')
    return `data:application/json;base64,${encoded}`
  }

  const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    },
    body: JSON.stringify({
      pinataContent: json,
      pinataMetadata: { name },
    }),
  })

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.statusText}`)
  }

  const data = (await response.json()) as { IpfsHash: string }
  return `ipfs://${data.IpfsHash}`
}

/**
 * Resolve an IPFS URI to an HTTPS gateway URL.
 */
export function resolveIPFS(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return `${IPFS_GATEWAY}${uri.replace('ipfs://', '')}`
  }
  return uri
}
