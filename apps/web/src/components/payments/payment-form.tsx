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
      <div className="rounded-2xl border border-dashed border-(--color-border-bright) bg-white p-10 text-center">
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
        <label htmlFor="pay-to" className="block text-sm font-medium text-(--color-text-primary)">
          Recipient Address
        </label>
        <input
          id="pay-to"
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="0x..."
          disabled={Boolean(recipientAddress)}
          className="mt-1.5 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 font-mono text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20 disabled:opacity-60"
        />
        {recipientName && (
          <p className="mt-1.5 text-xs font-medium text-(--color-magenta-700)">{recipientName}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="pay-amount" className="block text-sm font-medium text-(--color-text-primary)">
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
          className="mt-1.5 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 font-mono text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
        />
      </div>

      {/* Memo */}
      <div>
        <label htmlFor="pay-memo" className="block text-sm font-medium text-(--color-text-primary)">
          Memo <span className="normal-case tracking-normal text-(--color-text-muted)">(optional, on-chain)</span>
        </label>
        <input
          id="pay-memo"
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Payment for agent services"
          maxLength={100}
          className="mt-1.5 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
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
        className="w-full rounded-full bg-(--color-magenta-700) py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800) disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {isPending ? 'Confirm in wallet…' : isConfirming ? 'Sending…' : `Send ${amount || '0'} ETH`}
      </button>
    </form>
  )
}
