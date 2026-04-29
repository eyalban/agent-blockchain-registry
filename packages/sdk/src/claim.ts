/**
 * ClaimClient — attribute an agent or a company back to a statem8
 * user account using a bearer claim key issued from the user's
 * /workspace/claim-keys page.
 *
 * The claim key is a long-lived secret. The agent operator pastes it
 * into the agent's config (e.g. alongside its on-chain private key in
 * agent-XX.env), and the agent calls one of these methods exactly once
 * after it has registered itself on chain.
 *
 * @example
 * ```ts
 * import { AgentRegistryClient } from '@agent-registry/sdk'
 *
 * const client = new AgentRegistryClient({ chain: 'base-sepolia' })
 *
 * await client.claim.agent({
 *   claimKey: process.env.STATEM8_CLAIM_KEY!,
 *   agentId: '5266',
 * })
 * ```
 */

import { ApiError } from './errors'

const DEFAULT_API_URL = 'https://statem8.app/api/v1'

export interface ClaimAgentParams {
  /** Bearer claim key issued from /workspace/claim-keys (begins `sm8_`). */
  readonly claimKey: string
  /** ERC-8004 agent id (decimal string or bigint). */
  readonly agentId: string | bigint
}

export interface ClaimCompanyParams {
  /** Bearer claim key issued from /workspace/claim-keys. */
  readonly claimKey: string
  /** CompanyRegistry company id (decimal string or bigint). */
  readonly companyId: string | bigint
}

export interface ClaimAgentResult {
  readonly agentId: string
  readonly walletAddress: string
}

export interface ClaimCompanyResult {
  readonly companyId: string
  readonly walletAddress: string
}

interface ApiErrorBody {
  error?: string
  code?: string
}

export class ClaimClient {
  readonly #apiUrl: string

  constructor(apiUrl?: string) {
    this.#apiUrl = (apiUrl ?? DEFAULT_API_URL).replace(/\/$/, '')
  }

  async agent(params: ClaimAgentParams): Promise<ClaimAgentResult> {
    const res = await fetch(`${this.#apiUrl}/claim/agent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${params.claimKey}`,
      },
      body: JSON.stringify({ agentId: String(params.agentId) }),
    })
    return this.#handle<ClaimAgentResult>(res, 'claim/agent')
  }

  async company(params: ClaimCompanyParams): Promise<ClaimCompanyResult> {
    const res = await fetch(`${this.#apiUrl}/claim/company`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${params.claimKey}`,
      },
      body: JSON.stringify({ companyId: String(params.companyId) }),
    })
    return this.#handle<ClaimCompanyResult>(res, 'claim/company')
  }

  async #handle<T>(res: Response, path: string): Promise<T> {
    if (res.ok) {
      return (await res.json()) as T
    }
    let body: ApiErrorBody = {}
    try {
      body = (await res.json()) as ApiErrorBody
    } catch {
      /* ignore */
    }
    const message = body.code
      ? `${body.error ?? path}: ${body.code}`
      : body.error ?? `${path} failed (${res.status})`
    throw new ApiError(message, res.status)
  }
}
