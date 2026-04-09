export default function AgentsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-4 w-20 animate-pulse rounded bg-(--color-border)" />
      <div className="mt-3 h-8 w-48 animate-pulse rounded bg-(--color-border)" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-(--color-border)/60" />
      <div className="mt-8 h-12 w-full animate-pulse rounded-xl bg-(--color-surface)" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-(--color-border) bg-(--color-surface)/40 p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-(--color-border)" />
              <div>
                <div className="h-4 w-28 rounded bg-(--color-border)" />
                <div className="mt-1.5 h-3 w-16 rounded bg-(--color-border)/60" />
              </div>
            </div>
            <div className="mt-4 h-3 w-full rounded bg-(--color-border)/60" />
            <div className="mt-2 h-3 w-3/4 rounded bg-(--color-border)/60" />
          </div>
        ))}
      </div>
    </div>
  )
}
