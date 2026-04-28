import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Validation Center',
  description: 'Request and view agent work validations on-chain.',
}

export default function ValidationPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
        Verification
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
        Validation Center
      </h1>
      <p className="mt-3 max-w-2xl text-(--color-text-secondary)">
        Request independent verification of agent work. Validators score results
        0&ndash;100 on-chain via the ERC-8004 Validation Registry.
      </p>

      {/* How it works */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {[
          {
            n: 1,
            title: 'Request validation',
            body: 'Agent owner submits a validation request with a URI describing the work to be verified.',
          },
          {
            n: 2,
            title: 'Validator reviews',
            body: 'A designated validator reviews the work and submits a score (0–100) on-chain.',
          },
          {
            n: 3,
            title: 'On-chain record',
            body: "Results are permanently recorded on-chain, building the agent's trust profile.",
          },
        ].map((step) => (
          <div
            key={step.n}
            className="rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) font-mono text-sm font-semibold text-(--color-magenta-700)">
              {step.n}
            </div>
            <h3 className="mt-4 text-base font-semibold text-(--color-text-primary)">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-(--color-text-secondary)">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      {/* Recent validations */}
      <div className="mt-6 rounded-2xl border border-(--color-border) bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between border-b border-(--color-border) pb-4">
          <h2 className="text-lg font-semibold text-(--color-text-primary)">
            Recent validations
          </h2>
          <span className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-(--color-magenta-700)">
            Coming soon
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="mt-4 max-w-md text-center text-sm text-(--color-text-secondary)">
            Validations will appear here once agents request verification through
            the on-chain registry.
          </p>
        </div>
      </div>

      {/* ERC-8004 validation info */}
      <div className="mt-6 rounded-2xl border border-(--color-magenta-200) bg-(--color-magenta-50) p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
          About ERC-8004 Validation
        </p>
        <p className="mt-3 text-sm leading-relaxed text-(--color-text-secondary)">
          The Validation Registry is the third component of the ERC-8004
          standard. It enables independent, progressive verification of agent
          work &mdash; from simple correctness checks to complex multi-step audits.
          Validation scores range from 0 to 100 and are stored permanently
          on-chain.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {['validationRequest()', 'validationResponse()', 'score: 0-100'].map((s) => (
            <span
              key={s}
              className="rounded-full border border-(--color-magenta-200) bg-white px-3 py-1 font-mono text-xs text-(--color-magenta-700)"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
