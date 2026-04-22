import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { getCompany } from '@/lib/db'
import {
  insertCompanyTaxRateOverride,
  listCompanyTaxRates,
  resolveTaxRate,
} from '@/lib/tax-rates'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

/**
 * GET /api/v1/companies/:companyId/tax-rates?asOf=YYYY-MM-DD
 *
 * Returns the applicable tax rate at `asOf` (default today), plus the full
 * history for this company. Every row carries source + sourceRef provenance.
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { companyId } = await params
  const asOfParam = req.nextUrl.searchParams.get('asOf')
  const asOf = asOfParam ? new Date(asOfParam) : new Date()

  const company = await getCompany(companyId)
  if (!company) {
    return NextResponse.json(
      { error: 'Company not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }
  if (!company.jurisdiction_code) {
    return NextResponse.json(
      {
        error:
          'Company metadata missing jurisdictionCode; cannot resolve statutory rate.',
        code: 'NO_JURISDICTION',
      },
      { status: 400 },
    )
  }

  const [resolved, history] = await Promise.all([
    resolveTaxRate({
      companyId,
      jurisdictionCode: company.jurisdiction_code,
      asOf,
    }),
    listCompanyTaxRates(companyId),
  ])

  return NextResponse.json({
    companyId,
    jurisdictionCode: company.jurisdiction_code,
    asOf: asOf.toISOString().slice(0, 10),
    resolved,
    history,
  })
}

const postBodySchema = z.object({
  rate: z.number().min(0).max(1),
  rateType: z.enum(['effective', 'override']),
  source: z.enum(['company_filing', 'cfo_attested']),
  sourceRef: z.string().min(1).max(2048),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effectiveTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  submittedBy: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

/**
 * POST /api/v1/companies/:companyId/tax-rates
 *
 * Records a company-scoped effective rate or override. Requires the caller
 * to supply a sourceRef (URL / IPFS hash) pointing to the supporting tax
 * filing or CFO attestation — we store it as-is and never invent a rate.
 *
 * Authorization: the `submittedBy` wallet MUST be the current on-chain owner
 * of the company (verified against companies.owner_address). Off-chain-only
 * check for now; stronger auth (signed message) comes in a follow-up.
 */
export async function POST(
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

  const parsed = postBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', code: 'VALIDATION', details: parsed.error.format() },
      { status: 400 },
    )
  }

  const company = await getCompany(companyId)
  if (!company) {
    return NextResponse.json(
      { error: 'Company not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }
  if (!company.jurisdiction_code) {
    return NextResponse.json(
      {
        error: 'Company must have jurisdictionCode in metadata first',
        code: 'NO_JURISDICTION',
      },
      { status: 400 },
    )
  }
  if (parsed.data.submittedBy.toLowerCase() !== company.owner_address.toLowerCase()) {
    return NextResponse.json(
      {
        error: 'submittedBy must match the current company owner',
        code: 'FORBIDDEN',
      },
      { status: 403 },
    )
  }

  await insertCompanyTaxRateOverride({
    companyId,
    jurisdictionCode: company.jurisdiction_code,
    rate: parsed.data.rate,
    rateType: parsed.data.rateType,
    source: parsed.data.source,
    sourceRef: parsed.data.sourceRef,
    effectiveFrom: parsed.data.effectiveFrom,
    effectiveTo: parsed.data.effectiveTo ?? null,
    submittedBy: parsed.data.submittedBy.toLowerCase(),
  })

  return NextResponse.json({
    companyId,
    rate: parsed.data.rate,
    rateType: parsed.data.rateType,
    source: parsed.data.source,
    sourceRef: parsed.data.sourceRef,
    effectiveFrom: parsed.data.effectiveFrom,
    effectiveTo: parsed.data.effectiveTo ?? null,
  })
}
