/**
 * Classifier v2 — calldata + event decoding for transaction labels.
 *
 * Replaces the address-only heuristic in tx-classifier.ts with real evidence:
 *   1. If tx.to is one of our known contracts, decode calldata against the
 *      contract's ABI and map the function selector to a label. This gives
 *      definitive classification ("this tx called Wrapper.registerAgent" =
 *      registration_fee, no guessing required).
 *   2. Scan the receipt logs for signature protocol events. If the tx emitted
 *      AgentRegisteredViaWrapper, it's definitively a registration.
 *   3. If neither applies, fall back to the v1 heuristic (low confidence).
 *
 * Each result carries `evidence` — the decoded function, arg summary, and
 * matched events — so downstream consumers (reconciler, audit UI) can see
 * exactly why a label was assigned.
 */

import {
  companyRegistryAbi,
  reputationRegistryAbi,
  wrapperAbi,
} from '@agent-registry/shared'
import {
  type Abi,
  type Hex,
  type PublicClient,
  type TransactionReceipt,
  decodeEventLog,
  decodeFunctionData,
} from 'viem'

import { env } from './env'
import { classifyTransaction as classifyHeuristic } from './tx-classifier'
import type { TransactionLabel } from './tx-classifier'
import { publicClient } from './viem-client'

export interface ClassificationEvidence {
  /** Decoded function the tx called, if known. */
  functionName?: string
  /** Event names found in the receipt that matched known signatures. */
  matchedEvents?: string[]
  /** Human-readable summary for audit UI. */
  note?: string
}

export interface ClassificationResult {
  label: TransactionLabel
  direction: 'incoming' | 'outgoing'
  confidence: 'high' | 'medium' | 'low'
  source: 'calldata' | 'event' | 'heuristic'
  evidence: ClassificationEvidence
}

interface KnownContract {
  address: `0x${string}`
  abi: Abi
  /** Maps function name → label for outgoing calls. */
  functionLabels: Record<string, TransactionLabel>
  /** Events whose presence confirms the contract was invoked. */
  confirmEvents: string[]
  /** Default label if the function isn't recognised but the contract is ours. */
  fallbackLabel: TransactionLabel
}

function getKnownContracts(): KnownContract[] {
  const list: KnownContract[] = []

  if (env.wrapperAddress && env.wrapperAddress !== '0x') {
    list.push({
      address: env.wrapperAddress,
      abi: wrapperAbi as unknown as Abi,
      functionLabels: {
        registerAgent: 'registration_fee',
        updateTags: 'sga_expense',
        recordActivity: 'sga_expense',
      },
      confirmEvents: ['AgentRegisteredViaWrapper', 'AgentTagsUpdated'],
      fallbackLabel: 'sga_expense',
    })
  }

  list.push({
    address: env.reputationRegistryAddress,
    abi: reputationRegistryAbi as unknown as Abi,
    functionLabels: {
      giveFeedback: 'feedback_fee',
      revokeFeedback: 'sga_expense',
      appendResponse: 'sga_expense',
    },
    confirmEvents: ['FeedbackGiven', 'NewFeedback'],
    fallbackLabel: 'feedback_fee',
  })

  if (env.companyRegistryAddress && env.companyRegistryAddress !== '0x') {
    list.push({
      address: env.companyRegistryAddress,
      abi: companyRegistryAbi as unknown as Abi,
      functionLabels: {
        createCompany: 'sga_expense',
        addAgent: 'sga_expense',
        removeAgent: 'sga_expense',
        addTreasury: 'sga_expense',
        removeTreasury: 'sga_expense',
        updateCompanyMetadata: 'sga_expense',
      },
      confirmEvents: [
        'CompanyCreated',
        'AgentAdded',
        'AgentRemoved',
        'TreasuryAdded',
        'TreasuryRemoved',
      ],
      fallbackLabel: 'sga_expense',
    })
  }

  return list
}

function findKnownContract(to: string | null): KnownContract | undefined {
  if (!to) return undefined
  const lower = to.toLowerCase()
  return getKnownContracts().find((c) => c.address.toLowerCase() === lower)
}

interface ClassifyInput {
  txHash: Hex
  agentWallet: string
  /** Optional already-fetched tx/receipt to skip RPC hops. */
  tx?: { from: string; to: string | null; input: Hex }
  receipt?: TransactionReceipt
}

export async function classifyTransactionV2(
  input: ClassifyInput,
): Promise<ClassificationResult> {
  const client = publicClient as PublicClient
  let tx: { from: string; to: string | null; input: Hex }
  if (input.tx) {
    tx = input.tx
  } else {
    const fetched = await client.getTransaction({ hash: input.txHash })
    tx = { from: fetched.from, to: fetched.to ?? null, input: fetched.input }
  }
  const receipt = input.receipt
    ? input.receipt
    : await client.getTransactionReceipt({ hash: input.txHash })

  const isOutgoing = tx.from.toLowerCase() === input.agentWallet.toLowerCase()
  const direction: 'incoming' | 'outgoing' = isOutgoing ? 'outgoing' : 'incoming'

  const known = findKnownContract(tx.to)

  // ───── Path A: known contract — decode calldata
  if (known && tx.input && tx.input !== '0x') {
    try {
      const decoded = decodeFunctionData({ abi: known.abi, data: tx.input })
      const label = known.functionLabels[decoded.functionName] ?? known.fallbackLabel

      return {
        label,
        direction,
        confidence: 'high',
        source: 'calldata',
        evidence: {
          functionName: decoded.functionName,
          matchedEvents: matchEvents(receipt, known),
          note: `Called ${decoded.functionName} on ${known.address}`,
        },
      }
    } catch {
      // Calldata didn't decode against this ABI — fall through.
    }
  }

  // ───── Path B: event-based — scan logs for protocol events
  for (const contract of getKnownContracts()) {
    const matched = matchEvents(receipt, contract)
    if (matched.length > 0) {
      return {
        label: contract.fallbackLabel,
        direction,
        confidence: 'medium',
        source: 'event',
        evidence: {
          matchedEvents: matched,
          note: `Receipt emitted ${matched.join(', ')} from ${contract.address}`,
        },
      }
    }
  }

  // ───── Path C: heuristic fallback
  const heuristic = classifyHeuristic(tx.from, tx.to ?? '', input.agentWallet)
  return {
    label: heuristic.label,
    direction: heuristic.direction,
    confidence: 'low',
    source: 'heuristic',
    evidence: { note: 'No known contract call or protocol event matched' },
  }
}

function matchEvents(receipt: TransactionReceipt, contract: KnownContract): string[] {
  const addrLower = contract.address.toLowerCase()
  const matched: string[] = []
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== addrLower) continue
    try {
      const decoded = decodeEventLog({
        abi: contract.abi,
        data: log.data,
        topics: log.topics,
      })
      const name = typeof decoded.eventName === 'string' ? decoded.eventName : ''
      if (name && contract.confirmEvents.includes(name)) {
        matched.push(name)
      }
    } catch {
      /* skip */
    }
  }
  return matched
}
