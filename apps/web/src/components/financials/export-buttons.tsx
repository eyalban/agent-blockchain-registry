'use client'

/**
 * Export-to-CSV-or-PDF buttons for financial statements.
 *
 * CSV: built client-side from a list of rows, downloaded via a Blob.
 *      No server dependency, no library.
 * PDF: triggers window.print(). The Statement* components opt in to
 *      `print:show` styling so the printable region renders cleanly
 *      (no chrome, no banners) and "Save as PDF" produces a usable
 *      PDF directly from the browser.
 */

export interface CsvRow {
  readonly label: string
  readonly value: string
}

interface ExportButtonsProps {
  readonly filename: string
  readonly title: string
  readonly rows: readonly CsvRow[]
}

function escapeCsvCell(v: string): string {
  if (v === '') return ''
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

function buildCsv(title: string, rows: readonly CsvRow[]): string {
  const header = `${escapeCsvCell(title)}\n`
  const generated = `Generated,${escapeCsvCell(new Date().toISOString())}\n\n`
  const cols = `Label,Value\n`
  const body = rows
    .map((r) => `${escapeCsvCell(r.label)},${escapeCsvCell(r.value)}`)
    .join('\n')
  return header + generated + cols + body + '\n'
}

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function ExportButtons({ filename, title, rows }: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={() => downloadCsv(`${filename}.csv`, buildCsv(title, rows))}
        className="rounded-full border border-(--color-border) bg-white px-3.5 py-1.5 text-xs font-medium text-(--color-text-secondary) transition-colors hover:border-(--color-magenta-300) hover:text-(--color-magenta-700)"
        title="Download as CSV"
      >
        Export CSV
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-3.5 py-1.5 text-xs font-medium text-(--color-magenta-700) transition-colors hover:bg-(--color-magenta-100)"
        title="Print or save as PDF via the browser dialog"
      >
        Export PDF
      </button>
    </div>
  )
}
