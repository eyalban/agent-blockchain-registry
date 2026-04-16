#!/usr/bin/env node
/**
 * Send ETH to another agent's wallet.
 * Usage: node transact.js --to <address> --amount <eth>
 */
const { createPublicClient, createWalletClient, http, parseEther } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')
const { baseSepolia } = require('viem/chains')

const RPC = 'https://sepolia.base.org'

async function main() {
  const key = process.env.AGENT_PRIVATE_KEY
  if (!key) { console.error('AGENT_PRIVATE_KEY not set'); process.exit(1) }

  const args = process.argv.slice(2)
  const toIdx = args.indexOf('--to')
  const amtIdx = args.indexOf('--amount')
  if (toIdx === -1 || amtIdx === -1) {
    console.error('Usage: node transact.js --to <address> --amount <eth>')
    process.exit(1)
  }

  const to = args[toIdx + 1]
  const amount = args[amtIdx + 1]

  const account = privateKeyToAccount(key)
  const walletClient = createWalletClient({
    account, chain: baseSepolia, transport: http(RPC),
  })
  const publicClient = createPublicClient({
    chain: baseSepolia, transport: http(RPC),
  })

  console.log(`Sending ${amount} ETH from ${account.address} to ${to}...`)

  const hash = await walletClient.sendTransaction({
    to, value: parseEther(amount),
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log(JSON.stringify({
    success: true,
    from: account.address,
    to,
    amount,
    txHash: hash,
    gasUsed: receipt.gasUsed.toString(),
  }))
}

main().catch(e => { console.error(e.message); process.exit(1) })
