import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import {
  companyRegistryAbi,
  identityRegistryAbi,
  IDENTITY_REGISTRY_ADDRESS,
} from '@agent-registry/shared'

import {
  getCompany,
  listActiveCompanyMembers,
  listActiveCompanyTreasuries,
  sql,
  updateCompanyMetadataMirror,
} from '@/lib/db'
import { env } from '@/lib/env'
import {
  EventVerificationError,
  errorToResponse,
  verifyTxEvent,
} from '@/lib/event-verify'
import { fetchJsonMetadata, parseCompanyMetadata } from '@/lib/ipfs-fetch'
import { publicClient } from '@/lib/viem-client'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { companyId } = await params
  const company = await getCompany(companyId)
  if (!company) {
    return NextResponse.json(
      { error: 'Company not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  const [members, treasuries, cacheNameRowsRaw] = await Promise.all([
    listActiveCompanyMembers(companyId),
    listActiveCompanyTreasuries(companyId),
    sql`
      SELECT agent_id, name
      FROM agents_cache
      WHERE chain_id = ${company.chain_id}
    `,
  ])
  const cacheNameRows = cacheNameRowsRaw as unknown as Array<{
    agent_id: string
    name: string | null
  }>

  // Resolve each member's display name. Cache-first: the agents_cache
  // mirror is populated at registration and is the cheapest read.
  // Only fall through to an on-chain tokenURI fetch (which is a network
  // round-trip plus an IPFS resolve) when the cache has no name. That
  // turns a 30-member listing from ~30 RPC calls into ~0 in the common
  // case and at most N for newly-indexed agents.
  const cachedNameByAgent = new Map(
    cacheNameRows.map((r) => [r.agent_id, r.name]),
  )
  const memberNames = await Promise.all(
    members.map(async (m): Promise<string | null> => {
      const cached = cachedNameByAgent.get(m.agent_id)
      if (cached) return cached
      try {
        const tokenURI = (await publicClient.readContract({
          address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
          abi: identityRegistryAbi,
          functionName: 'tokenURI',
          args: [BigInt(m.agent_id)],
        })) as string
        const meta = await fetchJsonMetadata<{ name?: unknown }>(tokenURI)
        if (meta && typeof meta.name === 'string') return meta.name
      } catch {
        // fall through to null
      }
      return null
    }),
  )

  return NextResponse.json({
    companyId: company.company_id,
    chainId: company.chain_id,
    founderAddress: company.founder_address,
    ownerAddress: company.owner_address,
    metadataURI: company.metadata_uri,
    name: company.name,
    description: company.description,
    logoURL: company.logo_url,
    jurisdictionCode: company.jurisdiction_code,
    createdTxHash: company.created_tx_hash,
    createdBlock: company.created_block,
    createdAt: company.created_at,
    members: members.map((m, i) => ({
      agentId: m.agent_id,
      name: memberNames[i],
      addedAt: m.added_at,
      addedTxHash: m.added_tx_hash,
    })),
    treasuries: treasuries.map((t) => ({
      address: t.address,
      label: t.label,
      addedAt: t.added_at,
    })),
  })
}

const patchBodySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
})

/**
 * PATCH /api/v1/companies/:companyId
 * Body: { txHash } — the tx that called updateCompanyMetadata.
 */
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { companyId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body must be JSON', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  const parsed = patchBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  try {
    const verified = await verifyTxEvent({
      txHash: parsed.data.txHash as `0x${string}`,
      contractAddress: env.companyRegistryAddress,
      abi: companyRegistryAbi,
      eventName: 'CompanyMetadataUpdated',
    })

    const eventCompanyId = String(verified.args.companyId as bigint)
    if (eventCompanyId !== companyId) {
      return NextResponse.json(
        { error: 'Event companyId does not match path', code: 'MISMATCH' },
        { status: 400 },
      )
    }

    const metadataURI = verified.args.metadataURI as string
    const metadata = await fetchJsonMetadata(metadataURI)
    const parsedMeta = parseCompanyMetadata(metadata)

    await updateCompanyMetadataMirror(companyId, metadataURI, parsedMeta)

    return NextResponse.json({ companyId, metadataURI, ...parsedMeta })
  } catch (err) {
    if (err instanceof EventVerificationError) {
      const { status, body } = errorToResponse(err)
      return NextResponse.json(body, { status })
    }
    console.error('company PATCH error', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL' },
      { status: 500 },
    )
  }
}
