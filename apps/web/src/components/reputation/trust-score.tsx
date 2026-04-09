'use client'

interface TrustScoreProps {
  readonly count: bigint | undefined
  readonly summaryValue: bigint | undefined
  readonly summaryValueDecimals: number | undefined
}

export function TrustScore({ count, summaryValue, summaryValueDecimals }: TrustScoreProps) {
  const feedbackCount = count !== undefined ? Number(count) : 0
  const rawScore = summaryValue !== undefined ? Number(summaryValue) : 0
  const decimals = summaryValueDecimals ?? 0
  const score = decimals > 0 ? rawScore / Math.pow(10, decimals) : rawScore

  const scoreColor =
    score > 10
      ? 'text-(--color-accent-green)'
      : score < -10
        ? 'text-(--color-accent-red)'
        : 'text-(--color-text-secondary)'

  const scoreGlow =
    score > 10 ? 'glow-green' : score < -10 ? 'glow-red' : ''

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Overall score */}
      <div className={`flex flex-col items-center rounded-xl border border-(--color-border) bg-(--color-surface) p-5 ${scoreGlow}`}>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
          Trust Score
        </p>
        <p className={`mt-2 font-mono text-4xl font-bold ${scoreColor}`}>
          {feedbackCount > 0 ? (score > 0 ? `+${score}` : score) : '\u2014'}
        </p>
      </div>

      {/* Feedback count */}
      <div className="flex flex-col items-center rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
          Total Feedback
        </p>
        <p className="mt-2 font-mono text-4xl font-bold text-(--color-accent-cyan)">
          {feedbackCount}
        </p>
      </div>

      {/* Status */}
      <div className="flex flex-col items-center rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
          Status
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent-green) opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-(--color-accent-green)" />
          </span>
          <span className="font-mono text-sm text-(--color-accent-green)">Active</span>
        </div>
      </div>
    </div>
  )
}
