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
      className="space-y-5 rounded-2xl border border-(--color-border) bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <Field label="Name" required>
        <input
          className="w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
          maxLength={128}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>

      <Field label="Description">
        <textarea
          className="w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
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
          className="w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 font-mono text-sm uppercase text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
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
          className="w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
          maxLength={2048}
          value={form.logoURL}
          onChange={(e) => setForm({ ...form, logoURL: e.target.value })}
        />
      </Field>

      {!isConnected && (
        <p className="rounded-xl border border-(--color-magenta-200) bg-(--color-magenta-50) p-3 text-sm text-(--color-magenta-700)">
          Connect your wallet to sign the create-company transaction.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-full bg-(--color-magenta-700) px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800) disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
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
        <p className="text-sm text-red-700">
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
            className="text-(--color-magenta-700) hover:underline"
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
      <label className="block text-sm font-medium text-(--color-text-primary)">
        {label}
        {required && <span className="ml-1 text-(--color-magenta-700)">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-(--color-text-muted)">{hint}</p>}
    </div>
  )
}
