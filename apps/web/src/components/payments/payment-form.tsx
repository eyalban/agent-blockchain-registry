'use client'

import { useState } from 'react'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'

import { TxStatus } from '@/components/web3/tx-status'

interface PaymentFormProps {
  readonly recipientAddress?: string
  readonly recipientName?: string
}

export function PaymentForm({ recipientAddress, recipientName }: PaymentFormProps) {
  const { isConnected } = useAccount()
  const { sendTransaction, data: hash, isPending, error: sendError } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [to, setTo] = useState(recipientAddress ?? '')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) p-8 text-center">
        <p className="text-sm text-(--color-text-secondary)">
          Connect your wallet to send payments.
        </p>
      </div>
    )
  }

  function handleSend(e: React.FormEvent): void {
    e.preventDefault()
    if (!to || !amount) return

    sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(amount),
      data: memo ? (`0x${Buffer.from(memo).toString('hex')}` as `0x${string}`) : undefined,
    })
  }

  return (
    <form onSubmit={handleSend} className="space-y-5">
      {/* Recipient */}
      <div>
        <label htmlFor="pay-to" className="block font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-secondary)">
          Recipient Address
        </label>
        <input
          id="pay-to"
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="0x..."
          disabled={Boolean(recipientAddress)}
          className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 font-mono text-sm text-(--color-text-primary) placeholder-(--color-text-muted) transition-all focus:border-(--color-accent-cyan) focus:outline-none focus:glow-cyan-sm disabled:opacity-60"
        />
        {recipientName && (
          <p className="mt-1 text-xs text-(--color-accent-cyan)">{recipientName}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="pay-amount" className="block font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-secondary)">
          Amount (ETH)
        </label>
        <input
          id="pay-amount"
          type="number"
          step="0.0001"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.01"
          className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 font-mono text-sm text-(--color-text-primary) placeholder-(--color-text-muted) transition-all focus:border-(--color-accent-cyan) focus:outline-none focus:glow-cyan-sm"
        />
      </div>

      {/* Memo */}
      <div>
        <label htmlFor="pay-memo" className="block font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-secondary)">
          Memo <span className="normal-case tracking-normal text-(--color-text-muted)">(optional, on-chain)</span>
        </label>
        <input
          id="pay-memo"
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Payment for agent services"
          maxLength={100}
          className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) transition-all focus:border-(--color-accent-cyan) focus:outline-none focus:glow-cyan-sm"
        />
      </div>

      <TxStatus
        hash={hash}
        isPending={isPending}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        error={sendError}
      />

      <button
        type="submit"
        disabled={!to || !amount || isPending || isConfirming}
        className="w-full rounded-xl bg-gradient-to-r from-(--color-accent-cyan) to-(--color-accent-cyan-dim) py-3 text-sm font-semibold text-(--color-bg-primary) transition-all hover:opacity-90 glow-cyan-sm disabled:opacity-50"
      >
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Sending...' : `Send ${amount || '0'} ETH`}
      </button>
    </form>
  )
}
