'use client'

import { http, createConfig } from 'wagmi'
import { baseSepolia, base } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'

/**
 * Wagmi config using direct connectors (no WalletConnect project ID required).
 * Supports MetaMask (injected), Coinbase Wallet, and any browser wallet.
 * RainbowKit is configured separately in providers.tsx.
 */
export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'Agent Registry',
      preference: 'smartWalletOnly',
    }),
  ],
  transports: {
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL ?? 'https://sepolia.base.org',
    ),
    [base.id]: http('https://mainnet.base.org'),
  },
  ssr: true,
})
