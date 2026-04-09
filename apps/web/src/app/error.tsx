'use client'

interface ErrorPageProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-(--color-accent-red)/10 glow-red">
          <span className="text-3xl">!</span>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-(--color-text-primary)">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-(--color-text-muted)">
            Error ID: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-(--color-accent-cyan) px-6 py-2.5 text-sm font-semibold text-(--color-bg-primary) transition-all hover:opacity-90 glow-cyan-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
