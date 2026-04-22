import { NextResponse, type NextRequest } from 'next/server'

import { findCompanyByWallet } from '@/lib/db'

interface RouteParams {
  params: Promise<{ address: string }>
}

/**
 * GET /api/v1/wallets/:address/company
 * Reverse lookup — given an arbitrary wallet, return the active companyId it
 * belongs to (as member agent's wallet or registered treasury), if any.
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { address } = await params
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { error: 'Invalid address', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  const companyId = await findCompanyByWallet(address)
  return NextResponse.json({ address: address.toLowerCase(), companyId })
}
