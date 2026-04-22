import { NextResponse, type NextRequest } from 'next/server'

import { sql } from '@/lib/db'

interface Row {
  id: string
  company_id: string | null
  jurisdiction_code: string
  rate: string
  rate_type: 'statutory' | 'effective' | 'override'
  source: string
  source_ref: string
  effective_from: string
  effective_to: string | null
  submitted_by: string | null
  submitted_at: string
}

/**
 * GET /api/v1/admin/tax-rates?jurisdictionCode=USA
 *
 * Lists all tax-rate rows, optionally filtered by jurisdiction. Used by
 * operators to verify the OECD seed landed correctly and inspect provenance.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const jurisdictionCode = req.nextUrl.searchParams.get('jurisdictionCode')

  const rows = (jurisdictionCode
    ? await sql`
        SELECT id::text, company_id, jurisdiction_code, rate,
               rate_type, source, source_ref,
               effective_from::text, effective_to::text,
               submitted_by, submitted_at::text
        FROM tax_rates
        WHERE jurisdiction_code = ${jurisdictionCode}
        ORDER BY effective_from DESC, rate_type
      `
    : await sql`
        SELECT id::text, company_id, jurisdiction_code, rate,
               rate_type, source, source_ref,
               effective_from::text, effective_to::text,
               submitted_by, submitted_at::text
        FROM tax_rates
        ORDER BY jurisdiction_code, effective_from DESC, rate_type
      `) as Row[]

  return NextResponse.json({
    count: rows.length,
    rates: rows.map((r) => ({
      id: r.id,
      companyId: r.company_id,
      jurisdictionCode: r.jurisdiction_code,
      rate: Number(r.rate),
      rateType: r.rate_type,
      source: r.source,
      sourceRef: r.source_ref,
      effectiveFrom: r.effective_from,
      effectiveTo: r.effective_to,
      submittedBy: r.submitted_by,
      submittedAt: r.submitted_at,
    })),
  })
}
