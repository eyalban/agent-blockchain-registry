import { NextResponse } from 'next/server'
import { z } from 'zod'

import { uploadToIPFS } from '@/lib/ipfs'

const bodySchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(2048).optional(),
  logoURL: z.string().url().max(2048).optional(),
  jurisdictionCode: z
    .string()
    .regex(/^[A-Z]{3}(-[A-Z0-9]{1,3})?$/, 'ISO-3166-1 alpha-3 [+ subdivision]'),
})

/**
 * POST /api/v1/companies/metadata
 *
 * Takes a parsed company-metadata object, validates it, uploads to IPFS,
 * returns the URI that the client then passes to CompanyRegistry.createCompany.
 *
 * Separate from /api/v1/upload (which validates an ERC-8004 agent card).
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
      {
        error: 'Invalid company metadata',
        code: 'VALIDATION',
        details: parsed.error.format(),
      },
      { status: 400 },
    )
  }

  const uri = await uploadToIPFS(
    parsed.data as Record<string, unknown>,
    `company-${parsed.data.name}`,
  )

  return NextResponse.json({ uri })
}
