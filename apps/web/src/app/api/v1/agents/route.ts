import { NextResponse } from 'next/server'

import { publicClient } from '@/lib/viem-client'
import { identityRegistryAbi, IDENTITY_REGISTRY_ADDRESS } from '@agent-registry/shared'

/**
 * GET /api/v1/agents?page=1&pageSize=20
 *
 * Lists registered agents by reading from the canonical Identity Registry.
 * Returns agent IDs, owners, and tokenURIs.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? '20')))

    // For now, iterate through agent IDs starting from 1
    // In production, this would query the subgraph for indexed data
    const agents: Array<{
      agentId: string
      owner: string
      tokenURI: string
    }> = []

    const start = (page - 1) * pageSize + 1
    const end = start + pageSize

    for (let i = start; i < end; i++) {
      try {
        const [owner, tokenURI] = await Promise.all([
          publicClient.readContract({
            address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
            abi: identityRegistryAbi,
            functionName: 'ownerOf',
            args: [BigInt(i)],
          }),
          publicClient.readContract({
            address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
            abi: identityRegistryAbi,
            functionName: 'tokenURI',
            args: [BigInt(i)],
          }),
        ])

        agents.push({
          agentId: i.toString(),
          owner: owner as string,
          tokenURI: tokenURI as string,
        })
      } catch {
        // Agent ID doesn't exist — we've reached the end
        break
      }
    }

    return NextResponse.json({
      data: agents,
      page,
      pageSize,
      hasMore: agents.length === pageSize,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
