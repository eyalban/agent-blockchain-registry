interface KpiCell {
  readonly label: string
  readonly value: string
  readonly sub?: string
}

interface KpiStripProps {
  readonly cells: readonly KpiCell[]
}

/**
 * Horizontal KPI strip used at the top of every list/dashboard page.
 * 2-up on mobile, N-up on sm+ where N matches the number of cells
 * passed in (so a 3-cell page renders 3 even columns at sm+ rather
 * than leaving an empty slot in a 4-up grid).
 *
 * The class strings for every supported cell count are listed
 * statically so Tailwind's JIT picks them up.
 */
const SM_COLS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
}

export function KpiStrip({ cells }: KpiStripProps) {
  const smCols = SM_COLS[cells.length] ?? 'sm:grid-cols-4'
  return (
    <div
      className={`grid grid-cols-2 divide-(--color-border) overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:divide-x ${smCols}`}
    >
      {cells.map((c) => (
        <div key={c.label} className="px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">
            {c.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-(--color-text-primary)">
            {c.value}
          </p>
          {c.sub && (
            <p className="mt-1 font-mono text-xs text-(--color-text-muted)">{c.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
