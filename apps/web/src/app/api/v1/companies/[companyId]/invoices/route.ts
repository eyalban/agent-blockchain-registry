import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/auth'
import { getCompany, listInvoicesByParty } from '@/lib/db'
import { userOwnsAddress } from '@/lib/workspace'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

/**
 * GET /api/v1/companies/:id/invoices
 *
 * Owner-only — even with the URL, only a signed-in user with a verified
 * wallet matching the company's owner_address can read its invoice
 * stream. The page-level UI also hides the Invoices tab from non-owners,
 * but the API enforces the same rule independently.
 */
export async function GET(
  _req: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { companyId } = await params
  if (!/^\d+$/.test(companyId)) {
    return NextResponse.json(
      { error: 'Invalid company id', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Not signed in', code: 'UNAUTHENTICATED' },
      { status: 401 },
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
          "Only a verified wallet matching the company's owner can view its invoices.",
        code: 'FORBIDDEN',
      },
      { status: 403 },
    )
  }

  const rows = await listInvoicesByParty({ companyId, limit: 200 })

  const data = rows.map((r) => {
    const direction: 'incoming' | 'outgoing' =
      r.issuer_company_id === companyId ? 'outgoing' : 'incoming'
    return {
      invoiceId: r.invoice_id,
      direction,
      issuerAddress: r.issuer_address,
      payerAddress: r.payer_address,
      issuerCompanyId: r.issuer_company_id,
      payerCompanyId: r.payer_company_id,
      tokenSymbol: r.token_symbol,
      amountRaw: r.amount_raw,
      amountUsdAtIssue:
        r.amount_usd_at_issue === null ? null : Number(r.amount_usd_at_issue),
      status: r.status,
      issuedAt: r.issued_at,
      issuedTxHash: r.issued_tx_hash,
      paidAt: r.paid_at,
      paidTxHash: r.paid_tx_hash,
    }
  })

  return NextResponse.json({ data })
}
