'use client'

import { TX_EXPLORER_URL } from '@agent-registry/shared'

interface TxStatusProps {
  readonly hash: `0x${string}` | undefined
  readonly isPending: boolean
  readonly isConfirming: boolean
  readonly isSuccess: boolean
  readonly error: Error | null
  readonly chainId?: number
}

export function TxStatus({
  hash,
  isPending,
  isConfirming,
  isSuccess,
  error,
  chainId = 84532,
}: TxStatusProps) {
  if (error) {
    return (
      <div className="rounded-xl border border-(--color-accent-red)/30 bg-(--color-accent-red)/5 p-4 glow-red">
        <p className="text-sm font-medium text-(--color-accent-red)">Transaction failed</p>
        <p className="mt-1 font-mono text-xs text-(--color-accent-red)/70">
          {error.message.slice(0, 200)}
        </p>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="rounded-xl border border-(--color-accent-amber)/30 bg-(--color-accent-amber)/5 p-4 glow-amber">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent-amber) opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-accent-amber)" />
          </span>
          <p className="text-sm font-medium text-(--color-accent-amber)">
            Waiting for wallet confirmation...
          </p>
        </div>
      </div>
    )
  }

  if (isConfirming && hash) {
    return (
      <div className="rounded-xl border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/5 p-4 glow-cyan-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent-cyan) opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-accent-cyan)" />
          </span>
          <p className="text-sm font-medium text-(--color-accent-cyan)">
            Transaction submitted. Confirming...
          </p>
        </div>
        <a
          href={TX_EXPLORER_URL(chainId, hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-mono text-xs text-(--color-accent-cyan)/70 underline"
        >
          {hash.slice(0, 10)}...{hash.slice(-8)} &rarr;
        </a>
      </div>
    )
  }

  if (isSuccess && hash) {
    return (
      <div className="rounded-xl border border-(--color-accent-green)/30 bg-(--color-accent-green)/5 p-4 glow-green">
        <p className="text-sm font-medium text-(--color-accent-green)">Transaction confirmed!</p>
        <a
          href={TX_EXPLORER_URL(chainId, hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block font-mono text-xs text-(--color-accent-green)/70 underline"
        >
          View on BaseScan &rarr;
        </a>
      </div>
    )
  }

  return null
}
