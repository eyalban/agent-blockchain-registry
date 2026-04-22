import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { companyRegistryAbi } from '@agent-registry/shared'

import {
  getCompany,
  listActiveCompanyMembers,
  listActiveCompanyTreasuries,
  updateCompanyMetadataMirror,
} from '@/lib/db'
import { env } from '@/lib/env'
import {
  EventVerificationError,
  errorToResponse,
  verifyTxEvent,
} from '@/lib/event-verify'
import { fetchJsonMetadata, parseCompanyMetadata } from '@/lib/ipfs-fetch'

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

  const [members, treasuries] = await Promise.all([
    listActiveCompanyMembers(companyId),
    listActiveCompanyTreasuries(companyId),
  ])

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
    members: members.map((m) => ({
      agentId: m.agent_id,
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
