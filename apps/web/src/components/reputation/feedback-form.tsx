'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'

import { useGiveFeedback } from '@/hooks/use-give-feedback'
import { TxStatus } from '@/components/web3/tx-status'

const FEEDBACK_TAGS = [
  'reliable', 'fast', 'accurate', 'creative', 'helpful',
  'secure', 'responsive', 'efficient', 'trustworthy', 'innovative',
]

const ZERO_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

interface FeedbackFormProps {
  readonly agentId: bigint
}

export function FeedbackForm({ agentId }: FeedbackFormProps) {
  const { isConnected } = useAccount()
  const { giveFeedback, hash, isPending, isConfirming, isSuccess, error } =
    useGiveFeedback()

  const [value, setValue] = useState(50)
  const [tag1, setTag1] = useState('')
  const [tag2, setTag2] = useState('')
  const [comment, setComment] = useState('')

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) p-8 text-center">
        <p className="text-sm text-(--color-text-secondary)">
          Connect your wallet to give feedback.
        </p>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()
    const scaledValue = BigInt(value - 50) // Center around 0: -50 to +50
    giveFeedback(
      agentId,
      scaledValue,
      0,
      tag1,
      tag2,
      '',
      comment || '',
      ZERO_HASH,
    )
  }

  function selectTag(tag: string): void {
    if (!tag1) {
      setTag1(tag)
    } else if (!tag2 && tag !== tag1) {
      setTag2(tag)
    } else if (tag === tag1) {
      setTag1(tag2)
      setTag2('')
    } else if (tag === tag2) {
      setTag2('')
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <TxStatus
          hash={hash}
          isPending={false}
          isConfirming={false}
          isSuccess={true}
          error={null}
        />
        <div className="text-center">
          <p className="text-sm text-(--color-text-secondary)">
            Thank you for your feedback! It has been recorded on-chain.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Score slider */}
      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-secondary)">
          Rating
        </label>
        <div className="mt-3 flex items-center gap-4">
          <span className="font-mono text-xs text-(--color-accent-red)">-50</span>
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-(--color-border) accent-(--color-accent-cyan)"
          />
          <span className="font-mono text-xs text-(--color-accent-green)">+50</span>
        </div>
        <div className="mt-2 text-center">
          <span
            className={`font-mono text-2xl font-bold ${
              value > 55
                ? 'text-(--color-accent-green)'
                : value < 45
                  ? 'text-(--color-accent-red)'
                  : 'text-(--color-text-secondary)'
            }`}
          >
            {value > 50 ? '+' : ''}{value - 50}
          </span>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-secondary)">
          Tags <span className="normal-case tracking-normal text-(--color-text-muted)">(select up to 2)</span>
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEEDBACK_TAGS.map((tag) => {
            const selected = tag === tag1 || tag === tag2
            return (
              <button
                key={tag}
                type="button"
                onClick={() => selectTag(tag)}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                  selected
                    ? 'bg-(--color-accent-cyan)/20 text-(--color-accent-cyan) border border-(--color-accent-cyan)/40 glow-cyan-sm'
                    : 'bg-(--color-bg-secondary) text-(--color-text-muted) border border-(--color-border) hover:border-(--color-border-bright) hover:text-(--color-text-secondary)'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="feedback-comment" className="block font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-secondary)">
          Comment <span className="normal-case tracking-normal text-(--color-text-muted)">(optional)</span>
        </label>
        <textarea
          id="feedback-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this agent..."
          rows={3}
          maxLength={500}
          className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) transition-all focus:border-(--color-accent-cyan) focus:outline-none focus:glow-cyan-sm"
        />
      </div>

      {/* Transaction status */}
      <TxStatus
        hash={hash}
        isPending={isPending}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        error={error}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || isConfirming}
        className="w-full rounded-xl bg-(--color-accent-cyan) py-3 text-sm font-semibold text-(--color-bg-primary) transition-all hover:opacity-90 glow-cyan-sm disabled:opacity-50"
      >
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  )
}
