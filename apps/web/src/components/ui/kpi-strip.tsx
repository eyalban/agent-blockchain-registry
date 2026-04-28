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
 * 2-up on mobile, 4-up on sm+. Every caller in this codebase passes
 * 3 or 4 cells; on a 3-cell page the last column simply leaves an
 * empty slot which still reads cleanly.
 */
export function KpiStrip({ cells }: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 divide-(--color-border) overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:grid-cols-4 sm:divide-x">
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
