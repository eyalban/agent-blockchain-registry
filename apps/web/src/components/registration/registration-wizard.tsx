'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'

import { useRegisterAgent } from '@/hooks/use-register-agent'
import { useRegistrationFee } from '@/hooks/use-registration-fee'
import { useIpfsUpload } from '@/hooks/use-ipfs-upload'
import { TxStatus } from '@/components/web3/tx-status'
import { ERC8004_REGISTRATION_TYPE } from '@agent-registry/shared'

type Step = 'info' | 'services' | 'tags' | 'review' | 'submit'

const STEPS: { id: Step; label: string }[] = [
  { id: 'info', label: 'Agent Info' },
  { id: 'services', label: 'Services' },
  { id: 'tags', label: 'Tags' },
  { id: 'review', label: 'Review' },
  { id: 'submit', label: 'Submit' },
]

const SUGGESTED_TAGS = [
  'defi', 'trading', 'nft', 'gaming', 'social', 'analytics',
  'research', 'assistant', 'automation', 'security', 'governance', 'data',
]

export function RegistrationWizard() {
  const { isConnected } = useAccount()
  const { fee, isLoading: feeLoading } = useRegistrationFee()
  const {
    registerAgent, hash, isPending, isConfirming, isSuccess, error,
  } = useRegisterAgent()
  const { upload: uploadToIPFS, isUploading } = useIpfsUpload()

  const [currentStep, setCurrentStep] = useState<Step>('info')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')
  const [serviceType, setServiceType] = useState('a2a')
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-(--color-border) bg-white p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-magenta-50) text-(--color-magenta-700)">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path d="M9 7h-3a3 3 0 100 6h3M15 17h3a3 3 0 100-6h-3M8 12h8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-5 text-lg font-semibold text-(--color-text-primary)">
          Connect your wallet
        </h3>
        <p className="mt-2 max-w-sm mx-auto text-sm text-(--color-text-secondary)">
          Registration mints an ERC-8004 agent NFT on Base. You&rsquo;ll need a
          wallet to sign the transaction.
        </p>
      </div>
    )
  }

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const canGoNext = (() => {
    switch (currentStep) {
      case 'info': return name.trim().length > 0 && description.trim().length > 0
      case 'services': return true
      case 'tags': return true
      case 'review': return true
      default: return false
    }
  })()

  async function handleSubmit(): Promise<void> {
    setCurrentStep('submit')

    // Build the ERC-8004 agent card JSON
    const agentCard = {
      type: ERC8004_REGISTRATION_TYPE,
      name: name.trim(),
      description: description.trim(),
      image: imageUrl.trim() || 'https://placehold.co/400x400/0f1520/00e5ff?text=' + encodeURIComponent(name.slice(0, 2).toUpperCase()),
      ...(serviceUrl.trim() ? {
        services: [{ type: serviceType, url: serviceUrl.trim() }],
      } : {}),
      active: true,
    }

    try {
      // Upload to IPFS (or fallback to data URI)
      const agentURI = await uploadToIPFS(agentCard)
      registerAgent(agentURI, [], tags, fee ?? BigInt(0))
    } catch {
      // Fallback to data URI if upload fails
      const encoded = btoa(JSON.stringify(agentCard))
      registerAgent(`data:application/json;base64,${encoded}`, [], tags, fee ?? BigInt(0))
    }
  }

  function toggleTag(tag: string): void {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 10 ? [...prev, tag] : prev,
    )
  }

  function addCustomTag(): void {
    const trimmed = customTag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags((prev) => [...prev, trimmed])
      setCustomTag('')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1 border-b border-(--color-border) bg-(--color-bg-secondary) px-6 py-4">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (i < currentStepIndex ? setCurrentStep(step.id) : undefined)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                i === currentStepIndex
                  ? 'bg-(--color-magenta-700) text-white shadow-[0_4px_12px_-4px_rgba(219,39,119,0.45)]'
                  : i < currentStepIndex
                    ? 'bg-(--color-magenta-100) text-(--color-magenta-700)'
                    : 'border border-(--color-border) bg-white text-(--color-text-muted)'
              }`}
            >
              {i < currentStepIndex ? '✓' : i + 1}
            </button>
            <span
              className={`hidden text-xs sm:inline ${
                i === currentStepIndex
                  ? 'font-medium text-(--color-text-primary)'
                  : 'text-(--color-text-muted)'
              }`}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-px w-6 ${
                  i < currentStepIndex
                    ? 'bg-(--color-magenta-300)'
                    : 'bg-(--color-border)'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="p-6">
        {/* Step 1: Agent Info */}
        {currentStep === 'info' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium tracking-tight text-(--color-text-primary)">
                Agent Name <span className="text-(--color-magenta-700)">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My DeFi Agent"
                maxLength={100}
                className="mt-1 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-xs font-medium tracking-tight text-(--color-text-primary)">
                Description <span className="text-(--color-magenta-700)">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your agent does, its capabilities, and how it can be reached..."
                maxLength={2000}
                rows={4}
                className="mt-1 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
              />
              <p className="mt-1 text-xs text-(--color-text-muted) font-mono">{description.length}/2000</p>
            </div>
            <div>
              <label htmlFor="imageUrl" className="block text-xs font-medium tracking-tight text-(--color-text-primary)">
                Image URL (optional)
              </label>
              <input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/agent-avatar.png"
                className="mt-1 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
              />
            </div>
          </div>
        )}

        {/* Step 2: Services */}
        {currentStep === 'services' && (
          <div className="space-y-4">
            <p className="text-sm text-(--color-text-secondary)">
              Add a service endpoint so other agents can interact with yours. This is optional.
            </p>
            <div>
              <label htmlFor="serviceType" className="block text-xs font-medium tracking-tight text-(--color-text-primary)">
                Service Type
              </label>
              <select
                id="serviceType"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
              >
                <option value="a2a">A2A (Agent-to-Agent)</option>
                <option value="mcp">MCP (Model Context Protocol)</option>
                <option value="oasf">OASF</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label htmlFor="serviceUrl" className="block text-xs font-medium tracking-tight text-(--color-text-primary)">
                Service URL
              </label>
              <input
                id="serviceUrl"
                type="url"
                value={serviceUrl}
                onChange={(e) => setServiceUrl(e.target.value)}
                placeholder="https://my-agent.example.com/api"
                className="mt-1 w-full rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
              />
            </div>
          </div>
        )}

        {/* Step 3: Tags */}
        {currentStep === 'tags' && (
          <div className="space-y-4">
            <p className="text-sm text-(--color-text-secondary)">
              Add up to 10 tags to help others discover your agent. Tags are stored on-chain.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                    tags.includes(tag)
                      ? 'bg-(--color-magenta-700) text-white shadow-[0_4px_12px_-4px_rgba(219,39,119,0.45)]'
                      : 'border border-(--color-border) bg-white text-(--color-text-secondary) hover:border-(--color-magenta-300) hover:bg-(--color-magenta-50) hover:text-(--color-magenta-700)'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                placeholder="Add custom tag..."
                maxLength={32}
                className="flex-1 rounded-xl border border-(--color-border) bg-white px-3.5 py-2.5 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-(--color-magenta-500) focus:outline-none focus:ring-2 focus:ring-(--color-magenta-500)/20"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="rounded-xl border border-(--color-border) bg-white px-4 py-2.5 text-sm font-medium text-(--color-text-primary) transition-colors hover:border-(--color-magenta-300) hover:text-(--color-magenta-700)"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-(--color-text-muted) font-mono">{tags.length}/10 tags selected</p>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 'review' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-(--color-text-primary)">Review your agent</h3>
            <div className="rounded-2xl border border-(--color-border) bg-(--color-bg-secondary) p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-(--color-magenta-500) to-(--color-magenta-700) text-lg font-semibold text-white">
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-(--color-text-primary)">{name}</p>
                  <p className="font-mono text-xs text-(--color-text-muted)">ERC-8004 agent</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-(--color-text-secondary)">{description}</p>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-(--color-magenta-200) bg-(--color-magenta-50) px-2.5 py-0.5 font-mono text-xs font-medium text-(--color-magenta-700)"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {serviceUrl && (
                <p className="mt-3 font-mono text-xs text-(--color-text-muted)">
                  Service: {serviceType.toUpperCase()} at {serviceUrl}
                </p>
              )}
            </div>
            <div className="flex items-baseline justify-between rounded-2xl border border-(--color-border) bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
                  Registration fee
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-(--color-text-primary)">
                  {feeLoading ? '…' : fee ? `${formatEther(fee)} ETH` : 'Free'}
                </p>
              </div>
              <p className="text-xs text-(--color-text-muted)">+ gas fees</p>
            </div>
          </div>
        )}

        {/* Step 5: Submit */}
        {currentStep === 'submit' && (
          <div className="space-y-4">
            {isUploading && (
              <div className="rounded-2xl border border-(--color-magenta-200) bg-(--color-magenta-50) p-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-magenta-700) border-t-transparent" />
                  <p className="text-sm font-medium text-(--color-magenta-700)">
                    Uploading agent card to IPFS…
                  </p>
                </div>
              </div>
            )}
            <TxStatus
              hash={hash}
              isPending={isPending}
              isConfirming={isConfirming}
              isSuccess={isSuccess}
              error={error}
            />
            {isSuccess && (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M5 12l5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-(--color-text-primary)">
                  Agent registered
                </h3>
                <p className="mt-2 text-sm text-(--color-text-secondary)">
                  Your agent is now on Base and discoverable by any ERC-8004 client.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {currentStep !== 'submit' && (
        <div className="flex items-center justify-between border-t border-(--color-border) bg-(--color-bg-secondary) px-6 py-4">
          <button
            type="button"
            onClick={() => setCurrentStep(STEPS[currentStepIndex - 1]!.id)}
            disabled={currentStepIndex === 0}
            className="rounded-full px-4 py-2 text-sm font-medium text-(--color-text-secondary) transition-colors hover:bg-white hover:text-(--color-text-primary) disabled:invisible"
          >
            Back
          </button>
          {currentStep === 'review' ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-full bg-(--color-magenta-700) px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800)"
            >
              Register Agent
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep(STEPS[currentStepIndex + 1]!.id)}
              disabled={!canGoNext}
              className="rounded-full bg-(--color-magenta-700) px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(219,39,119,0.45)] transition-colors hover:bg-(--color-magenta-800) disabled:opacity-40 disabled:shadow-none"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  )
}
