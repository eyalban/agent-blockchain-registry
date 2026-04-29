import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { identityRegistryAbi, IDENTITY_REGISTRY_ADDRESS } from '@agent-registry/shared'

import {
  attributeWalletViaClaim,
  extractBearer,
  resolveBearerKey,
} from '@/lib/claim-keys'
import { publicClient } from '@/lib/viem-client'

const bodySchema = z.object({
  agentId: z.string().regex(/^\d+$/),
})

/**
 * POST /api/v1/claim/agent
 *
 * Headers: Authorization: Bearer <claim key>
 * Body:    { agentId }
 *
 * The agent calls this once to attribute itself to the user who issued
 * the claim key. We resolve the on-chain owner via
 * IdentityRegistry.ownerOf(agentId) and write that address into the
 * user's verified-wallets list. The existing transitive query in
 * lib/workspace.ts then surfaces the agent + any company it's a
 * member of + every invoice it's a party to.
 *
 * Possession of the key is authority — the user is expected to share
 * it only with agents they control.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const bearer = extractBearer(req.headers.get('authorization'))
  if (!bearer) {
    return NextResponse.json(
      { error: 'Missing bearer token', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  const key = await resolveBearerKey(bearer)
  if (!key) {
    return NextResponse.json(
      { error: 'Invalid or revoked claim key', code: 'INVALID_KEY' },
      { status: 401 },
    )
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body must be JSON', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  let owner: string
  try {
    const result = await publicClient.readContract({
      address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
      abi: identityRegistryAbi,
      functionName: 'ownerOf',
      args: [BigInt(parsed.data.agentId)],
    })
    owner = (result as string).toLowerCase()
  } catch {
    return NextResponse.json(
      { error: 'Agent not found on-chain', code: 'AGENT_NOT_FOUND' },
      { status: 404 },
    )
  }

  const linked = await attributeWalletViaClaim(
    key.userId,
    owner,
    key.keyPrefix,
    `agent ${parsed.data.agentId}`,
  )
  if (!linked.ok) {
    return NextResponse.json(
      {
        error:
          'That agent\'s wallet is already linked to a different statem8 account.',
        code: linked.code,
      },
      { status: 409 },
    )
  }

  return NextResponse.json({
    ok: true,
    agentId: parsed.data.agentId,
    walletAddress: owner,
  })
}
