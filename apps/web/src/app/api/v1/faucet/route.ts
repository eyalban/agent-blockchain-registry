import { NextResponse } from 'next/server'
import { z } from 'zod'

export const maxDuration = 60

const requestSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a 0x-prefixed 20-byte hex address'),
  drips: z.number().int().min(1).max(20).optional(),
})

// In-memory throttle: at most one faucet call per address per 30 s.
const lastCall = new Map<string, number>()
const COOLDOWN_MS = 30_000

/**
 * POST /api/v1/faucet
 *
 * Fund an EOA on Base Sepolia from the statem8-managed Coinbase CDP
 * faucet. Intended for autonomous-agent onboarding via the framework
 * README, where the agent generates a fresh key and needs ETH to pay
 * for its own registration without involving the user.
 *
 * Body: { address: string, drips?: number (default 4, max 20) }
 *
 * Each drip yields ~0.0001 ETH. 4 drips ≈ 0.0004 ETH covers Path A.
 * 8 drips ≈ 0.0008 ETH covers Path B (3 txs).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', code: 'VALIDATION_ERROR', details: parsed.error.issues },
      { status: 400 },
    )
  }
  const { address, drips = 4 } = parsed.data
  const key = address.toLowerCase()

  const now = Date.now()
  const prev = lastCall.get(key)
  if (prev !== undefined && now - prev < COOLDOWN_MS) {
    const retryAfter = Math.ceil((COOLDOWN_MS - (now - prev)) / 1000)
    return NextResponse.json(
      {
        error: `Too many faucet requests for ${address}. Try again in ${retryAfter}s.`,
        code: 'RATE_LIMITED',
        retryAfterSeconds: retryAfter,
      },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }
  lastCall.set(key, now)

  const cdpKeyId = process.env.CDP_API_KEY_ID
  const cdpSecret = process.env.CDP_API_KEY_SECRET
  if (!cdpKeyId || !cdpSecret) {
    return NextResponse.json(
      { error: 'Faucet unavailable: CDP keys not configured', code: 'FAUCET_UNAVAILABLE' },
      { status: 503 },
    )
  }

  const { CdpClient } = await import('@coinbase/cdp-sdk')
  const cdp = new CdpClient({ apiKeyId: cdpKeyId, apiKeySecret: cdpSecret })

  const txHashes: string[] = []
  const errors: string[] = []
  let succeeded = 0

  for (let i = 0; i < drips; i++) {
    try {
      const r = await cdp.evm.requestFaucet({
        address: address as `0x${string}`,
        network: 'base-sepolia',
        token: 'eth',
      })
      txHashes.push(r.transactionHash)
      succeeded++
    } catch (e) {
      const msg = (e as Error).message ?? 'unknown'
      errors.push(msg.slice(0, 120))
      // CDP rate-limits at ~10 drips per minute. Brief backoff if we hit it.
      if (/rate.?limit/i.test(msg)) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
  }

  return NextResponse.json({
    address,
    network: 'base-sepolia',
    requestedDrips: drips,
    successfulDrips: succeeded,
    transactionHashes: txHashes,
    estimatedEthFunded: (succeeded * 0.0001).toFixed(4),
    errors: errors.length > 0 ? errors : undefined,
  })
}
