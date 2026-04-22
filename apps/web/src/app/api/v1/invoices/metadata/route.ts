import { NextResponse } from 'next/server'
import { z } from 'zod'

import { uploadToIPFS } from '@/lib/ipfs'

const bodySchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(4096).optional(),
  service: z.string().max(128).optional(),
  unitPriceUsd: z.number().nonnegative().optional(),
  quantity: z.number().positive().optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().max(256),
        quantity: z.number().positive(),
        unitPriceUsd: z.number().nonnegative(),
      }),
    )
    .optional(),
})

/**
 * POST /api/v1/invoices/metadata
 * Uploads invoice memo JSON to IPFS, returns the URI + sha256 hash to pass
 * to createInvoice. Called from the UI before signing the on-chain tx.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Body must be JSON', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid invoice metadata', code: 'VALIDATION', details: parsed.error.format() },
      { status: 400 },
    )
  }

  const uri = await uploadToIPFS(
    parsed.data as Record<string, unknown>,
    `invoice-${parsed.data.title}`,
  )

  // sha256 of canonical JSON for on-chain memoHash
  const json = JSON.stringify(parsed.data)
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json))
  const hashHex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return NextResponse.json({ uri, memoHash: `0x${hashHex}` })
}
