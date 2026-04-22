/**
 * Point-in-time token-balance reader.
 *
 * Reads native ETH via `getBalance` and ERC-20 balances via `balanceOf`
 * through viem. When `atBlock` is provided the call is routed to the same
 * RPC with the `blockNumber` parameter (archive endpoint required for
 * historical queries; if the RPC doesn't support it, the call throws and
 * the caller gets `null` back).
 */

import {
  type SupportedChainId,
  type TokenInfo,
  SUPPORTED_TOKENS,
  listTokens,
} from '@agent-registry/shared'
import { type PublicClient } from 'viem'

import { publicClient } from './viem-client'

const erc20BalanceOfAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export interface BalanceRead {
  token: TokenInfo
  balanceRaw: bigint
  balanceHuman: number
  source: 'rpc' | 'rpc-archive'
  error?: string
}

export async function readTokenBalance(
  chainId: SupportedChainId,
  address: `0x${string}`,
  token: TokenInfo,
  atBlock?: number,
): Promise<BalanceRead | null> {
  const client = publicClient as PublicClient
  try {
    let raw: bigint
    if (token.isNative) {
      raw = await client.getBalance({
        address,
        blockNumber: atBlock !== undefined ? BigInt(atBlock) : undefined,
      })
    } else if (token.address) {
      raw = (await client.readContract({
        address: token.address,
        abi: erc20BalanceOfAbi,
        functionName: 'balanceOf',
        args: [address],
        blockNumber: atBlock !== undefined ? BigInt(atBlock) : undefined,
      })) as bigint
    } else {
      return null
    }
    const human = Number(raw) / 10 ** token.decimals
    return {
      token,
      balanceRaw: raw,
      balanceHuman: human,
      source: atBlock !== undefined ? 'rpc-archive' : 'rpc',
    }
  } catch (err) {
    return {
      token,
      balanceRaw: 0n,
      balanceHuman: 0,
      source: atBlock !== undefined ? 'rpc-archive' : 'rpc',
      error: (err as Error).message?.slice(0, 120) ?? 'unknown error',
    }
  }
}

/**
 * Read every whitelisted token's balance for a single address.
 */
export async function readAllWhitelistedBalances(
  chainId: SupportedChainId,
  address: `0x${string}`,
  atBlock?: number,
): Promise<BalanceRead[]> {
  const tokens = listTokens(chainId)
  const reads = await Promise.all(
    tokens.map((t) => readTokenBalance(chainId, address, t, atBlock)),
  )
  return reads.filter((r): r is BalanceRead => r !== null)
}

export { SUPPORTED_TOKENS }
