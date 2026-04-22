import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { sql } from '@/lib/db'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

const postBodySchema = z.object({
  agentId: z.string().optional(),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum([
    'cogs_protocol_fee',
    'cogs_compute',
    'cogs_llm_api',
    'cogs_data',
    'cogs_other',
    'opex_infra',
    'opex_tooling',
    'opex_salaries',
    'opex_other',
  ]),
  description: z.string().min(1).max(512),
  amountUsd: z.number().nonnegative(),
  source: z.enum(['csv_upload', 'api_import', 'manual']).default('manual'),
  sourceRef: z.string().max(2048).optional(),
  uploadedBy: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

const bulkBodySchema = z.object({
  entries: z.array(postBodySchema).min(1).max(1000),
})

/**
 * GET /api/v1/companies/:companyId/costs?from=YYYY-MM-DD&to=YYYY-MM-DD&category=...
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { companyId } = await params
  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')
  const category = req.nextUrl.searchParams.get('category')

  const rows = (await sql`
    SELECT id::text, company_id, agent_id, occurred_at::text, category,
           description, amount_usd::text, source, source_ref,
           uploaded_by, uploaded_at::text
    FROM off_chain_costs
    WHERE company_id = ${companyId}
      AND (${from}::text IS NULL OR occurred_at >= ${from}::date)
      AND (${to}::text IS NULL OR occurred_at <= ${to}::date)
      AND (${category}::text IS NULL OR category = ${category})
    ORDER BY occurred_at DESC, id DESC
    LIMIT 1000
  `) as Array<{
    id: string
    company_id: string
    agent_id: string | null
    occurred_at: string
    category: string
    description: string
    amount_usd: string
    source: string
    source_ref: string | null
    uploaded_by: string
    uploaded_at: string
  }>

  return NextResponse.json({
    companyId,
    entries: rows.map((r) => ({
      id: r.id,
      agentId: r.agent_id,
      occurredAt: r.occurred_at,
      category: r.category,
      description: r.description,
      amountUsd: Number(r.amount_usd),
      source: r.source,
      sourceRef: r.source_ref,
      uploadedBy: r.uploaded_by,
      uploadedAt: r.uploaded_at,
    })),
  })
}

/**
 * POST /api/v1/companies/:companyId/costs
 * Body: single entry OR { entries: [...] } for bulk CSV-style upload.
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

  const single = postBodySchema.safeParse(body)
  const bulk = !single.success ? bulkBodySchema.safeParse(body) : null
  const entries = single.success ? [single.data] : bulk?.success ? bulk.data.entries : null

  if (!entries) {
    const details = single.error?.format() ?? bulk?.error?.format()
    return NextResponse.json(
      { error: 'Invalid body', code: 'VALIDATION', details },
      { status: 400 },
    )
  }

  let inserted = 0
  for (const entry of entries) {
    await sql`
      INSERT INTO off_chain_costs (
        company_id, agent_id, occurred_at, category, description,
        amount_usd, source, source_ref, uploaded_by
      ) VALUES (
        ${companyId},
        ${entry.agentId ?? null},
        ${entry.occurredAt}::date,
        ${entry.category},
        ${entry.description},
        ${entry.amountUsd},
        ${entry.source},
        ${entry.sourceRef ?? null},
        ${entry.uploadedBy.toLowerCase()}
      )
    `
    inserted++
  }

  return NextResponse.json({ companyId, inserted })
}
