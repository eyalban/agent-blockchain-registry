/**
 * Event-verified API mutations.
 *
 * Every company / invoice / tax-rate mutation API route takes a `txHash` from
 * the client, fetches the receipt from the RPC, and verifies that the
 * expected event was emitted by the expected contract. Only then does the
 * Postgres mirror get updated. This keeps the DB as a cache of on-chain
 * truth, not an authoritative store.
 */

import {
  type Abi,
  type DecodeEventLogReturnType,
  decodeEventLog,
  type Hex,
  type Log,
  type PublicClient,
} from 'viem'

import { publicClient } from './viem-client'

export interface VerifiedEvent<TName extends string = string> {
  eventName: TName
  args: Record<string, unknown>
  blockNumber: number
  log: Log
}

export class EventVerificationError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'TX_NOT_FOUND'
      | 'TX_FAILED'
      | 'WRONG_CONTRACT'
      | 'EVENT_NOT_FOUND',
  ) {
    super(message)
    this.name = 'EventVerificationError'
  }
}

/**
 * Fetch a tx receipt and pull the first log emitted by `contractAddress` that
 * decodes against `abi` with `eventName`. Throws EventVerificationError with
 * a specific code if anything is wrong; callers translate to HTTP errors.
 */
export async function verifyTxEvent<TAbi extends Abi, TName extends string>(params: {
  txHash: Hex
  contractAddress: `0x${string}`
  abi: TAbi
  eventName: TName
}): Promise<VerifiedEvent<TName>> {
  const client = publicClient as PublicClient
  let receipt
  try {
    receipt = await client.getTransactionReceipt({ hash: params.txHash })
  } catch {
    throw new EventVerificationError('Transaction not found', 'TX_NOT_FOUND')
  }

  if (receipt.status !== 'success') {
    throw new EventVerificationError('Transaction reverted', 'TX_FAILED')
  }

  const target = params.contractAddress.toLowerCase()
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== target) continue
    try {
      const decoded = decodeEventLog({
        abi: params.abi,
        data: log.data,
        topics: log.topics,
      }) as DecodeEventLogReturnType
      if (decoded.eventName === params.eventName) {
        return {
          eventName: params.eventName,
          args: (decoded.args ?? {}) as Record<string, unknown>,
          blockNumber: Number(log.blockNumber),
          log,
        }
      }
    } catch {
      // Log signature didn't match this ABI entry — keep looking.
    }
  }

  throw new EventVerificationError(
    `Event ${params.eventName} not found in tx ${params.txHash}`,
    'EVENT_NOT_FOUND',
  )
}

/**
 * Map an EventVerificationError to a `{ status, body }` shape usable by
 * NextResponse.json.
 */
export function errorToResponse(err: EventVerificationError): {
  status: number
  body: { error: string; code: string }
} {
  const status =
    err.code === 'TX_NOT_FOUND'
      ? 404
      : err.code === 'TX_FAILED'
        ? 400
        : err.code === 'WRONG_CONTRACT'
          ? 400
          : 400
  return { status, body: { error: err.message, code: err.code } }
}
