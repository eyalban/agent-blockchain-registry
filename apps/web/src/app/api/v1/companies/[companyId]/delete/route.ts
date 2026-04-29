import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/auth'
import { getCompany, sql } from '@/lib/db'
import { userOwnsAddress } from '@/lib/workspace'

const bodySchema = z.object({
  confirmName: z.string().min(1).max(256),
})

interface RouteParams {
  params: Promise<{ companyId: string }>
}

/**
 * POST /api/v1/companies/:id/delete
 *
 * Soft-deletes the company from the platform's mirror tables. The
 * on-chain CompanyRegistry record is immutable and we do not touch it
 * — the agent NFTs that were members remain on chain and stay in the
 * registry. From the app's perspective the company simply disappears
 * (off the listings, off the workspace, off the leaderboards).
 *
 * Authorization. Requires:
 *   - a signed-in user, AND
 *   - that user has a VERIFIED wallet matching the company's
 *     owner_address, AND
 *   - the request body's `confirmName` matches the company's name
 *     exactly (case-insensitive trim — humans typing into a modal).
 *
 * The `companies` row is deleted; FK CASCADEs handle company_members,
 * company_treasuries, off_chain_costs, capital_contributions. Tax
 * overrides scoped to this company are cleared explicitly. Invoices
 * and transactions keep their company_id values as dangling refs (no
 * FK constraint) — the on-chain facts they record don't change just
 * because the company mirror is gone.
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Not signed in', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }

  const { companyId } = await params
  if (!/^\d+$/.test(companyId)) {
    return NextResponse.json(
      { error: 'Invalid company id', code: 'VALIDATION' },
      { status: 400 },
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

  const company = await getCompany(companyId)
  if (!company) {
    return NextResponse.json(
      { error: 'Company not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  const ownsOwnerAddress = await userOwnsAddress(user.id, company.owner_address)
  if (!ownsOwnerAddress) {
    return NextResponse.json(
      {
        error:
          "Only a verified wallet matching the company's owner can delete it.",
        code: 'FORBIDDEN',
      },
      { status: 403 },
    )
  }

  const expected = (company.name ?? '').trim().toLowerCase()
  const submitted = parsed.data.confirmName.trim().toLowerCase()
  if (!expected || expected !== submitted) {
    return NextResponse.json(
      {
        error:
          'Confirmation does not match the company name. Type the name exactly.',
        code: 'NAME_MISMATCH',
      },
      { status: 400 },
    )
  }

  // Tax overrides: there is no FK, so cascade won't reach them. Clean
  // up any company-scoped rows so they don't dangle.
  await sql`DELETE FROM tax_rates WHERE company_id = ${companyId}`

  // Cascades: company_members, company_treasuries, off_chain_costs,
  // capital_contributions. invoices.issuer_company_id /
  // payer_company_id are TEXT without FK and stay as dangling refs by
  // design.
  const deleted = (await sql`
    DELETE FROM companies WHERE company_id = ${companyId}
    RETURNING company_id
  `) as Array<{ company_id: string }>

  if (deleted.length === 0) {
    return NextResponse.json(
      { error: 'Company already gone', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  return NextResponse.json({ ok: true, companyId })
}
