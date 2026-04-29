/**
 * Claim keys.
 *
 * A user issues one (or more) of these from /workspace/claim-keys and
 * pastes it into their agent's config. The agent then calls
 *   POST /api/v1/claim/agent     { agentId }
 *   POST /api/v1/claim/company   { companyId }
 * with `Authorization: Bearer <key>`. The server resolves the key to a
 * user, reads `ownerOf(agentId)` (or `companies.owner_address`) on
 * chain, and writes the resulting wallet into `user_wallets`. Once the
 * wallet is verified for that user, the existing transitive attribution
 * in lib/workspace.ts surfaces the agent + any company it's a member of
 * + every invoice it's a party to.
 *
 * Keys are bearer credentials — possession is authority. The user is
 * expected to share the key only with agents they control. Keys are
 * labelable, listable, and revocable. We never store the plaintext;
 * each row carries a bcrypt hash, plus a short prefix for UI display.
 */

import { randomBytes } from 'node:crypto'

import bcrypt from 'bcryptjs'

import { sql } from '@/lib/db'

const BCRYPT_ROUNDS = 12
const KEY_PREFIX = 'sm8_'

export interface ClaimKeyRow {
  id: string
  label: string | null
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export interface ResolvedClaimKey {
  id: string
  userId: string
  keyPrefix: string
}

/** Generate a random key + return its prefix and hash (no plaintext stored). */
function generateKey(): { plaintext: string; prefix: string } {
  const body = randomBytes(24).toString('base64url')
  const plaintext = `${KEY_PREFIX}${body}`
  const prefix = plaintext.slice(0, KEY_PREFIX.length + 8)
  return { plaintext, prefix }
}

export async function createClaimKey(
  userId: string,
  label: string | null,
): Promise<{ plaintext: string; row: ClaimKeyRow }> {
  const { plaintext, prefix } = generateKey()
  const hash = await bcrypt.hash(plaintext, BCRYPT_ROUNDS)
  const inserted = (await sql`
    INSERT INTO claim_keys (user_id, key_hash, key_prefix, label)
    VALUES (${userId}, ${hash}, ${prefix}, ${label})
    RETURNING id, label, key_prefix, created_at::text,
              last_used_at::text, revoked_at::text
  `) as Array<{
    id: string
    label: string | null
    key_prefix: string
    created_at: string
    last_used_at: string | null
    revoked_at: string | null
  }>
  const r = inserted[0]!
  return {
    plaintext,
    row: {
      id: r.id,
      label: r.label,
      keyPrefix: r.key_prefix,
      createdAt: r.created_at,
      lastUsedAt: r.last_used_at,
      revokedAt: r.revoked_at,
    },
  }
}

export async function listClaimKeys(userId: string): Promise<ClaimKeyRow[]> {
  const rows = (await sql`
    SELECT id, label, key_prefix,
           created_at::text, last_used_at::text, revoked_at::text
    FROM claim_keys
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as Array<{
    id: string
    label: string | null
    key_prefix: string
    created_at: string
    last_used_at: string | null
    revoked_at: string | null
  }>
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    keyPrefix: r.key_prefix,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
    revokedAt: r.revoked_at,
  }))
}

export async function revokeClaimKey(
  userId: string,
  keyId: string,
): Promise<boolean> {
  const rows = (await sql`
    UPDATE claim_keys SET revoked_at = NOW()
    WHERE id = ${keyId} AND user_id = ${userId} AND revoked_at IS NULL
    RETURNING id
  `) as unknown[]
  return rows.length > 0
}

/**
 * Resolve a bearer string to its claim key row. Walks every active key
 * with a matching prefix and bcrypt-compares — the prefix lookup keeps
 * the work bounded even if claim_keys grows large.
 *
 * Returns null on miss (unknown key, revoked, or wrong secret). Bumps
 * last_used_at on hit for auditing.
 */
export async function resolveBearerKey(
  bearer: string,
): Promise<ResolvedClaimKey | null> {
  if (!bearer.startsWith(KEY_PREFIX)) return null
  const prefix = bearer.slice(0, KEY_PREFIX.length + 8)
  const candidates = (await sql`
    SELECT id, user_id, key_hash, key_prefix
    FROM claim_keys
    WHERE key_prefix = ${prefix} AND revoked_at IS NULL
  `) as Array<{
    id: string
    user_id: string
    key_hash: string
    key_prefix: string
  }>

  for (const c of candidates) {
    const ok = await bcrypt.compare(bearer, c.key_hash)
    if (ok) {
      void sql`UPDATE claim_keys SET last_used_at = NOW() WHERE id = ${c.id}`
      return { id: c.id, userId: c.user_id, keyPrefix: c.key_prefix }
    }
  }
  return null
}

export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader) return null
  const m = /^Bearer\s+(\S+)$/i.exec(authHeader.trim())
  return m ? m[1]! : null
}

/**
 * Mint or refresh a verified user_wallets row using the claim key as
 * its proof message. The wallet has already been derived on-chain
 * (ownerOf(agentId), or companies.owner_address) by the caller.
 */
export async function attributeWalletViaClaim(
  userId: string,
  walletAddress: string,
  keyPrefix: string,
  context: string,
): Promise<{ ok: true } | { ok: false; code: 'WALLET_OWNED_BY_OTHER_USER' }> {
  const lower = walletAddress.toLowerCase()
  const owned = (await sql`
    SELECT user_id FROM user_wallets
    WHERE wallet_address = ${lower} AND user_id <> ${userId}
    LIMIT 1
  `) as Array<{ user_id: string }>
  if (owned.length > 0) {
    return { ok: false, code: 'WALLET_OWNED_BY_OTHER_USER' }
  }

  const proofMessage = `claim_key=${keyPrefix} ${context}`
  await sql`
    INSERT INTO user_wallets (
      user_id, wallet_address,
      proof_message, proof_signature, verified_at
    ) VALUES (
      ${userId}, ${lower},
      ${proofMessage}, ${'claim_key'}, NOW()
    )
    ON CONFLICT (user_id, wallet_address) DO UPDATE SET
      proof_message   = EXCLUDED.proof_message,
      proof_signature = EXCLUDED.proof_signature,
      verified_at     = COALESCE(user_wallets.verified_at, NOW())
  `
  return { ok: true }
}
