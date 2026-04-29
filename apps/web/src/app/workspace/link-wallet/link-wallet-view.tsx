'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAccount, useConnect, useSignMessage } from 'wagmi'

type Mode = 'browser' | 'paste'

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const SIG_RE = /^0x[a-fA-F0-9]+$/

export function LinkWalletView() {
  const router = useRouter()
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors, isPending: connectPending } = useConnect()
  const { signMessageAsync } = useSignMessage()

  const [agentIdInput, setAgentIdInput] = useState('')
  const [resolvingAgent, setResolvingAgent] = useState(false)
  const [agentLookupError, setAgentLookupError] = useState<string | null>(null)

  const [walletAddress, setWalletAddress] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [challenge, setChallenge] = useState<string | null>(null)
  const [challengeError, setChallengeError] = useState<string | null>(null)

  const [mode, setMode] = useState<Mode>('paste')
  const [signature, setSignature] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const addressValid = ADDRESS_RE.test(walletAddress.trim())
  const sigValid = SIG_RE.test(signature.trim())

  async function lookupAgentOwner(): Promise<void> {
    if (!agentIdInput.trim()) return
    setResolvingAgent(true)
    setAgentLookupError(null)
    try {
      const res = await fetch(
        `/api/v1/agents/${encodeURIComponent(agentIdInput.trim())}`,
      )
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Lookup failed (${res.status})`)
      }
      const data = (await res.json()) as { owner?: string }
      if (!data.owner) throw new Error('Agent has no owner on-chain')
      setWalletAddress(data.owner.toLowerCase())
      setChallenge(null)
      setSignature('')
      setVerifyError(null)
    } catch (err) {
      setAgentLookupError(
        err instanceof Error ? err.message : 'Could not resolve agent owner',
      )
    } finally {
      setResolvingAgent(false)
    }
  }

  async function getChallenge(): Promise<void> {
    if (!addressValid) return
    setIssuing(true)
    setChallengeError(null)
    setChallenge(null)
    setSignature('')
    setVerifyError(null)
    try {
      const res = await fetch('/api/v1/auth/wallet/challenge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddress.trim() }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Could not start link (${res.status})`)
      }
      const data = (await res.json()) as { message: string }
      setChallenge(data.message)
    } catch (err) {
      setChallengeError(
        err instanceof Error ? err.message : 'Could not start link',
      )
    } finally {
      setIssuing(false)
    }
  }

  async function signWithBrowserWallet(): Promise<void> {
    if (!challenge || !connectedAddress) return
    if (connectedAddress.toLowerCase() !== walletAddress.trim().toLowerCase()) {
      setVerifyError(
        `Connected wallet (${connectedAddress.slice(0, 10)}…) does not match the address you entered. Use paste-signature mode instead.`,
      )
      return
    }
    setSubmitting(true)
    setVerifyError(null)
    try {
      const sig = await signMessageAsync({ message: challenge })
      await submitSignature(sig)
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Sign cancelled')
      setSubmitting(false)
    }
  }

  async function submitPastedSignature(): Promise<void> {
    if (!sigValid) return
    setSubmitting(true)
    setVerifyError(null)
    await submitSignature(signature.trim())
  }

  async function submitSignature(sig: string): Promise<void> {
    try {
      const res = await fetch('/api/v1/auth/wallet/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddress.trim(),
          signature: sig,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Verification failed (${res.status})`)
      }
      router.push('/workspace?linked=' + encodeURIComponent(walletAddress.trim()))
      router.refresh()
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : 'Verification failed',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/workspace"
        className="inline-flex items-center gap-1 text-sm text-(--color-text-secondary) transition-colors hover:text-(--color-magenta-700)"
      >
        ← Back to workspace
      </Link>

      <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
        Verify wallet ownership
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
        Link a wallet to your account
      </h1>
      <p className="mt-3 max-w-2xl text-(--color-text-secondary)">
        Each agent registered through the framework has its own wallet (the one
        in <code className="rounded border border-(--color-border) bg-(--color-bg-secondary) px-1.5 py-0.5 font-mono text-xs">agent-XX.env</code>).
        Sign the challenge with that wallet and the agent — plus any company it
        is a member of, plus invoices it issued or received — will appear in
        your workspace.
      </p>

      {/* Step 1 — pick the address */}
      <section className="mt-8 rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <Header step={1} title="Choose the wallet" />
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          You can paste the address directly, or look it up by agent ID — we
          read <code className="font-mono text-xs">ownerOf(agentId)</code> from
          the IdentityRegistry on Base.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={agentIdInput}
            onChange={(e) => setAgentIdInput(e.target.value.replace(/\D/g, ''))}
            placeholder="Agent ID (e.g. 5266 for foxtail)"
            className="w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 font-mono text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
          />
          <button
            type="button"
            onClick={lookupAgentOwner}
            disabled={resolvingAgent || !agentIdInput.trim()}
            className="rounded-xl border border-(--color-border) bg-white px-4 py-2.5 text-sm font-medium text-(--color-text-primary) transition-colors hover:border-(--color-magenta-300) hover:text-(--color-magenta-700) disabled:opacity-50"
          >
            {resolvingAgent ? 'Looking up…' : 'Resolve owner'}
          </button>
        </div>
        {agentLookupError && (
          <p className="mt-2 text-xs text-red-700">{agentLookupError}</p>
        )}

        <label className="mt-5 block text-sm font-medium text-(--color-text-primary)">
          Wallet address
        </label>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => {
            setWalletAddress(e.target.value.trim())
            setChallenge(null)
            setSignature('')
            setVerifyError(null)
          }}
          placeholder="0x…"
          className="mt-1.5 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 font-mono text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
        />

        <button
          type="button"
          onClick={getChallenge}
          disabled={!addressValid || issuing}
          className="mt-5 w-full rounded-full bg-(--color-magenta-700) px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800) disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {issuing ? 'Generating challenge…' : 'Generate signing challenge'}
        </button>
        {challengeError && (
          <p className="mt-2 text-sm text-red-700">{challengeError}</p>
        )}
      </section>

      {/* Step 2 — sign */}
      <section
        className={`mt-6 rounded-2xl border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
          challenge ? 'border-(--color-border)' : 'border-(--color-border) opacity-60'
        }`}
      >
        <Header step={2} title="Sign the challenge" />
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          Copy the message below and sign it with the wallet&rsquo;s private
          key. The signature is verified server-side with{' '}
          <code className="font-mono text-xs">viem.verifyMessage</code>; only a
          signature from the matching key will succeed.
        </p>

        <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-(--color-border) bg-(--color-bg-secondary) p-4 font-mono text-xs text-(--color-text-primary)">
          {challenge ?? 'Generate a challenge above to populate this message.'}
        </pre>
        {challenge && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(challenge)}
            className="mt-2 text-xs font-medium text-(--color-magenta-700) hover:underline"
          >
            Copy message
          </button>
        )}

        {challenge && (
          <div className="mt-5 inline-flex rounded-full border border-(--color-border) bg-white p-0.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <ModeButton active={mode === 'paste'} onClick={() => setMode('paste')}>
              Paste signature
            </ModeButton>
            <ModeButton active={mode === 'browser'} onClick={() => setMode('browser')}>
              Sign with browser wallet
            </ModeButton>
          </div>
        )}

        {challenge && mode === 'paste' && (
          <PasteHelp address={walletAddress.trim()} message={challenge} />
        )}

        {challenge && mode === 'paste' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-(--color-text-primary)">
              Signature (hex)
            </label>
            <textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value.trim())}
              rows={3}
              placeholder="0x…"
              className="mt-1.5 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 font-mono text-xs text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
            />
            <button
              type="button"
              onClick={submitPastedSignature}
              disabled={!sigValid || submitting}
              className="mt-3 w-full rounded-full bg-(--color-magenta-700) px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800) disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {submitting ? 'Verifying…' : 'Verify and link wallet'}
            </button>
          </div>
        )}

        {challenge && mode === 'browser' && (
          <div className="mt-5 rounded-xl border border-(--color-border) bg-(--color-bg-secondary) p-4">
            {!isConnected ? (
              <div>
                <p className="text-sm text-(--color-text-secondary)">
                  Connect a browser wallet that holds this address, then sign.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {connectors.map((c) => (
                    <button
                      key={c.uid}
                      type="button"
                      onClick={() => connect({ connector: c })}
                      disabled={connectPending}
                      className="rounded-full border border-(--color-magenta-200) bg-white px-3 py-1.5 text-xs font-medium text-(--color-magenta-700) transition-colors hover:bg-(--color-magenta-50) disabled:opacity-50"
                    >
                      {c.name === 'Injected' ? 'Browser wallet' : c.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : connectedAddress?.toLowerCase() !== walletAddress.trim().toLowerCase() ? (
              <p className="text-sm text-red-700">
                Connected wallet is{' '}
                <span className="font-mono">{connectedAddress?.slice(0, 10)}…</span>,
                which doesn&rsquo;t match the address above. Switch the active
                account in your wallet, or use paste-signature mode.
              </p>
            ) : (
              <button
                type="button"
                onClick={signWithBrowserWallet}
                disabled={submitting}
                className="w-full rounded-full bg-(--color-magenta-700) px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800) disabled:opacity-50"
              >
                {submitting
                  ? 'Waiting for wallet…'
                  : 'Sign with connected wallet & link'}
              </button>
            )}
          </div>
        )}

        {verifyError && (
          <p className="mt-3 text-sm text-red-700">{verifyError}</p>
        )}
      </section>
    </div>
  )
}

function Header({ step, title }: { readonly step: number; readonly title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) font-mono text-xs font-semibold text-(--color-magenta-700)">
        {step}
      </span>
      <h2 className="text-base font-semibold text-(--color-text-primary)">{title}</h2>
    </div>
  )
}

function ModeButton({
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
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-(--color-magenta-700) text-white shadow-[0_4px_12px_-4px_rgba(219,39,119,0.45)]'
          : 'text-(--color-text-secondary) hover:text-(--color-magenta-700)'
      }`}
    >
      {children}
    </button>
  )
}

