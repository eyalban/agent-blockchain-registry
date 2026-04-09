export default function AgentDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-4 w-32 animate-pulse rounded bg-(--color-border)/60" />
      <div className="mt-4 flex items-start gap-4">
        <div className="h-16 w-16 animate-pulse rounded-2xl bg-(--color-border)" />
        <div className="flex-1">
          <div className="h-8 w-64 animate-pulse rounded bg-(--color-border)" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-(--color-border)/60" />
        </div>
      </div>
      <div className="mt-8 flex gap-4 border-b border-(--color-border) pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded bg-(--color-border)/40" />
        ))}
      </div>
      <div className="mt-6 space-y-4">
        <div className="h-4 w-20 animate-pulse rounded bg-(--color-border)/60" />
        <div className="h-16 w-full animate-pulse rounded-xl bg-(--color-surface)" />
      </div>
    </div>
  )
}
