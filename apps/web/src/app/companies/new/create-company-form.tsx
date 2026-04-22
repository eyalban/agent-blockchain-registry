'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { useCreateCompany } from '@/hooks/use-create-company'
import { TX_EXPLORER_URL } from '@agent-registry/shared'
import { env } from '@/lib/env'

interface FormState {
  name: string
  description: string
  jurisdictionCode: string
  logoURL: string
}

const JURISDICTION_HINT = 'ISO-3166-1 alpha-3 (e.g. USA, DEU, GBR, JPN). Append -XX for a subdivision.'

export function CreateCompanyForm() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    jurisdictionCode: '',
    logoURL: '',
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const {
    createCompany,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    companyId,
    mirrorError,
    error,
  } = useCreateCompany()

  useEffect(() => {
    if (isSuccess && companyId) {
      const t = setTimeout(() => router.push(`/companies/${companyId}`), 1200)
      return () => clearTimeout(t)
    }
  }, [isSuccess, companyId, router])

  const canSubmit =
    isConnected &&
    !isUploading &&
    !isPending &&
    !isConfirming &&
    form.name.trim().length > 0 &&
    /^[A-Z]{3}(-[A-Z0-9]{1,3})?$/.test(form.jurisdictionCode.trim())

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!canSubmit) return

    setIsUploading(true)
    setUploadError(null)
    try {
      const metadata = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        jurisdictionCode: form.jurisdictionCode.trim(),
        logoURL: form.logoURL.trim() || undefined,
      }
      const res = await fetch('/api/v1/companies/metadata', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(metadata),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? `Upload failed (${res.status})`)
      }
      const { uri } = (await res.json()) as { uri: string }
      createCompany(uri)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-xl border border-(--color-border) bg-(--color-surface) p-6"
    >
      <Field label="Name" required>
        <input
          className="w-full rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) focus:border-(--color-accent-cyan) focus:outline-none"
          maxLength={128}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>

      <Field label="Description">
        <textarea
          className="w-full rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) focus:border-(--color-accent-cyan) focus:outline-none"
          rows={3}
          maxLength={2048}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>

      <Field
        label="Jurisdiction"
        required
        hint={JURISDICTION_HINT}
      >
        <input
          className="w-full rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 font-mono text-sm uppercase text-(--color-text-primary) focus:border-(--color-accent-cyan) focus:outline-none"
          maxLength={10}
          placeholder="USA"
          value={form.jurisdictionCode}
          onChange={(e) =>
            setForm({ ...form, jurisdictionCode: e.target.value.toUpperCase() })
          }
        />
      </Field>

      <Field label="Logo URL" hint="Optional https:// URL.">
        <input
          type="url"
          className="w-full rounded-md border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) focus:border-(--color-accent-cyan) focus:outline-none"
          maxLength={2048}
          value={form.logoURL}
          onChange={(e) => setForm({ ...form, logoURL: e.target.value })}
        />
      </Field>

      {!isConnected && (
        <p className="rounded-md border border-(--color-accent-amber)/30 bg-(--color-accent-amber)/5 p-3 text-sm text-(--color-accent-amber)">
          Connect your wallet to sign the create-company transaction.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-gradient-to-r from-(--color-accent-cyan) to-(--color-accent-violet) px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isUploading
          ? 'Uploading metadata to IPFS…'
          : isPending
            ? 'Waiting for wallet…'
            : isConfirming
              ? 'Confirming on-chain…'
              : isSuccess && companyId
                ? `Created company #${companyId} ✓`
                : 'Create Company'}
      </button>

      {(uploadError || error || mirrorError) && (
        <p className="text-sm text-(--color-accent-red)">
          {uploadError || error?.message || mirrorError}
        </p>
      )}

      {hash && (
        <p className="font-mono text-xs text-(--color-text-muted)">
          Tx:{' '}
          <Link
            href={TX_EXPLORER_URL(env.chainId, hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--color-accent-cyan) hover:underline"
          >
            {hash.slice(0, 10)}…{hash.slice(-6)}
          </Link>
        </p>
      )}
    </form>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted)">
        {label}
        {required && <span className="ml-1 text-(--color-accent-amber)">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-(--color-text-muted)">{hint}</p>}
    </div>
  )
}
