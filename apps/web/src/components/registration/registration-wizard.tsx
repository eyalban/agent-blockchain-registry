'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'

import { useRegisterAgent } from '@/hooks/use-register-agent'
import { useRegistrationFee } from '@/hooks/use-registration-fee'
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
      <div className="rounded-2xl border border-dashed border-(--color-border-bright) bg-(--color-bg-secondary) p-12 text-center">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-(--color-surface) glow-cyan-sm">
          <span className="text-3xl">🔗</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-(--color-text-primary)">
          Connect Your Wallet
        </h3>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          Connect your wallet to register an agent on the blockchain.
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

  function handleSubmit(): void {
    // Build the ERC-8004 agent card JSON
    const agentCard = {
      type: ERC8004_REGISTRATION_TYPE,
      name: name.trim(),
      description: description.trim(),
      image: imageUrl.trim() || 'https://placehold.co/400x400/1e3a5f/93c5fd?text=' + encodeURIComponent(name.slice(0, 2).toUpperCase()),
      ...(serviceUrl.trim() ? {
        services: [{ type: serviceType, url: serviceUrl.trim() }],
      } : {}),
      active: true,
    }

    // For now, use a data URI as the agent URI (in production, upload to IPFS first)
    const agentURI = `data:application/json;base64,${btoa(JSON.stringify(agentCard))}`

    registerAgent(agentURI, [], tags, fee ?? BigInt(0))
    setCurrentStep('submit')
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
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface)">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1 border-b border-(--color-border) px-6 py-4">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => i < currentStepIndex ? setCurrentStep(step.id) : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                i === currentStepIndex
                  ? 'bg-(--color-accent-cyan) text-(--color-bg-primary) glow-cyan-sm'
                  : i < currentStepIndex
                    ? 'bg-(--color-accent-green) text-(--color-bg-primary)'
                    : 'bg-(--color-bg-secondary) text-(--color-text-muted) border border-(--color-border)'
              }`}
            >
              {i < currentStepIndex ? '✓' : i + 1}
            </button>
            <span className={`hidden text-xs sm:inline ${
              i === currentStepIndex
                ? 'font-medium text-(--color-text-primary)'
                : 'text-(--color-text-muted)'
            }`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 h-px w-6 ${
                i < currentStepIndex
                  ? 'bg-(--color-accent-green)/40'
                  : 'bg-(--color-border)'
              }`} />
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
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-secondary) font-mono">
                Agent Name <span className="text-(--color-accent-red)">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My DeFi Agent"
                maxLength={100}
                className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) transition-all duration-200 focus:border-(--color-accent-cyan) focus:outline-none focus:glow-cyan-sm"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-secondary) font-mono">
                Description <span className="text-(--color-accent-red)">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your agent does, its capabilities, and how it can be reached..."
                maxLength={2000}
                rows={4}
                className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) transition-all duration-200 focus:border-(--color-accent-cyan) focus:outline-none focus:glow-cyan-sm"
              />
              <p className="mt-1 text-xs text-(--color-text-muted) font-mono">{description.length}/2000</p>
            </div>
            <div>
              <label htmlFor="imageUrl" className="block text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-secondary) font-mono">
                Image URL (optional)
              </label>
              <input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/agent-avatar.png"
                className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) transition-all duration-200 focus:border-(--color-accent-cyan) focus:outline-none focus:glow-cyan-sm"
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
              <label htmlFor="serviceType" className="block text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-secondary) font-mono">
                Service Type
              </label>
              <select
                id="serviceType"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) focus:border-(--color-accent-cyan) focus:outline-none focus:glow-cyan-sm"
              >
                <option value="a2a">A2A (Agent-to-Agent)</option>
                <option value="mcp">MCP (Model Context Protocol)</option>
                <option value="oasf">OASF</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label htmlFor="serviceUrl" className="block text-xs font-semibold uppercase tracking-[0.15em] text-(--color-text-secondary) font-mono">
                Service URL
              </label>
              <input
                id="serviceUrl"
                type="url"
                value={serviceUrl}
                onChange={(e) => setServiceUrl(e.target.value)}
                placeholder="https://my-agent.example.com/api"
                className="mt-1 w-full rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) transition-all duration-200 focus:border-(--color-accent-cyan) focus:outline-none focus:glow-cyan-sm"
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
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium font-mono transition-all ${
                    tags.includes(tag)
                      ? 'bg-(--color-accent-cyan) text-(--color-bg-primary) glow-cyan-sm'
                      : 'border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-secondary) hover:border-(--color-border-bright) hover:text-(--color-text-primary)'
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
                className="flex-1 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) px-3 py-2 text-sm text-(--color-text-primary) placeholder-(--color-text-muted) transition-all duration-200 focus:border-(--color-accent-cyan) focus:outline-none focus:glow-cyan-sm"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="rounded-lg border border-(--color-border-bright) bg-(--color-bg-secondary) px-4 py-2 text-sm font-medium text-(--color-text-secondary) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-text-primary)"
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
            <h3 className="text-lg font-semibold text-(--color-text-primary)">Review Your Agent</h3>
            <div className="gradient-border rounded-xl bg-(--color-bg-secondary) p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-(--color-accent-cyan) to-(--color-accent-violet) text-lg font-bold text-white glow-cyan-sm">
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-(--color-text-primary)">{name}</p>
                  <p className="text-xs text-(--color-text-muted) font-mono">ERC-8004 Agent</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-(--color-text-secondary)">{description}</p>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-md border border-(--color-accent-cyan)/20 bg-(--color-accent-cyan)/5 px-2 py-0.5 text-xs font-medium text-(--color-accent-cyan) font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {serviceUrl && (
                <p className="mt-3 text-xs text-(--color-text-muted) font-mono">
                  Service: {serviceType.toUpperCase()} at {serviceUrl}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
              <p className="text-sm text-(--color-text-secondary)">
                Registration fee:{' '}
                <span className="font-semibold text-(--color-text-primary) font-mono">
                  {feeLoading ? '...' : fee ? `${formatEther(fee)} ETH` : 'Free'}
                </span>
              </p>
              <p className="mt-1 text-xs text-(--color-text-muted)">
                Gas fees are additional and paid by your wallet.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Submit */}
        {currentStep === 'submit' && (
          <div className="space-y-4">
            <TxStatus
              hash={hash}
              isPending={isPending}
              isConfirming={isConfirming}
              isSuccess={isSuccess}
              error={error}
            />
            {isSuccess && (
              <div className="text-center">
                <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-(--color-accent-green)/10 glow-green">
                  <span className="text-3xl">🎉</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-(--color-text-primary)">
                  Agent Registered!
                </h3>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                  Your agent is now on the blockchain and discoverable by others.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {currentStep !== 'submit' && (
        <div className="flex items-center justify-between border-t border-(--color-border) px-6 py-4">
          <button
            type="button"
            onClick={() => setCurrentStep(STEPS[currentStepIndex - 1]!.id)}
            disabled={currentStepIndex === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-secondary) hover:text-(--color-text-primary) disabled:invisible"
          >
            Back
          </button>
          {currentStep === 'review' ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-lg bg-(--color-accent-cyan) px-6 py-2 text-sm font-semibold text-(--color-bg-primary) transition-all hover:brightness-110 glow-cyan-sm"
            >
              Register Agent
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep(STEPS[currentStepIndex + 1]!.id)}
              disabled={!canGoNext}
              className="rounded-lg bg-(--color-accent-cyan) px-6 py-2 text-sm font-semibold text-(--color-bg-primary) transition-all hover:brightness-110 glow-cyan-sm disabled:opacity-40 disabled:glow-none"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  )
}
