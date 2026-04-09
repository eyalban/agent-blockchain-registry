import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

/**
 * Server-side viem public client for API routes.
 * This is NOT the wagmi client — it's used for direct RPC calls in route handlers.
 */
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL ?? 'https://sepolia.base.org'),
})
