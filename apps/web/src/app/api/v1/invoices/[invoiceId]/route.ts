import { NextResponse, type NextRequest } from 'next/server'

import { getInvoice } from '@/lib/db'

interface RouteParams {
  params: Promise<{ invoiceId: string }>
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { invoiceId } = await params
  const row = await getInvoice(invoiceId)
  if (!row) {
    return NextResponse.json(
      { error: 'Invoice not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }
  return NextResponse.json({
    invoiceId: row.invoice_id,
    chainId: row.chain_id,
    issuerAddress: row.issuer_address,
    payerAddress: row.payer_address,
    issuerCompanyId: row.issuer_company_id,
    payerCompanyId: row.payer_company_id,
    issuerAgentId: row.issuer_agent_id,
    payerAgentId: row.payer_agent_id,
    tokenAddress: row.token_address,
    tokenSymbol: row.token_symbol,
    amountRaw: row.amount_raw,
    amountUsdAtIssue:
      row.amount_usd_at_issue !== null ? Number(row.amount_usd_at_issue) : null,
    priceSource: row.price_source,
    dueBlock: row.due_block,
    memoUri: row.memo_uri,
    memoHash: row.memo_hash,
    status: row.status,
    issuedAt: row.issued_at,
    issuedTxHash: row.issued_tx_hash,
    paidAt: row.paid_at,
    paidTxHash: row.paid_tx_hash,
    cancelledAt: row.cancelled_at,
    cancelledTxHash: row.cancelled_tx_hash,
  })
}
