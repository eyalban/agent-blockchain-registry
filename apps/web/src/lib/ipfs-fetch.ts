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

// In-process TTL cache. Agent metadata is content-addressed (ipfs://CID)
// or pinned, so a 5-minute window is plenty conservative. Survives across
// requests in a long-lived Node server; on serverless cold starts it just
// no-ops. Negative results cache shorter so a transient gateway hiccup
// doesn't poison the listing for 5 minutes.
const POSITIVE_TTL_MS = 5 * 60_000
const NEGATIVE_TTL_MS = 15_000
const MAX_ENTRIES = 1000

interface CacheEntry {
  readonly value: unknown
  readonly expiresAt: number
}
const metadataCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<unknown>>()

function setCache(key: string, value: unknown, ttlMs: number): void {
  if (metadataCache.size >= MAX_ENTRIES) {
    const oldest = metadataCache.keys().next().value
    if (oldest !== undefined) metadataCache.delete(oldest)
  }
  metadataCache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export async function fetchJsonMetadata<T = unknown>(
  uri: string,
  timeoutMs = 4_000,
): Promise<T | null> {
  const cached = metadataCache.get(uri)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T | null
  }

  // Coalesce concurrent fetches for the same URI so a burst of agents
  // sharing metadata only round-trips once.
  const existing = inflight.get(uri)
  if (existing) return existing as Promise<T | null>

  const url = resolveUri(uri)
  const promise = (async (): Promise<T | null> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) {
        setCache(uri, null, NEGATIVE_TTL_MS)
        return null
      }
      const json = (await res.json()) as T
      setCache(uri, json, POSITIVE_TTL_MS)
      return json
    } catch {
      setCache(uri, null, NEGATIVE_TTL_MS)
      return null
    } finally {
      clearTimeout(timeout)
      inflight.delete(uri)
    }
  })()
  inflight.set(uri, promise)
  return promise
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
