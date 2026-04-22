import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { companyRegistryAbi } from '@agent-registry/shared'

import { insertCompany, listCompanies } from '@/lib/db'
import { env } from '@/lib/env'
import {
  EventVerificationError,
  errorToResponse,
  verifyTxEvent,
} from '@/lib/event-verify'
import { fetchJsonMetadata, parseCompanyMetadata } from '@/lib/ipfs-fetch'

/**
 * GET /api/v1/companies — list companies with pagination.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? '20')
  const offsetParam = Number(req.nextUrl.searchParams.get('offset') ?? '0')
  const limit = Math.min(100, Math.max(1, limitParam))
  const offset = Math.max(0, offsetParam)

  const { rows, total } = await listCompanies(limit, offset)

  return NextResponse.json({
    data: rows.map((r) => ({
      companyId: r.company_id,
      chainId: r.chain_id,
      founderAddress: r.founder_address,
      ownerAddress: r.owner_address,
      metadataURI: r.metadata_uri,
      name: r.name,
      description: r.description,
      logoURL: r.logo_url,
      jurisdictionCode: r.jurisdiction_code,
      createdTxHash: r.created_tx_hash,
      createdBlock: r.created_block,
      createdAt: r.created_at,
    })),
    total,
    limit,
    offset,
  })
}

const postBodySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
})

/**
 * POST /api/v1/companies
 * Body: { txHash } — the tx that called CompanyRegistry.createCompany.
 * Server verifies the CompanyCreated event + mirrors to Postgres.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body must be JSON', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  const parsed = postBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', code: 'VALIDATION', details: parsed.error.format() },
      { status: 400 },
    )
  }

  try {
    const verified = await verifyTxEvent({
      txHash: parsed.data.txHash as `0x${string}`,
      contractAddress: env.companyRegistryAddress,
      abi: companyRegistryAbi,
      eventName: 'CompanyCreated',
    })

    const companyId = String(verified.args.companyId as bigint)
    const founder = (verified.args.founder as string).toLowerCase()
    const metadataURI = verified.args.metadataURI as string

    const metadata = await fetchJsonMetadata(metadataURI)
    const parsedMeta = parseCompanyMetadata(metadata)

    await insertCompany({
      companyId,
      chainId: env.chainId,
      founderAddress: founder,
      metadataURI,
      ...parsedMeta,
      createdTxHash: parsed.data.txHash,
      createdBlock: verified.blockNumber,
    })

    return NextResponse.json({
      companyId,
      founderAddress: founder,
      metadataURI,
      ...parsedMeta,
      createdTxHash: parsed.data.txHash,
      createdBlock: verified.blockNumber,
    })
  } catch (err) {
    if (err instanceof EventVerificationError) {
      const { status, body } = errorToResponse(err)
      return NextResponse.json(body, { status })
    }
    console.error('companies POST error', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL' },
      { status: 500 },
    )
  }
}
