import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import {
  SUPPORTED_TOKENS,
  getTokenByAddress,
  invoiceRegistryAbi,
} from '@agent-registry/shared'

import {
  findCompanyByWallet,
  getAgentByWallet,
  insertInvoice,
  listInvoicesByParty,
} from '@/lib/db'
import { env } from '@/lib/env'
import {
  EventVerificationError,
  errorToResponse,
  verifyTxEvent,
} from '@/lib/event-verify'
import { getTokenPriceUSD } from '@/lib/price-oracle'
import { publicClient } from '@/lib/viem-client'

const postBodySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
})

/**
 * GET /api/v1/invoices?issuer=|payer=|companyId=|status=
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams
  const rows = await listInvoicesByParty({
    issuerAddress: sp.get('issuer') ?? undefined,
    payerAddress: sp.get('payer') ?? undefined,
    companyId: sp.get('companyId') ?? undefined,
    status: sp.get('status') ?? undefined,
    limit: Math.min(500, Math.max(1, Number(sp.get('limit') ?? 100))),
  })
  return NextResponse.json({
    data: rows.map((r) => ({
      invoiceId: r.invoice_id,
      chainId: r.chain_id,
      issuerAddress: r.issuer_address,
      payerAddress: r.payer_address,
      issuerCompanyId: r.issuer_company_id,
      payerCompanyId: r.payer_company_id,
      issuerAgentId: r.issuer_agent_id,
      payerAgentId: r.payer_agent_id,
      tokenAddress: r.token_address,
      tokenSymbol: r.token_symbol,
      amountRaw: r.amount_raw,
      amountUsdAtIssue:
        r.amount_usd_at_issue !== null ? Number(r.amount_usd_at_issue) : null,
      usdPriceAtIssue:
        r.usd_price_at_issue !== null ? Number(r.usd_price_at_issue) : null,
      priceSource: r.price_source,
      dueBlock: r.due_block,
      memoUri: r.memo_uri,
      memoHash: r.memo_hash,
      status: r.status,
      issuedAt: r.issued_at,
      issuedBlock: r.issued_block,
      issuedTxHash: r.issued_tx_hash,
      paidAt: r.paid_at,
      paidBlock: r.paid_block,
      paidTxHash: r.paid_tx_hash,
      cancelledAt: r.cancelled_at,
      cancelledTxHash: r.cancelled_tx_hash,
    })),
    count: rows.length,
  })
}

/**
 * POST /api/v1/invoices
 * Body: { txHash } — tx that called createInvoice. Mirrors to Postgres.
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
      { error: 'Invalid body', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  try {
    const verified = await verifyTxEvent({
      txHash: parsed.data.txHash as `0x${string}`,
      contractAddress: env.invoiceRegistryAddress,
      abi: invoiceRegistryAbi,
      eventName: 'InvoiceCreated',
    })

    const args = verified.args as Record<string, unknown>
    const invoiceId = String(args.id as bigint)
    const issuer = (args.issuer as string).toLowerCase()
    const payer = (args.payer as string).toLowerCase()
    const tokenAddrRaw = args.token as string
    const tokenAddress =
      tokenAddrRaw && tokenAddrRaw !== '0x0000000000000000000000000000000000000000'
        ? tokenAddrRaw.toLowerCase()
        : null
    const amountRaw = (args.amount as bigint).toString()
    const issuerCompanyIdNum = BigInt(args.issuerCompanyId as bigint | number)
    const payerCompanyIdNum = BigInt(args.payerCompanyId as bigint | number)
    const dueBlockNum = Number(args.dueBlock as bigint)
    const memoURI = args.memoURI as string
    const memoHash = args.memoHash as string

    // Resolve token metadata + USD snapshot at issuance block.
    const chainId = env.chainId
    const tokenInfo =
      tokenAddress === null
        ? SUPPORTED_TOKENS[chainId as keyof typeof SUPPORTED_TOKENS].ETH
        : getTokenByAddress(chainId, tokenAddress)
    if (!tokenInfo) {
      return NextResponse.json(
        {
          error: `Invoice token not whitelisted: ${tokenAddress}`,
          code: 'TOKEN_NOT_SUPPORTED',
        },
        { status: 400 },
      )
    }

    const block = await (publicClient as typeof publicClient).getBlock({
      blockNumber: BigInt(verified.blockNumber),
    })
    const blockTimestamp = new Date(Number(block.timestamp) * 1000)

    const price = await getTokenPriceUSD({
      chainId,
      token: tokenInfo,
      blockNumber: verified.blockNumber,
      blockTimestamp,
    })

    const humanAmount = Number(amountRaw) / 10 ** tokenInfo.decimals
    const amountUsd = price ? humanAmount * price.usdPrice : null

    // Resolve optional company/agent mapping for quick UI lookups.
    const issuerCompanyId =
      issuerCompanyIdNum > 0n
        ? issuerCompanyIdNum.toString()
        : await findCompanyByWallet(issuer)
    const payerCompanyId =
      payerCompanyIdNum > 0n
        ? payerCompanyIdNum.toString()
        : await findCompanyByWallet(payer)
    const issuerAgentId = await getAgentByWallet(issuer)
    const payerAgentId = await getAgentByWallet(payer)

    await insertInvoice({
      invoiceId,
      chainId,
      issuerAddress: issuer,
      payerAddress: payer,
      issuerCompanyId,
      payerCompanyId,
      issuerAgentId,
      payerAgentId,
      tokenAddress,
      tokenSymbol: tokenInfo.symbol,
      amountRaw,
      amountUsdAtIssue: amountUsd,
      usdPriceAtIssue: price?.usdPrice ?? null,
      priceSource: price?.source ?? null,
      dueBlock: dueBlockNum > 0 ? dueBlockNum : null,
      memoUri: memoURI,
      memoHash,
      issuedAt: blockTimestamp.toISOString(),
      issuedBlock: verified.blockNumber,
      issuedTxHash: parsed.data.txHash,
    })

    return NextResponse.json({
      invoiceId,
      issuerAddress: issuer,
      payerAddress: payer,
      tokenAddress,
      tokenSymbol: tokenInfo.symbol,
      amountRaw,
      amountUsdAtIssue: amountUsd,
      status: 'issued',
      issuedTxHash: parsed.data.txHash,
    })
  } catch (err) {
    if (err instanceof EventVerificationError) {
      const { status, body } = errorToResponse(err)
      return NextResponse.json(body, { status })
    }
    console.error('invoices POST error', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL' },
      { status: 500 },
    )
  }
}
