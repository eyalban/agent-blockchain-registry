import { NextResponse } from 'next/server'
import { getAgentByWallet } from '@/lib/db'

interface RouteParams {
  params: Promise<{ address: string }>
}

export async function GET(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  const { address } = await params
  const agentId = await getAgentByWallet(address)

  if (!agentId) {
    return NextResponse.json(
      { error: 'No agent found for this wallet', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  return NextResponse.json({ walletAddress: address, agentId })
}
