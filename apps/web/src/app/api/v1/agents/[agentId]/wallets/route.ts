import { NextResponse } from 'next/server'
import { addWallet, getWalletsByAgent } from '@/lib/db'

interface RouteParams {
  params: Promise<{ agentId: string }>
}

export async function GET(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  const { agentId } = await params
  const wallets = await getWalletsByAgent(agentId)
  return NextResponse.json({ agentId, wallets })
}

export async function POST(req: Request, { params }: RouteParams): Promise<NextResponse> {
  const { agentId } = await params
  const body = (await req.json()) as {
    walletAddress?: string
    isPrimary?: boolean
    label?: string
  }

  if (!body.walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(body.walletAddress)) {
    return NextResponse.json(
      { error: 'Invalid wallet address', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }

  await addWallet(agentId, body.walletAddress, body.isPrimary ?? false, body.label ?? 'default')
  return NextResponse.json({ success: true, agentId, walletAddress: body.walletAddress })
}
