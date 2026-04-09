import {
  IDENTITY_REGISTRY_ADDRESS,
  REPUTATION_REGISTRY_ADDRESS,
  identityRegistryAbi,
  reputationRegistryAbi,
  wrapperAbi,
} from '@agent-registry/shared'

const WRAPPER_ADDRESS = (process.env.NEXT_PUBLIC_WRAPPER_ADDRESS ??
  '0x') as `0x${string}`

export const contracts = {
  identityRegistry: {
    address: IDENTITY_REGISTRY_ADDRESS as `0x${string}`,
    abi: identityRegistryAbi,
  },
  reputationRegistry: {
    address: REPUTATION_REGISTRY_ADDRESS as `0x${string}`,
    abi: reputationRegistryAbi,
  },
  wrapper: {
    address: WRAPPER_ADDRESS,
    abi: wrapperAbi,
  },
} as const
