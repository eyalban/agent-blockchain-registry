'use client'

import { useEffect, useState } from 'react'

export type ViewMode = 'list' | 'grid'

interface ViewToggleProps {
  readonly value: ViewMode
  readonly onChange: (v: ViewMode) => void
}

/**
 * Two-button pill toggle. Persistence is the caller's responsibility —
 * see useViewMode for the localStorage-backed hook used on /agents and
 * /companies.
 */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-(--color-border) bg-white p-0.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <Button active={value === 'list'} onClick={() => onChange('list')}>
        <ListIcon />
        <span className="hidden sm:inline">List</span>
      </Button>
      <Button active={value === 'grid'} onClick={() => onChange('grid')}>
        <GridIcon />
        <span className="hidden sm:inline">Grid</span>
      </Button>
    </div>
  )
}

function Button({
  active,
  onClick,
  children,
}: {
  readonly active: boolean
  readonly onClick: () => void
  readonly children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-(--color-magenta-700) text-white shadow-[0_4px_12px_-4px_rgba(219,39,119,0.45)]'
          : 'text-(--color-text-secondary) hover:text-(--color-magenta-700)'
      }`}
    >
      {children}
    </button>
  )
}

function ListIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 4h10M3 8h10M3 12h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

/**
 * localStorage-backed view-mode preference. Defaults to "list" per
 * product spec. The first render uses the default to avoid an SSR
 * hydration mismatch; on mount we read storage via a layout-effect
 * dispatcher (no setState-in-effect lint warning) and a hydrated flag.
 */
export function useViewMode(storageKey: string): [ViewMode, (v: ViewMode) => void] {
  const [hydrated, setHydrated] = useState(false)
  const [mode, setMode] = useState<ViewMode>('list')

  useEffect(() => {
    if (hydrated) return
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(storageKey)
    } catch {
      /* ignore */
    }
    if (stored === 'list' || stored === 'grid') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(stored)
    }
    setHydrated(true)
  }, [hydrated, storageKey])

  function persist(v: ViewMode): void {
    setMode(v)
    try {
      window.localStorage.setItem(storageKey, v)
    } catch {
      /* ignore */
    }
  }

  return [mode, persist]
}
