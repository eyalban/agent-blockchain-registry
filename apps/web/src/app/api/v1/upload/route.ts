import { NextResponse } from 'next/server'

import { agentCardSchema } from '@agent-registry/shared'
import { uploadToIPFS } from '@/lib/ipfs'

/**
 * POST /api/v1/upload
 *
 * Validates and uploads an ERC-8004 agent card JSON to IPFS.
 * Returns the IPFS URI for use in contract registration.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()

    // Validate against ERC-8004 agent card schema
    const result = agentCardSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid agent card',
          code: 'VALIDATION_ERROR',
          details: result.error.issues,
        },
        { status: 400 },
      )
    }

    const agentCard = result.data
    const name = `agent-card-${(agentCard as Record<string, unknown>).name ?? 'unnamed'}`

    const uri = await uploadToIPFS(agentCard as Record<string, unknown>, name)

    return NextResponse.json({ uri })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upload failed'
    return NextResponse.json(
      { error: message, code: 'UPLOAD_ERROR' },
      { status: 500 },
    )
  }
}
