/**
 * Verifiable wallet ↔ user link.
 *
 * Anyone can claim an address by typing it into a form, but they can
 * only sign a personal_sign message with the matching private key. We
 * issue a nonce-bound challenge per (user, address), the client signs
 * it via the connected wallet, and the server recovers the signer with
 * viem.verifyMessage. Only on a match do we insert into user_wallets.
 *
 * Combined with the cross-user UNIQUE constraint on wallet_address
 * (migration 012), this makes the link non-manipulable: a given on-chain
 * address can only ever be attributed to one statem8 account, and only
 * to the holder of the private key.
 */

import { randomBytes } from 'node:crypto'

import { verifyMessage } from 'viem'

import { sql } from '@/lib/db'

const CHALLENGE_TTL_MS = 5 * 60_000

interface ChallengeRow {
  message: string
  expires_at: string
}

export interface WalletLinkChallenge {
  message: string
  expiresAt: Date
}

export function buildChallengeMessage(
  userId: string,
  walletAddress: string,
  nonce: string,
): string {
  const issuedAt = new Date().toISOString()
  return [
    'statem8 wants to link this wallet to your account.',
    '',
    `Account: ${userId}`,
    `Wallet: ${walletAddress.toLowerCase()}`,
    `Nonce: ${nonce}`,
    `Issued: ${issuedAt}`,
    '',
    'Signing this message confirms control of the private key.',
    'It does not authorize any transaction or transfer.',
  ].join('\n')
}

export async function issueChallenge(
  userId: string,
  walletAddress: string,
): Promise<WalletLinkChallenge> {
  const wallet = walletAddress.toLowerCase()
  const nonce = randomBytes(16).toString('hex')
  const message = buildChallengeMessage(userId, wallet, nonce)
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS)

  await sql`
    INSERT INTO wallet_link_challenges (user_id, wallet_address, nonce, message, expires_at)
    VALUES (${userId}, ${wallet}, ${nonce}, ${message}, ${expiresAt.toISOString()})
    ON CONFLICT (user_id, wallet_address) DO UPDATE SET
      nonce      = EXCLUDED.nonce,
      message    = EXCLUDED.message,
      expires_at = EXCLUDED.expires_at,
      created_at = NOW()
  `

  return { message, expiresAt }
}

interface VerifyResult {
  ok: true
  walletAddress: string
}

interface VerifyError {
  ok: false
  code:
    | 'NO_CHALLENGE'
    | 'EXPIRED'
    | 'BAD_SIGNATURE'
    | 'WALLET_OWNED_BY_OTHER_USER'
  message: string
}

interface ExistingLink {
  user_id: string
}

export async function verifyAndLink(
  userId: string,
  walletAddress: string,
  signature: string,
): Promise<VerifyResult | VerifyError> {
  const wallet = walletAddress.toLowerCase()

  const rows = (await sql`
    SELECT message, expires_at::text FROM wallet_link_challenges
    WHERE user_id = ${userId} AND wallet_address = ${wallet}
    LIMIT 1
  `) as ChallengeRow[]
  const challenge = rows[0]
  if (!challenge) {
    return {
      ok: false,
      code: 'NO_CHALLENGE',
      message: 'No outstanding challenge for that wallet.',
    }
  }
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    return {
      ok: false,
      code: 'EXPIRED',
      message: 'Challenge expired. Request a new one and re-sign.',
    }
  }

  let valid = false
  try {
    valid = await verifyMessage({
      address: wallet as `0x${string}`,
      message: challenge.message,
      signature: signature as `0x${string}`,
    })
  } catch {
    valid = false
  }
  if (!valid) {
    return {
      ok: false,
      code: 'BAD_SIGNATURE',
      message: 'Signature did not match the requested wallet.',
    }
  }

  // Refuse if another account already owns this wallet. The unique
  // index on user_wallets.wallet_address would also reject it; this
  // surfaces a clean error first.
  const owned = (await sql`
    SELECT user_id FROM user_wallets
    WHERE wallet_address = ${wallet} AND user_id <> ${userId}
    LIMIT 1
  `) as ExistingLink[]
  if (owned.length > 0) {
    return {
      ok: false,
      code: 'WALLET_OWNED_BY_OTHER_USER',
      message: 'That wallet is already linked to a different statem8 account.',
    }
  }

  await sql`
    INSERT INTO user_wallets (
      user_id, wallet_address,
      proof_message, proof_signature, verified_at
    ) VALUES (
      ${userId}, ${wallet},
      ${challenge.message}, ${signature}, NOW()
    )
    ON CONFLICT (user_id, wallet_address) DO UPDATE SET
      proof_message   = EXCLUDED.proof_message,
      proof_signature = EXCLUDED.proof_signature,
      verified_at     = NOW()
  `

  await sql`
    DELETE FROM wallet_link_challenges
    WHERE user_id = ${userId} AND wallet_address = ${wallet}
  `

  return { ok: true, walletAddress: wallet }
}
