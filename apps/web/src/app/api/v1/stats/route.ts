import { NextResponse } from 'next/server'

import { publicClient } from '@/lib/viem-client'
import {
  wrapperAbi,
  identityRegistryAbi,
  IDENTITY_REGISTRY_ADDRESS,
} from '@agent-registry/shared'

const WRAPPER_ADDRESS = (process.env.NEXT_PUBLIC_WRAPPER_ADDRESS ?? '0x') as `0x${string}`

/**
 * GET /api/v1/stats
 *
 * Returns protocol-wide statistics read from on-chain contracts.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const [registrationFee] = await Promise.all([
      publicClient
        .readContract({
          address: WRAPPER_ADDRESS,
          abi: wrapperAbi,
          functionName: 'registrationFee',
        })
        .catch(() => BigInt(0)),
    ])

    // Count agents by iterating until we hit a non-existent token
    let totalAgents = 0
    for (let i = 1; i <= 1000; i++) {
      try {
        await publicClient.readContract({
          address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
          abi: identityRegistryAbi,
          functionName: 'ownerOf',
          args: [BigInt(i)],
        })
        totalAgents++
      } catch {
        break
      }
    }

    return NextResponse.json({
      totalAgents,
      registrationFee: (registrationFee as bigint).toString(),
      network: 'base-sepolia',
      chainId: 84532,
      contracts: {
        identityRegistry: IDENTITY_REGISTRY_ADDRESS,
        wrapper: WRAPPER_ADDRESS,
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
