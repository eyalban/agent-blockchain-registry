'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { ClaimKeyRow } from '@/lib/claim-keys'

interface Props {
  readonly initialKeys: readonly ClaimKeyRow[]
}

export function ClaimKeysView({ initialKeys }: Props) {
  const [keys, setKeys] = useState<readonly ClaimKeyRow[]>(initialKeys)
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<{
    plaintext: string
    keyPrefix: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  async function refresh(): Promise<void> {
    const res = await fetch('/api/v1/auth/claim-keys', { cache: 'no-store' })
    if (res.ok) {
      const data = (await res.json()) as { keys: ClaimKeyRow[] }
      setKeys(data.keys)
    }
  }

  async function createKey(): Promise<void> {
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/v1/auth/claim-keys', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || undefined }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Could not create key')
      }
      const data = (await res.json()) as {
        key: ClaimKeyRow
        plaintext: string
      }
      setRevealed({ plaintext: data.plaintext, keyPrefix: data.key.keyPrefix })
      setLabel('')
      setCopied(false)
      await refresh()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create key')
    } finally {
      setCreating(false)
    }
  }

  async function revoke(id: string): Promise<void> {
    const ok = window.confirm(
      'Revoke this key? Any agent still using it will fail to authenticate.',
    )
    if (!ok) return
    const res = await fetch(`/api/v1/auth/claim-keys/${id}/revoke`, {
      method: 'POST',
    })
    if (res.ok) await refresh()
  }

  async function copyKey(): Promise<void> {
    if (!revealed) return
    await navigator.clipboard.writeText(revealed.plaintext)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/workspace"
        className="inline-flex items-center gap-1 text-sm text-(--color-text-secondary) transition-colors hover:text-(--color-magenta-700)"
      >
        ← Back to workspace
      </Link>

      <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
        Agent attribution
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
        Claim keys
      </h1>
      <p className="mt-3 max-w-2xl text-(--color-text-secondary)">
        A claim key is a bearer secret you give your agent. The agent calls the
        statem8 API with the key, and statem8 attributes the agent — plus any
        company it founds — to your account. Possession is authority, so share
        keys only with agents you operate.
      </p>

      {/* Reveal block: plaintext shown ONCE after creation */}
      {revealed && (
        <div className="mt-6 rounded-2xl border border-(--color-magenta-300) bg-(--color-magenta-50) p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
            Copy this key now — we won&rsquo;t show it again
          </p>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            statem8 only stores a hash. If you lose this string before pasting
            it into your agent&rsquo;s config, revoke it and create a new one.
          </p>
          <div className="mt-4 flex items-stretch gap-2">
            <code className="flex-1 break-all rounded-xl border border-(--color-magenta-200) bg-white px-4 py-3 font-mono text-sm text-(--color-magenta-800)">
              {revealed.plaintext}
            </code>
            <button
              type="button"
              onClick={copyKey}
              className="rounded-xl bg-(--color-magenta-700) px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-magenta-800)"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setRevealed(null)}
            className="mt-4 text-sm font-medium text-(--color-magenta-700) hover:underline"
          >
            I&rsquo;ve saved it — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      <section className="mt-6 rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h2 className="text-base font-semibold text-(--color-text-primary)">
          Create a new key
        </h2>
        <p className="mt-1.5 text-sm text-(--color-text-secondary)">
          Give it a label so you know which agent it belongs to.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. foxtail-staging"
            maxLength={80}
            className="flex-1 rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
          />
          <button
            type="button"
            onClick={createKey}
            disabled={creating}
            className="rounded-full bg-(--color-magenta-700) px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800) disabled:opacity-50"
          >
            {creating ? 'Generating…' : 'Generate key'}
          </button>
        </div>
        {createError && (
          <p className="mt-2 text-sm text-red-700">{createError}</p>
        )}
      </section>

      {/* Existing keys table */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="border-b border-(--color-border) px-6 py-4">
          <h2 className="text-base font-semibold text-(--color-text-primary)">
            Your keys
          </h2>
          <p className="text-xs text-(--color-text-muted)">
            {keys.length} key{keys.length === 1 ? '' : 's'}, including revoked
          </p>
        </div>
        {keys.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-(--color-text-muted)">
            No keys yet. Generate one above.
          </p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-(--color-border) bg-(--color-bg-secondary)">
              <tr>
                <Th>Label</Th>
                <Th>Key</Th>
                <Th>Created</Th>
                <Th>Last used</Th>
                <Th>Status</Th>
                <Th right>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr
                  key={k.id}
                  className="border-b border-(--color-border) last:border-b-0"
                >
                  <td className="px-4 py-3.5 text-sm text-(--color-text-primary)">
                    {k.label ?? <span className="text-(--color-text-muted)">—</span>}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-(--color-text-secondary)">
                    {k.keyPrefix}…
                  </td>
                  <td className="px-4 py-3.5 text-xs text-(--color-text-muted)">
                    {new Date(k.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-(--color-text-muted)">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'never'}
                  </td>
                  <td className="px-4 py-3.5">
                    {k.revokedAt ? (
                      <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-red-700">
                        Revoked
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {!k.revokedAt && (
                      <button
                        type="button"
                        onClick={() => revoke(k.id)}
                        className="text-xs font-medium text-red-700 hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Usage docs */}
      <section className="mt-6 rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--color-magenta-700)">
          How an agent uses the key
        </p>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          The claim API is plain HTTP — no SDK install required. Pick the
          scenario, copy the agent prompt, paste it into your agent&rsquo;s
          task input. The agent runs <code className="font-mono text-xs">curl</code>{' '}
          (or any HTTP client) under the hood.
        </p>

        <div className="mt-5 space-y-6">
          <Scenario
            title="Already on chain — claim an existing agent"
            prompt={`Claim agent #<AGENT_ID> on statem8 for me. Make this request:

POST https://agent-registry-seven.vercel.app/api/v1/claim/agent
Headers:
  Authorization: Bearer ${revealed?.plaintext ?? '<PASTE_CLAIM_KEY>'}
  Content-Type: application/json
Body:
  {"agentId": "<AGENT_ID>"}

A 200 response means the agent is now attributed to my account. A 401
means the key was revoked or wrong. Reply with the response body.`}
            curl={`curl -X POST https://agent-registry-seven.vercel.app/api/v1/claim/agent \\
  -H "Authorization: Bearer $STATEM8_CLAIM_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"agentId":"<AGENT_ID>"}'`}
          />

          <Scenario
            title="Fresh registration — agent registers itself, then claims"
            prompt={`After completing the framework's Path A or Path B onboarding (which
returns a new agentId), run one extra HTTP call to attribute the
agent to my statem8 account:

POST https://agent-registry-seven.vercel.app/api/v1/claim/agent
Headers:
  Authorization: Bearer ${revealed?.plaintext ?? '<PASTE_CLAIM_KEY>'}
  Content-Type: application/json
Body:
  {"agentId": "<AGENT_ID_FROM_REGISTRATION>"}`}
            curl={`# After the framework returns the new AGENT_ID:
curl -X POST https://agent-registry-seven.vercel.app/api/v1/claim/agent \\
  -H "Authorization: Bearer $STATEM8_CLAIM_KEY" \\
  -H "Content-Type: application/json" \\
  -d "{\\"agentId\\":\\"$AGENT_ID\\"}"`}
          />

          <Scenario
            title="Agent-created company — claim it back to me"
            prompt={`After you call CompanyRegistry.createCompany on chain (which returns
a new companyId), run this extra HTTP call to attribute the company:

POST https://agent-registry-seven.vercel.app/api/v1/claim/company
Headers:
  Authorization: Bearer ${revealed?.plaintext ?? '<PASTE_CLAIM_KEY>'}
  Content-Type: application/json
Body:
  {"companyId": "<COMPANY_ID_FROM_CREATION>"}`}
            curl={`# After the on-chain createCompany call returns COMPANY_ID:
curl -X POST https://agent-registry-seven.vercel.app/api/v1/claim/company \\
  -H "Authorization: Bearer $STATEM8_CLAIM_KEY" \\
  -H "Content-Type: application/json" \\
  -d "{\\"companyId\\":\\"$COMPANY_ID\\"}"`}
          />
        </div>

        <details className="mt-6 rounded-xl border border-(--color-border) bg-(--color-bg-secondary) p-4 text-sm text-(--color-text-secondary)">
          <summary className="cursor-pointer font-medium text-(--color-text-primary)">
            Optional: SDK install
          </summary>
          <p className="mt-2">
            <code className="font-mono text-xs">@agent-registry/sdk</code> is
            not on npm — install it from the framework repo:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-(--color-border) bg-white p-3 font-mono text-[11px] leading-5 text-(--color-text-primary)">
{`git clone https://github.com/eyalban/agent-registry-framework.git
cd agent-registry-framework && pnpm install && pnpm -F @agent-registry/sdk build
# then in your agent project:
pnpm add file:../agent-registry-framework/packages/sdk`}
          </pre>
          <p className="mt-2">After install:</p>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-(--color-border) bg-white p-3 font-mono text-[11px] leading-5 text-(--color-text-primary)">
{`import { AgentRegistryClient } from '@agent-registry/sdk'
const client = new AgentRegistryClient({ chain: 'base-sepolia' })
await client.claim.agent({ claimKey: process.env.STATEM8_CLAIM_KEY!, agentId })
await client.claim.company({ claimKey: process.env.STATEM8_CLAIM_KEY!, companyId })`}
          </pre>
        </details>
      </section>
    </div>
  )
}

function Scenario({
  title,
  prompt,
  curl,
}: {
  readonly title: string
  readonly prompt: string
  readonly curl: string
}) {
  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-bg-secondary) p-4">
      <p className="text-sm font-semibold text-(--color-text-primary)">
        {title}
      </p>
      <Block label="Agent prompt — paste into your agent's task input" body={prompt} />
      <Block label="curl — for direct testing" body={curl} />
    </div>
  )
}

function Block({
  label,
  body,
}: {
  readonly label: string
  readonly body: string
}) {
  const [copied, setCopied] = useState(false)
  async function copy(): Promise<void> {
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-(--color-text-muted)">
          {label}
        </p>
        <button
          type="button"
          onClick={copy}
          className="text-xs font-medium text-(--color-magenta-700) hover:underline"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-(--color-border) bg-white p-3 font-mono text-[11px] leading-5 text-(--color-text-primary)">
        {body}
      </pre>
    </div>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted) ${
        right ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}
