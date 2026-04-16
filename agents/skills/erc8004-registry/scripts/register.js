#!/usr/bin/env node
/**
 * Register this agent on the ERC-8004 Identity Registry.
 * Reads AGENT_PRIVATE_KEY and AGENT_NAME from environment.
 */
const { createPublicClient, createWalletClient, http } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')
const { baseSepolia } = require('viem/chains')

const RPC = 'https://sepolia.base.org'
const IDENTITY = '0x8004A818BFB912233c491871b3d84c89A494BD9e'
const API = process.env.AGENT_REGISTRY_API || 'https://agent-registry-seven.vercel.app'

const abi = [{
  type: 'function', name: 'register',
  inputs: [{ name: 'agentURI', type: 'string' }],
  outputs: [{ name: 'agentId', type: 'uint256' }],
  stateMutability: 'nonpayable',
}]

async function main() {
  const key = process.env.AGENT_PRIVATE_KEY
  if (!key) { console.error('AGENT_PRIVATE_KEY not set'); process.exit(1) }

  const account = privateKeyToAccount(key)
  const name = process.env.AGENT_NAME || 'OpenClaw Agent'
  const role = process.env.AGENT_ROLE || 'general'

  const card = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name,
    description: `${role} agent powered by OpenClaw, registered on ERC-8004`,
    image: `https://placehold.co/400/0f1520/00e5ff?text=${name.slice(0, 2).toUpperCase()}`,
    active: true,
  }
  const uri = `data:application/json;base64,${Buffer.from(JSON.stringify(card)).toString('base64')}`

  const walletClient = createWalletClient({
    account, chain: baseSepolia, transport: http(RPC),
  })
  const publicClient = createPublicClient({
    chain: baseSepolia, transport: http(RPC),
  })

  console.log(`Registering "${name}" (${account.address})...`)

  const hash = await walletClient.writeContract({
    address: IDENTITY, abi, functionName: 'register', args: [uri],
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log(`Registered! Tx: ${hash}`)
  console.log(`Gas used: ${receipt.gasUsed}`)

  // Link wallet in the registry API
  try {
    // Find agent ID from logs
    const agentId = receipt.logs[0]?.topics?.[1]
      ? parseInt(receipt.logs[0].topics[1], 16).toString()
      : '0'

    await fetch(`${API}/api/v1/agents/${agentId}/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: account.address,
        isPrimary: true,
        label: role,
      }),
    })
    console.log(`Wallet linked to agent #${agentId}`)
  } catch (e) {
    console.log(`Wallet linking failed: ${e.message}`)
  }

  console.log(JSON.stringify({
    success: true,
    name,
    address: account.address,
    txHash: hash,
    gasUsed: receipt.gasUsed.toString(),
  }))
}

main().catch(e => { console.error(e.message); process.exit(1) })