function PasteHelp({
  address,
  message,
}: {
  readonly address: string
  readonly message: string
}) {
  // Single-line, escaped form for the snippets so the user can paste them
  // straight into a shell.
  const oneLine = JSON.stringify(message)

  return (
    <details className="mt-5 rounded-xl border border-(--color-magenta-200) bg-(--color-magenta-50) p-4 text-sm text-(--color-text-secondary)">
      <summary className="cursor-pointer font-medium text-(--color-magenta-700)">
        How to sign with an agent&rsquo;s key from the framework
      </summary>
      <p className="mt-3">
        For an agent provisioned by the framework README (Path B / C), the
        private key lives in <code className="font-mono text-xs">agents/configs/agent-XX.env</code>{' '}
        as <code className="font-mono text-xs">PRIVATE_KEY=…</code>. Sign the
        message locally with one of these — never paste the key into a website.
      </p>

      <p className="mt-4 font-medium text-(--color-text-primary)">
        Foundry <code className="font-mono">cast</code>
      </p>
      <pre className="mt-1.5 overflow-x-auto rounded-lg border border-(--color-magenta-200) bg-white p-3 font-mono text-[11px] leading-5 text-(--color-text-primary)">
{`cast wallet sign --private-key $PRIVATE_KEY ${oneLine}`}
      </pre>

      <p className="mt-4 font-medium text-(--color-text-primary)">
        Node + viem
      </p>
      <pre className="mt-1.5 overflow-x-auto rounded-lg border border-(--color-magenta-200) bg-white p-3 font-mono text-[11px] leading-5 text-(--color-text-primary)">
{`node -e "
  import('viem/accounts').then(async ({ privateKeyToAccount }) => {
    const acc = privateKeyToAccount(process.env.PRIVATE_KEY);
    console.log(await acc.signMessage({ message: ${oneLine} }));
  });
"`}
      </pre>

      <p className="mt-4 text-xs text-(--color-text-muted)">
        Either command prints a 0x-prefixed signature. Paste it into the field
        below. The expected signer is{' '}
        <span className="font-mono text-(--color-text-primary)">{address}</span>.
      </p>
    </details>
  )
}
