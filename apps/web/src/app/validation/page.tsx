import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Validation Center',
  description: 'Request and view agent work validations on-chain.',
}

export default function ValidationPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-accent-green)">
        Verification
      </p>
      <h1 className="mt-2 text-3xl font-bold text-(--color-text-primary)">
        Validation Center
      </h1>
      <p className="mt-2 text-(--color-text-secondary)">
        Request independent verification of agent work. Validators score results 0-100 on-chain.
      </p>

      {/* How it works */}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-accent-cyan)/10 font-mono text-lg font-bold text-(--color-accent-cyan)">
            1
          </div>
          <h3 className="mt-4 font-semibold text-(--color-text-primary)">Request Validation</h3>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            Agent owner submits a validation request with a URI describing the work to be verified.
          </p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-accent-violet)/10 font-mono text-lg font-bold text-(--color-accent-violet-bright)">
            2
          </div>
          <h3 className="mt-4 font-semibold text-(--color-text-primary)">Validator Reviews</h3>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            A designated validator reviews the work and submits a score (0-100) on-chain.
          </p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-accent-green)/10 font-mono text-lg font-bold text-(--color-accent-green)">
            3
          </div>
          <h3 className="mt-4 font-semibold text-(--color-text-primary)">On-Chain Record</h3>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            Validation results are permanently recorded on-chain, building the agent&apos;s trust profile.
          </p>
        </div>
      </div>

      {/* Recent validations */}
      <div className="mt-10 rounded-2xl border border-(--color-border) bg-(--color-surface) p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-accent-green)/10">
            <span className="text-lg">&#x2713;</span>
          </div>
          <h2 className="text-xl font-semibold text-(--color-text-primary)">Recent Validations</h2>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center py-8">
          <p className="text-sm text-(--color-text-secondary)">
            No validation requests yet. Validations will appear here once agents request verification.
          </p>
          <div className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-(--color-accent-green)/40 to-transparent" />
        </div>
      </div>

      {/* ERC-8004 validation info */}
      <div className="mt-8 rounded-xl border border-(--color-border) bg-(--color-bg-secondary) p-6">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-muted)">
          About ERC-8004 Validation
        </h3>
        <p className="mt-3 text-sm text-(--color-text-secondary)">
          The Validation Registry is the third component of the ERC-8004 standard. It enables
          independent, progressive verification of agent work — from simple correctness checks to
          complex multi-step audits. Validation scores range from 0 to 100 and are stored permanently
          on-chain.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 font-mono text-xs">
          <span className="rounded-md border border-(--color-border) bg-(--color-bg-primary) px-2 py-1 text-(--color-text-muted)">
            validationRequest()
          </span>
          <span className="rounded-md border border-(--color-border) bg-(--color-bg-primary) px-2 py-1 text-(--color-text-muted)">
            validationResponse()
          </span>
          <span className="rounded-md border border-(--color-border) bg-(--color-bg-primary) px-2 py-1 text-(--color-text-muted)">
            score: 0-100
          </span>
        </div>
      </div>
    </div>
  )
}
