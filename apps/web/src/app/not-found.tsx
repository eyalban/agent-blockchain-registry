import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-6xl font-bold text-(--color-accent-cyan) text-glow-cyan">
          404
        </p>
        <h2 className="mt-4 text-2xl font-bold text-(--color-text-primary)">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-(--color-accent-cyan) px-6 py-2.5 text-sm font-semibold text-(--color-bg-primary) transition-all hover:opacity-90 glow-cyan-sm"
          >
            Go Home
          </Link>
          <Link
            href="/agents"
            className="rounded-xl border border-(--color-border) px-6 py-2.5 text-sm font-semibold text-(--color-text-secondary) transition-colors hover:border-(--color-border-bright)"
          >
            Browse Agents
          </Link>
        </div>
      </div>
    </div>
  )
}
