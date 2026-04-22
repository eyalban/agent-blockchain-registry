import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { computeCompanyBalanceSheet } from '@/lib/balance-sheet'

interface RouteParams {
  params: Promise<{ companyId: string }>
}

const querySchema = z.object({
  asOf: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

/**
 * GET /api/v1/companies/:companyId/financials/balance-sheet?asOf=YYYY-MM-DD
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { companyId } = await params
  const parsed = querySchema.safeParse({
    asOf: req.nextUrl.searchParams.get('asOf') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  try {
    const sheet = await computeCompanyBalanceSheet({
      companyId,
      asOf: parsed.data.asOf,
    })
    return NextResponse.json(sheet)
  } catch (err) {
    return NextResponse.json(
      {
        error: (err as Error).message,
        code: 'COMPUTE_FAILED',
      },
      { status: 500 },
    )
  }
}
