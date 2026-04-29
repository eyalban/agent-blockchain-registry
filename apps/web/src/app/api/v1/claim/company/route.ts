import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import {
  attributeWalletViaClaim,
  extractBearer,
  resolveBearerKey,
} from '@/lib/claim-keys'
import { getCompany } from '@/lib/db'

const bodySchema = z.object({
  companyId: z.string().regex(/^\d+$/),
})

/**
 * POST /api/v1/claim/company
 *
 * Headers: Authorization: Bearer <claim key>
 * Body:    { companyId }
 *
 * Used after an agent calls CompanyRegistry.createCompany on the
 * user's behalf (Path B / C in the framework README). The agent's own
 * wallet becomes the company's owner_address on-chain — calling this
 * endpoint with the user's claim key writes that wallet into
 * user_wallets, which transitively gives the user access to the
 * company in their workspace.
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

  const company = await getCompany(parsed.data.companyId)
  if (!company) {
    return NextResponse.json(
      { error: 'Company not found', code: 'COMPANY_NOT_FOUND' },
      { status: 404 },
    )
  }

  const linked = await attributeWalletViaClaim(
    key.userId,
    company.owner_address,
    key.keyPrefix,
    `company ${parsed.data.companyId}`,
  )
  if (!linked.ok) {
    return NextResponse.json(
      {
        error:
          "That company's owner wallet is already linked to a different statem8 account.",
        code: linked.code,
      },
      { status: 409 },
    )
  }

  return NextResponse.json({
    ok: true,
    companyId: parsed.data.companyId,
    walletAddress: company.owner_address,
  })
}
