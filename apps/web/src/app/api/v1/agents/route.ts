import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { publicClient } from '@/lib/viem-client'
import { identityRegistryAbi, IDENTITY_REGISTRY_ADDRESS } from '@agent-registry/shared'

/**
 * GET /api/v1/agents?page=1&pageSize=20
 *
 * Lists agents that have linked wallets in our database (real agents only).
 * Enriches with on-chain data (tokenURI, owner) from the Identity Registry.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? '20')))
    const offset = (page - 1) * pageSize

    // Get distinct agent IDs from our wallet dictionary
    const rows = await sql`
      SELECT DISTINCT agent_id FROM agent_wallets
      ORDER BY agent_id
      LIMIT ${pageSize} OFFSET ${offset}
    `

    const agents: Array<{
      agentId: string
      owner: string
      tokenURI: string
      wallets: string[]
    }> = []

    for (const row of rows) {
      const agentId = (row as { agent_id: string }).agent_id
      try {
        const [owner, tokenURI, walletRows] = await Promise.all([
          publicClient.readContract({
            address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
            abi: identityRegistryAbi,
            functionName: 'ownerOf',
            args: [BigInt(agentId)],
          }),
          publicClient.readContract({
            address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
            abi: identityRegistryAbi,
            functionName: 'tokenURI',
            args: [BigInt(agentId)],
          }),
          sql`SELECT wallet_address FROM agent_wallets WHERE agent_id = ${agentId}`,
        ])

        agents.push({
          agentId,
          owner: owner as string,
          tokenURI: tokenURI as string,
          wallets: (walletRows as Array<{ wallet_address: string }>).map(w => w.wallet_address),
        })
      } catch {
        // Agent may not exist on-chain anymore
      }
    }

    const countRows = await sql`SELECT COUNT(DISTINCT agent_id) as count FROM agent_wallets`
    const total = Number((countRows[0] as { count: string }).count)

    return NextResponse.json({
      data: agents,
      page,
      pageSize,
      total,
      hasMore: offset + agents.length < total,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
