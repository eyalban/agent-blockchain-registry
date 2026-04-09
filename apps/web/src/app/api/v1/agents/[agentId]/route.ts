import { NextResponse } from 'next/server'

import { publicClient } from '@/lib/viem-client'
import {
  identityRegistryAbi,
  wrapperAbi,
  IDENTITY_REGISTRY_ADDRESS,
} from '@agent-registry/shared'

const WRAPPER_ADDRESS = (process.env.NEXT_PUBLIC_WRAPPER_ADDRESS ?? '0x') as `0x${string}`

interface RouteParams {
  params: Promise<{ agentId: string }>
}

/**
 * GET /api/v1/agents/:agentId
 *
 * Returns full agent details including on-chain data and parsed agent card.
 */
export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { agentId } = await params
    const id = BigInt(agentId)

    const [owner, tokenURI, tags] = await Promise.all([
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

    // Parse agent card from data URI
    let card: Record<string, unknown> | null = null
    const uri = tokenURI as string
    if (uri.startsWith('data:application/json;base64,')) {
      try {
        const json = Buffer.from(uri.split(',')[1] ?? '', 'base64').toString()
        card = JSON.parse(json) as Record<string, unknown>
      } catch {
        // Invalid JSON
      }
    }

    return NextResponse.json({
      agentId: agentId,
      owner: owner as string,
      tokenURI: uri,
      tags: tags as string[],
      card,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'

    if (message.includes('nonexistent token') || message.includes('invalid token')) {
      return NextResponse.json(
        { error: 'Agent not found', code: 'NOT_FOUND' },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
