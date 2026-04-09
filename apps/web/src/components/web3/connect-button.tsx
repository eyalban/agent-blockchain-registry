'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

import { truncateAddress } from '@/lib/utils'

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {chain && (
          <span className="hidden items-center gap-1.5 rounded-lg border border-(--color-border) bg-(--color-surface) px-2.5 py-1.5 font-mono text-xs text-(--color-accent-cyan) sm:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent-green) opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-accent-green)" />
            </span>
            {chain.name}
          </span>
        )}
        <button
          type="button"
          onClick={() => disconnect()}
          className="rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-sm text-(--color-text-secondary) transition-colors hover:border-(--color-accent-red)/40 hover:text-(--color-accent-red)"
        >
          {truncateAddress(address)}
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          type="button"
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="rounded-lg border border-(--color-accent-cyan)/30 bg-(--color-accent-cyan)/10 px-4 py-1.5 text-sm font-medium text-(--color-accent-cyan) transition-all hover:bg-(--color-accent-cyan)/20 hover:glow-cyan-sm disabled:opacity-50"
        >
          {isPending
            ? 'Connecting...'
            : connector.name === 'Injected'
              ? 'Connect'
              : connector.name}
        </button>
      ))}
    </div>
  )
}
