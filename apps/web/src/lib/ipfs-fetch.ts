/**
 * IPFS/https metadata fetch helper for company + invoice memos.
 * Resolves `ipfs://` URIs through the configured gateway and parses JSON.
 */

import { IPFS_GATEWAY } from '@agent-registry/shared'

export interface CompanyMetadata {
  name?: string
  description?: string
  logoURL?: string
  jurisdictionCode?: string
}

function resolveUri(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return `${IPFS_GATEWAY}${uri.slice(7)}`
  }
  return uri
}

export async function fetchJsonMetadata<T = unknown>(
  uri: string,
  timeoutMs = 10_000,
): Promise<T | null> {
  const url = resolveUri(uri)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export function parseCompanyMetadata(raw: unknown): {
  name: string | null
  description: string | null
  logoURL: string | null
  jurisdictionCode: string | null
} {
  const obj = (raw ?? {}) as CompanyMetadata
  return {
    name: typeof obj.name === 'string' ? obj.name : null,
    description: typeof obj.description === 'string' ? obj.description : null,
    logoURL: typeof obj.logoURL === 'string' ? obj.logoURL : null,
    jurisdictionCode:
      typeof obj.jurisdictionCode === 'string' ? obj.jurisdictionCode : null,
  }
}
