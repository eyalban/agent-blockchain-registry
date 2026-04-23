import { NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

export const maxDuration = 60 // Vercel Pro allows up to 60s

const RPC = 'https://sepolia.base.org'
const IDENTITY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const
const REPUTATION = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000' as const

const identityAbi = [
  {
    type: 'function', name: 'register',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
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
] as const

interface AgentResult {
  name: string
  role: string
  address: string
  agentId: string | null
  registrationGas: string | null
  registrationLatencyMs: number | null
  feedbackGiven: Array<{ to: string; value: number; gas: string; latencyMs: number }>
  txHashes: string[]
}

function makeCardURI(name: string): string {
  return `ipfs://experiment-${name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`
}

/**
 * GET /api/v1/agents/experiment
 *
 * Runs a coordinated multi-agent experiment on Vercel serverless.
 * Creates 6 agent wallets, funds them via CDP faucet, registers them,
 * and has them give feedback to each other.
 *
 * This runs on CLOUD infrastructure (Vercel), not locally.
 */
export async function GET(): Promise<NextResponse> {
  const start = performance.now()
  const results: AgentResult[] = []
  const errors: string[] = []

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC),
  })

  // Define 6 agents with different roles
  const agentDefs = [
    { name: 'DeFi Analyzer', role: 'defi-analysis' },
    { name: 'Security Auditor', role: 'security-audit' },
    { name: 'Data Collector', role: 'data-collection' },
    { name: 'Trading Bot', role: 'trading' },
    { name: 'Research Agent', role: 'research' },
    { name: 'Governance Watcher', role: 'governance' },
  ]

  // Step 1: Create wallets and fund via CDP faucet
  const wallets: Array<{
    key: `0x${string}`
    address: `0x${string}`
    name: string
    role: string
  }> = []

  for (const def of agentDefs) {
    const key = generatePrivateKey()
    const account = privateKeyToAccount(key)
    wallets.push({ key, address: account.address, name: def.name, role: def.role })
  }

  // Fund wallets via CDP faucet
  const cdpKeyId = process.env.CDP_API_KEY_ID
  const cdpSecret = process.env.CDP_API_KEY_SECRET

  if (!cdpKeyId || !cdpSecret) {
    errors.push(`CDP keys missing: ID=${cdpKeyId ? 'set' : 'MISSING'}, Secret=${cdpSecret ? 'set' : 'MISSING'}`)
  } else {
    try {
      const { CdpClient } = await import('@coinbase/cdp-sdk')
      const cdp = new CdpClient({ apiKeyId: cdpKeyId, apiKeySecret: cdpSecret })

      let funded = 0
      for (const w of wallets) {
        try {
          await cdp.evm.requestFaucet({
            address: w.address,
            network: 'base-sepolia',
            token: 'eth',
          })
          await cdp.evm.requestFaucet({
            address: w.address,
            network: 'base-sepolia',
            token: 'eth',
          })
          funded++
        } catch (fe) {
          errors.push(`Faucet ${w.name}: ${(fe as Error).message?.slice(0, 60)}`)
        }
      }
      errors.push(`Funded ${funded}/${wallets.length} wallets`)
      // Wait for funding txs to confirm
      await new Promise((r) => setTimeout(r, 8000))
    } catch (e) {
      errors.push(`CDP init: ${(e as Error).message?.slice(0, 100)}`)
    }
  }

  // Step 2: Register each agent
  for (const w of wallets) {
    const result: AgentResult = {
      name: w.name,
      role: w.role,
      address: w.address,
      agentId: null,
      registrationGas: null,
      registrationLatencyMs: null,
      feedbackGiven: [],
      txHashes: [],
    }

    try {
      const walletClient = createWalletClient({
        account: privateKeyToAccount(w.key),
        chain: baseSepolia,
        transport: http(RPC),
      })

      const uri = makeCardURI(w.name)
      const regStart = performance.now()

      const hash = await walletClient.writeContract({
        address: IDENTITY,
        abi: identityAbi,
        functionName: 'register',
        args: [uri],
      })

      result.registrationLatencyMs = Math.round(performance.now() - regStart)
      result.txHashes.push(hash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      result.registrationGas = receipt.gasUsed.toString()

      // Parse agentId from Registered event
      const regEvent = receipt.logs.find((log) => {
        try {
          return log.address.toLowerCase() === IDENTITY.toLowerCase() && log.topics.length > 0
        } catch {
          return false
        }
      })
      if (regEvent?.topics[1]) {
        result.agentId = BigInt(regEvent.topics[1]).toString()
      }
    } catch (e) {
      errors.push(`Register ${w.name}: ${(e as Error).message?.slice(0, 80)}`)
    }

    results.push(result)
  }

  // Step 3: Agents give feedback to each other
  // Agent 0 reviews Agent 1, Agent 1 reviews Agent 2, etc. (ring topology)
  for (let i = 0; i < wallets.length; i++) {
    const reviewer = wallets[i]!
    const targetIdx = (i + 1) % wallets.length
    const target = results[targetIdx]!

    if (!target.agentId) continue

    try {
      const walletClient = createWalletClient({
        account: privateKeyToAccount(reviewer.key),
        chain: baseSepolia,
        transport: http(RPC),
      })

      const value = BigInt(50 + Math.floor(Math.random() * 50)) // +50 to +100
      const tags = ['reliable', 'fast', 'accurate', 'secure', 'efficient']
      const tag1 = tags[i % tags.length]!

      const fbStart = performance.now()

      const hash = await walletClient.writeContract({
        address: REPUTATION,
        abi: reputationAbi,
        functionName: 'giveFeedback',
        args: [BigInt(target.agentId), value, 0, tag1, '', '', '', ZERO_HASH],
      })

      const fbLatency = Math.round(performance.now() - fbStart)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      results[i]!.feedbackGiven.push({
        to: target.name,
        value: Number(value),
        gas: receipt.gasUsed.toString(),
        latencyMs: fbLatency,
      })
      results[i]!.txHashes.push(hash)
    } catch (e) {
      errors.push(`Feedback ${reviewer.name} → ${target.name}: ${(e as Error).message?.slice(0, 80)}`)
    }
  }

  const totalMs = Math.round(performance.now() - start)
  const registeredCount = results.filter((r) => r.agentId !== null).length
  const feedbackCount = results.reduce((s, r) => s + r.feedbackGiven.length, 0)

  return NextResponse.json({
    experiment: 'Multi-Agent Cloud Coordination',
    runtime: 'Vercel Serverless (iad1)',
    network: 'Base Sepolia',
    totalDurationMs: totalMs,
    summary: {
      agentsCreated: wallets.length,
      agentsRegistered: registeredCount,
      feedbackSubmitted: feedbackCount,
      totalTransactions: results.reduce((s, r) => s + r.txHashes.length, 0),
    },
    agents: results,
    errors: errors.length > 0 ? errors : undefined,
  })
}
