/**
 * Runtime environment configuration.
 * Validates that required env vars are present.
 */

export const env = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '84532'),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? 'https://sepolia.base.org',
  identityRegistryAddress: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS ??
    '0x8004A818BFB912233c491871b3d84c89A494BD9e') as `0x${string}`,
  reputationRegistryAddress: (process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS ??
    '0x8004B663056A597Dffe9eCcC1965A193B7388713') as `0x${string}`,
  wrapperAddress: (process.env.NEXT_PUBLIC_WRAPPER_ADDRESS ?? '0x') as `0x${string}`,
  paymasterRpcUrl: process.env.NEXT_PUBLIC_PAYMASTER_RPC_URL ?? '',
  isMainnet: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '84532') === 8453,
} as const
