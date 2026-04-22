import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import {
  type PeriodGranularity,
  computeCompanyIncomeStatement,
} from '@/lib/company-financials'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

const querySchema = z.object({
  period: z
    .enum(['monthly', 'quarterly', 'ytd', 'total'])
    .optional()
    .default('monthly'),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

/**
 * GET /api/v1/companies/:companyId/financials/income-statement
 *   ?period=monthly|quarterly|ytd|total
 *   &from=YYYY-MM-DD
 *   &to=YYYY-MM-DD
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { companyId } = await params
  const parsed = querySchema.safeParse({
    period: req.nextUrl.searchParams.get('period') ?? undefined,
    from: req.nextUrl.searchParams.get('from') ?? undefined,
    to: req.nextUrl.searchParams.get('to') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query',
        code: 'VALIDATION',
        details: parsed.error.format(),
      },
      { status: 400 },
    )
  }

  const statement = await computeCompanyIncomeStatement({
    companyId,
    granularity: parsed.data.period as PeriodGranularity,
    from: parsed.data.from,
    to: parsed.data.to,
  })

  return NextResponse.json(statement)
}
