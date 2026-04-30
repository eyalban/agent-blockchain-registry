import { NextResponse } from 'next/server'

import { sql } from '@/lib/db'
import { publicClient } from '@/lib/viem-client'
import {
  identityRegistryAbi,
  wrapperAbi,
  IDENTITY_REGISTRY_ADDRESS,
} from '@agent-registry/shared'

const WRAPPER_ADDRESS = (process.env.NEXT_PUBLIC_WRAPPER_ADDRESS ?? '0x') as `0x${string}`
const CHAIN_ID = 84532

interface RouteParams {
  params: Promise<{ agentId: string }>
}

interface AgentCacheRow {
  agent_id: string
  owner_address: string
  token_uri: string | null
  name: string | null
  description: string | null
  image: string | null
}

async function readAgentFromCache(agentId: string): Promise<AgentCacheRow | null> {
  const rows = (await sql`
    SELECT agent_id, owner_address, token_uri, name, description, image
    FROM agents_cache
    WHERE agent_id = ${agentId} AND chain_id = ${CHAIN_ID}
    LIMIT 1
  `) as AgentCacheRow[]
  return rows[0] ?? null
}

/**
 * GET /api/v1/agents/:agentId
 *
 * Returns full agent details. Reads on-chain identity + token URI first,
 * and falls back to the `agents_cache` mirror when the on-chain read
 * fails (RPC error, agent not yet on chain, etc.). The cache row is the
 * source of truth for display name when on-chain metadata is missing or
 * unparseable.
 */
export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { agentId } = await params

  // Try on-chain first.
  let owner: string | null = null
  let tokenURI: string | null = null
  let tags: string[] = []
  let onChainError: string | null = null
  try {
    const id = BigInt(agentId)
    const [ownerRes, uriRes, tagsRes] = await Promise.all([
      publicClient.readContract({
        address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
        abi: identityRegistryAbi,
        functionName: 'ownerOf',
        args: [id],
      }),
      publicClient.readContract({
        address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
        abi: identityRegistryAbi,
        functionName: 'tokenURI',
        args: [id],
      }),
      publicClient
        .readContract({
          address: WRAPPER_ADDRESS,
          abi: wrapperAbi,
          functionName: 'agentTags',
          args: [id],
        })
        .catch(() => [] as string[]),
    ])
    owner = ownerRes as string
    tokenURI = uriRes as string
    tags = tagsRes as string[]
  } catch (e) {
    onChainError = e instanceof Error ? e.message : 'Unknown error'
  }

  // Parse the agent card from a data URI when available.
  let card: Record<string, unknown> | null = null
  if (tokenURI && tokenURI.startsWith('data:application/json;base64,')) {
    try {
      const json = Buffer.from(tokenURI.split(',')[1] ?? '', 'base64').toString()
      card = JSON.parse(json) as Record<string, unknown>
    } catch {
      // Invalid JSON — fall through to cache fallback below.
    }
  }

  // Fall back to the cache row. Use it both when the on-chain read
  // failed entirely AND when the on-chain card is missing a name (e.g.
  // tokenURI points to IPFS we couldn't fetch in time).
  const cached = await readAgentFromCache(agentId)
  if (!owner && !cached) {
    if (onChainError && (onChainError.includes('nonexistent token') || onChainError.includes('invalid token'))) {
      return NextResponse.json(
        { error: 'Agent not found', code: 'NOT_FOUND' },
        { status: 404 },
      )
    }
    return NextResponse.json(
      { error: onChainError ?? 'Agent not found', code: onChainError ? 'INTERNAL_ERROR' : 'NOT_FOUND' },
      { status: onChainError ? 500 : 404 },
    )
  }

  // Merge: on-chain wins when present, cache fills gaps.
  const cardName =
    card && typeof card.name === 'string' ? (card.name as string) : null
  const cardDescription =
    card && typeof card.description === 'string'
      ? (card.description as string)
      : null
  const mergedCard: Record<string, unknown> = {
    ...(card ?? {}),
    name: cardName ?? cached?.name ?? null,
    description: cardDescription ?? cached?.description ?? null,
  }

  return NextResponse.json({
    agentId,
    owner: owner ?? cached?.owner_address ?? null,
    tokenURI: tokenURI ?? cached?.token_uri ?? null,
    tags,
    card: mergedCard,
    source: owner ? (card ? 'on_chain' : 'on_chain_with_cache_fallback') : 'cache',
  })
}
