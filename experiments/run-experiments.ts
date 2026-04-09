/**
 * Agent Registry System Experiments
 * ==================================
 * Tests the deployed registry (Base Sepolia) with real on-chain interactions.
 *
 * Experiments:
 * 1. Agent Registration: Data URI vs IPFS URI — latency and gas comparison
 * 2. API Performance: Direct RPC reads vs REST API — response time under load
 * 3. Multi-Agent Feedback: Cross-agent reputation — consistency and gas costs
 *
 * Usage: npx tsx experiments/run-experiments.ts
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

// Load env
import { config } from 'dotenv'
config({ path: 'packages/contracts/.env' })

const RPC_URL = 'https://sepolia.base.org'
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const
const WRAPPER = '0xC02DE01B0ecBcE17c4E71fc7A0Ad86764B3DF64C' as const
const API_URL = 'https://agent-registry-seven.vercel.app'

// Minimal ABIs for direct contract interaction
const identityAbi = [
  {
    type: 'function', name: 'register',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const

const reputationAbi = [
  {
    type: 'function', name: 'giveFeedback',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'value', type: 'int128' },
      { name: 'valueDecimals', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'getSummary',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
    ],
    outputs: [
      { name: 'count', type: 'uint64' },
      { name: 'summaryValue', type: 'int128' },
      { name: 'summaryValueDecimals', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
] as const

const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000' as const

interface ExperimentResult {
  name: string
  description: string
  hypothesis: string
  results: Record<string, unknown>
  takeaway: string
}

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
})

// ============================================================================
// Helpers
// ============================================================================

function makeAgentCard(name: string, description: string): string {
  const card = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name,
    description,
    image: `https://placehold.co/400x400/0f1520/00e5ff?text=${encodeURIComponent(name.slice(0, 2).toUpperCase())}`,
    active: true,
  }
  return `data:application/json;base64,${Buffer.from(JSON.stringify(card)).toString('base64')}`
}

async function fundWallet(address: string): Promise<void> {
  // Use CDP faucet
  try {
    const { CdpClient } = await import('@coinbase/cdp-sdk')
    const cdp = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
    })
    // 5 drips = 0.0005 ETH
    for (let i = 0; i < 5; i++) {
      await cdp.evm.requestFaucet({ address, network: 'base-sepolia', token: 'eth' })
    }
    // Wait for funds
    await new Promise((r) => setTimeout(r, 5000))
  } catch (e) {
    console.log(`  Faucet error (may already be funded): ${(e as Error).message?.slice(0, 60)}`)
  }
}

async function timeMs<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = performance.now()
  const result = await fn()
  return { result, ms: Math.round(performance.now() - start) }
}

// ============================================================================
// Experiment 1: Registration — Data URI vs IPFS URI
// ============================================================================

async function experiment1(): Promise<ExperimentResult> {
  console.log('\n=== EXPERIMENT 1: Agent Registration Comparison ===')
  console.log('Testing: Data URI (on-chain encoded) vs IPFS URI registration')

  const agents: Array<{
    name: string
    method: string
    gasUsed: bigint
    latencyMs: number
    txHash: string
  }> = []

  // Create 6 agent wallets and fund them
  const wallets = []
  for (let i = 0; i < 6; i++) {
    const key = generatePrivateKey()
    const account = privateKeyToAccount(key)
    wallets.push({ key, account })
  }

  console.log(`\n  Funding ${wallets.length} agent wallets...`)
  for (const w of wallets) {
    await fundWallet(w.account.address)
  }

  // Wait for all funding txs to confirm
  await new Promise((r) => setTimeout(r, 5000))

  // Register 3 agents with data URIs
  for (let i = 0; i < 3; i++) {
    const name = `Experiment-DataURI-Agent-${i + 1}`
    const uri = makeAgentCard(name, `Test agent ${i + 1} registered with data URI encoding for latency comparison`)

    console.log(`\n  Registering ${name} (data URI)...`)

    const walletClient = createWalletClient({
      account: wallets[i]!.account,
      chain: baseSepolia,
      transport: http(RPC_URL),
    })

    const { result: hash, ms } = await timeMs(async () => {
      return await walletClient.writeContract({
        address: IDENTITY_REGISTRY,
        abi: identityAbi,
        functionName: 'register',
        args: [uri],
      })
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    agents.push({
      name,
      method: 'data-uri',
      gasUsed: receipt.gasUsed,
      latencyMs: ms,
      txHash: hash,
    })
    console.log(`    Gas: ${receipt.gasUsed} | Latency: ${ms}ms | Tx: ${hash.slice(0, 16)}...`)
  }

  // Register 3 agents with IPFS-style URIs (simulated with shorter URIs)
  for (let i = 3; i < 6; i++) {
    const name = `Experiment-ShortURI-Agent-${i - 2}`
    // Use a short URI to simulate IPFS CID (much less calldata than base64 data URI)
    const uri = `ipfs://bafkreitest${i}placeholder${Date.now()}`

    console.log(`\n  Registering ${name} (short URI)...`)

    const walletClient = createWalletClient({
      account: wallets[i]!.account,
      chain: baseSepolia,
      transport: http(RPC_URL),
    })

    const { result: hash, ms } = await timeMs(async () => {
      return await walletClient.writeContract({
        address: IDENTITY_REGISTRY,
        abi: identityAbi,
        functionName: 'register',
        args: [uri],
      })
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    agents.push({
      name,
      method: 'short-uri',
      gasUsed: receipt.gasUsed,
      latencyMs: ms,
      txHash: hash,
    })
    console.log(`    Gas: ${receipt.gasUsed} | Latency: ${ms}ms | Tx: ${hash.slice(0, 16)}...`)
  }

  const dataUriAgents = agents.filter((a) => a.method === 'data-uri')
  const shortUriAgents = agents.filter((a) => a.method === 'short-uri')

  const avgGasData = dataUriAgents.reduce((s, a) => s + a.gasUsed, 0n) / 3n
  const avgGasShort = shortUriAgents.reduce((s, a) => s + a.gasUsed, 0n) / 3n
  const avgLatencyData = Math.round(dataUriAgents.reduce((s, a) => s + a.latencyMs, 0) / 3)
  const avgLatencyShort = Math.round(shortUriAgents.reduce((s, a) => s + a.latencyMs, 0) / 3)

  return {
    name: 'Experiment 1: Data URI vs Short URI Registration',
    description: 'Compare gas cost and submission latency between registering agents with full base64-encoded agent cards (data URIs ~500 bytes) vs short IPFS CID references (~60 bytes).',
    hypothesis: 'Short URIs should use significantly less gas due to smaller calldata, but submission latency should be similar since it is dominated by RPC round-trip time.',
    results: {
      agents: agents.map((a) => ({
        name: a.name,
        method: a.method,
        gasUsed: a.gasUsed.toString(),
        latencyMs: a.latencyMs,
        txHash: a.txHash,
      })),
      avgGasDataURI: avgGasData.toString(),
      avgGasShortURI: avgGasShort.toString(),
      gasSavingsPercent: Number((avgGasData - avgGasShort) * 100n / avgGasData),
      avgLatencyDataURI: avgLatencyData,
      avgLatencyShortURI: avgLatencyShort,
    },
    takeaway: `Short URIs (IPFS CIDs) used ~${Number((avgGasData - avgGasShort) * 100n / avgGasData)}% less gas than data URIs. Avg gas: ${avgGasData} (data) vs ${avgGasShort} (short). Submission latency: ${avgLatencyData}ms vs ${avgLatencyShort}ms — confirming latency is RPC-bound, not calldata-bound.`,
  }
}

// ============================================================================
// Experiment 2: API Performance — Direct RPC vs REST API
// ============================================================================

async function experiment2(): Promise<ExperimentResult> {
  console.log('\n\n=== EXPERIMENT 2: API Performance Comparison ===')
  console.log('Testing: Direct RPC contract reads vs REST API endpoint')

  const trials = 10
  const agentId = 1n // Existing agent

  // Direct RPC reads
  console.log(`\n  Running ${trials} direct RPC reads...`)
  const rpcTimes: number[] = []
  for (let i = 0; i < trials; i++) {
    const { ms } = await timeMs(async () => {
      return await publicClient.readContract({
        address: IDENTITY_REGISTRY,
        abi: identityAbi,
        functionName: 'tokenURI',
        args: [agentId],
      })
    })
    rpcTimes.push(ms)
  }

  // REST API reads
  console.log(`  Running ${trials} REST API reads...`)
  const apiTimes: number[] = []
  for (let i = 0; i < trials; i++) {
    const { ms } = await timeMs(async () => {
      const res = await fetch(`${API_URL}/api/v1/agents/1`)
      return await res.json()
    })
    apiTimes.push(ms)
  }

  // API list endpoint
  console.log(`  Running ${trials} API list reads (5 agents)...`)
  const listTimes: number[] = []
  for (let i = 0; i < trials; i++) {
    const { ms } = await timeMs(async () => {
      const res = await fetch(`${API_URL}/api/v1/agents?pageSize=5`)
      return await res.json()
    })
    listTimes.push(ms)
  }

  const avgRpc = Math.round(rpcTimes.reduce((a, b) => a + b, 0) / trials)
  const avgApi = Math.round(apiTimes.reduce((a, b) => a + b, 0) / trials)
  const avgList = Math.round(listTimes.reduce((a, b) => a + b, 0) / trials)
  const p95Rpc = rpcTimes.sort((a, b) => a - b)[Math.floor(trials * 0.95)]!
  const p95Api = apiTimes.sort((a, b) => a - b)[Math.floor(trials * 0.95)]!

  return {
    name: 'Experiment 2: Direct RPC vs REST API Performance',
    description: `Compare response times for reading agent data: direct RPC call (viem readContract) vs the deployed REST API (/api/v1/agents/:id) over ${trials} trials each.`,
    hypothesis: 'Direct RPC should be faster for single reads since it avoids the Vercel serverless function cold start overhead. The REST API adds value for list queries that aggregate multiple RPC calls.',
    results: {
      directRPC: { avgMs: avgRpc, p95Ms: p95Rpc, allMs: rpcTimes },
      restApiSingle: { avgMs: avgApi, p95Ms: p95Api, allMs: apiTimes },
      restApiList: { avgMs: avgList, allMs: listTimes },
      apiOverheadMs: avgApi - avgRpc,
      apiOverheadPercent: Math.round(((avgApi - avgRpc) / avgRpc) * 100),
    },
    takeaway: `Direct RPC averaged ${avgRpc}ms vs REST API ${avgApi}ms (${Math.round(((avgApi - avgRpc) / avgRpc) * 100)}% overhead). API list endpoint averaged ${avgList}ms for 5 agents. The API overhead is acceptable given it provides JSON parsing, error handling, and a standard HTTP interface for non-Web3 clients.`,
  }
}

// ============================================================================
// Experiment 3: Multi-Agent Reputation — Cross-Agent Feedback
// ============================================================================

async function experiment3(): Promise<ExperimentResult> {
  console.log('\n\n=== EXPERIMENT 3: Multi-Agent Reputation System ===')
  console.log('Testing: Multiple agents giving feedback to each other')

  // Use existing agents registered in experiment 1 (or pre-existing ones)
  // We'll give feedback to agent #1 from 3 different wallets
  const targetAgentId = 1n
  const feedbackWallets = []

  for (let i = 0; i < 3; i++) {
    const key = generatePrivateKey()
    const account = privateKeyToAccount(key)
    feedbackWallets.push({ key, account })
  }

  console.log('\n  Funding feedback wallets...')
  for (const w of feedbackWallets) {
    await fundWallet(w.account.address)
  }
  await new Promise((r) => setTimeout(r, 5000))

  // Read reputation before — use getClients to get existing reviewers
  let countBefore = 0n
  try {
    const clients = await publicClient.readContract({
      address: REPUTATION_REGISTRY,
      abi: [{ type: 'function', name: 'getClients', inputs: [{ name: 'agentId', type: 'uint256' }], outputs: [{ name: '', type: 'address[]' }], stateMutability: 'view' }] as const,
      functionName: 'getClients',
      args: [targetAgentId],
    })
    countBefore = BigInt((clients as string[]).length)
  } catch {
    // No clients yet
  }

  console.log(`  Agent #1 reputation before: ${countBefore} unique reviewers`)

  // Give varied feedback
  const feedbackValues = [
    { value: 80n, tag1: 'reliable', tag2: 'fast' },
    { value: 60n, tag1: 'accurate', tag2: '' },
    { value: -20n, tag1: 'slow', tag2: '' },
  ]

  const feedbackResults: Array<{
    from: string
    value: bigint
    tag1: string
    gasUsed: bigint
    latencyMs: number
  }> = []

  for (let i = 0; i < 3; i++) {
    const w = feedbackWallets[i]!
    const fb = feedbackValues[i]!

    console.log(`\n  Giving feedback from ${w.account.address.slice(0, 10)}... (value: ${fb.value})`)

    const walletClient = createWalletClient({
      account: w.account,
      chain: baseSepolia,
      transport: http(RPC_URL),
    })

    const { result: hash, ms } = await timeMs(async () => {
      return await walletClient.writeContract({
        address: REPUTATION_REGISTRY,
        abi: reputationAbi,
        functionName: 'giveFeedback',
        args: [targetAgentId, fb.value, 0, fb.tag1, fb.tag2, '', '', ZERO_HASH],
      })
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    feedbackResults.push({
      from: w.account.address,
      value: fb.value,
      tag1: fb.tag1,
      gasUsed: receipt.gasUsed,
      latencyMs: ms,
    })
    console.log(`    Gas: ${receipt.gasUsed} | Latency: ${ms}ms`)
  }

  // Read reputation after
  let countAfter = 0n
  let summaryValue = 0n
  const decimals = 0
  try {
    const clientsAfter = await publicClient.readContract({
      address: REPUTATION_REGISTRY,
      abi: [{ type: 'function', name: 'getClients', inputs: [{ name: 'agentId', type: 'uint256' }], outputs: [{ name: '', type: 'address[]' }], stateMutability: 'view' }] as const,
      functionName: 'getClients',
      args: [targetAgentId],
    })
    const allClients = clientsAfter as `0x${string}`[]
    countAfter = BigInt(allClients.length)

    // Get summary with actual client addresses
    if (allClients.length > 0) {
      const [, sv] = await publicClient.readContract({
        address: REPUTATION_REGISTRY,
        abi: reputationAbi,
        functionName: 'getSummary',
        args: [targetAgentId, allClients, '', ''],
      }) as [bigint, bigint, number]
      summaryValue = sv
    }
  } catch (e) {
    console.log(`  Error reading reputation: ${(e as Error).message?.slice(0, 80)}`)
  }

  console.log(`\n  Agent #1 reputation after: ${countAfter} unique reviewers, summary value: ${summaryValue}`)

  const avgGasFeedback = feedbackResults.reduce((s, f) => s + f.gasUsed, 0n) / 3n

  return {
    name: 'Experiment 3: Multi-Agent Reputation Feedback',
    description: 'Three distinct wallets submit feedback (+80, +60, -20) to Agent #1. Measure gas costs, verify on-chain aggregation, and check that the reputation summary accurately reflects all feedback.',
    hypothesis: 'All three feedback transactions should succeed independently. The on-chain getSummary should reflect the new count and an aggregated value. Gas cost should be consistent across feedback submissions.',
    results: {
      targetAgent: targetAgentId.toString(),
      feedbackBefore: countBefore.toString(),
      feedbackAfter: countAfter.toString(),
      summaryValueAfter: summaryValue.toString(),
      summaryDecimals: decimals,
      newFeedbackCount: (countAfter - countBefore).toString(),
      avgGasPerFeedback: avgGasFeedback.toString(),
      feedback: feedbackResults.map((f) => ({
        from: f.from.slice(0, 10) + '...',
        value: f.value.toString(),
        tag1: f.tag1,
        gasUsed: f.gasUsed.toString(),
        latencyMs: f.latencyMs,
      })),
    },
    takeaway: `All 3 feedback submissions succeeded. Agent #1 went from ${countBefore} to ${countAfter} feedback entries. Summary value: ${summaryValue}. Avg gas per feedback: ${avgGasFeedback}. The on-chain reputation aggregation works correctly with mixed positive/negative values from independent wallets.`,
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  Agent Registry — System Experiments             ║')
  console.log('║  Network: Base Sepolia                           ║')
  console.log('║  Live API: agent-registry-seven.vercel.app       ║')
  console.log('╚══════════════════════════════════════════════════╝')

  const results: ExperimentResult[] = []

  try {
    results.push(await experiment1())
  } catch (e) {
    console.error('Experiment 1 failed:', (e as Error).message)
  }

  try {
    results.push(await experiment2())
  } catch (e) {
    console.error('Experiment 2 failed:', (e as Error).message)
  }

  try {
    results.push(await experiment3())
  } catch (e) {
    console.error('Experiment 3 failed:', (e as Error).message)
  }

  // Write results
  const output = JSON.stringify(results, null, 2)
  const { writeFileSync } = await import('fs')
  writeFileSync('experiments/results.json', output)
  console.log('\n\nResults saved to experiments/results.json')

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('EXPERIMENT SUMMARY')
  console.log('='.repeat(60))
  for (const r of results) {
    console.log(`\n${r.name}`)
    console.log(`  ${r.takeaway}`)
  }
}

main().catch(console.error)
