/**
 * Provision 30 OpenClaw agent wallets.
 * Generates private keys, funds via CDP faucet, and outputs configs.
 *
 * Usage: npx tsx agents/provision.ts
 */
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: 'packages/contracts/.env' })

const AGENT_ROLES = [
  { prefix: 'DeFi', role: 'defi-analyzer', count: 6 },
  { prefix: 'Audit', role: 'security-auditor', count: 6 },
  { prefix: 'Data', role: 'data-collector', count: 6 },
  { prefix: 'Trade', role: 'trading-bot', count: 6 },
  { prefix: 'Assist', role: 'general-assistant', count: 6 },
]

interface AgentConfig {
  id: string
  name: string
  role: string
  privateKey: string
  address: string
}

async function main(): Promise<void> {
  console.log('Provisioning 30 OpenClaw agent wallets...\n')

  const agents: AgentConfig[] = []
  let num = 1

  for (const { prefix, role, count } of AGENT_ROLES) {
    for (let i = 1; i <= count; i++) {
      const key = generatePrivateKey()
      const account = privateKeyToAccount(key)
      const id = `agent-${String(num).padStart(2, '0')}`
      const name = `${prefix} Agent ${i}`

      agents.push({
        id,
        name,
        role,
        privateKey: key,
        address: account.address,
      })
      num++
    }
  }

  console.log(`Generated ${agents.length} agent wallets\n`)

  // Fund via CDP faucet
  const cdpKeyId = process.env.CDP_API_KEY_ID
  const cdpSecret = process.env.CDP_API_KEY_SECRET

  if (cdpKeyId && cdpSecret) {
    console.log('Funding wallets via CDP faucet...')
    const { CdpClient } = await import('@coinbase/cdp-sdk')
    const cdp = new CdpClient({ apiKeyId: cdpKeyId, apiKeySecret: cdpSecret })

    let funded = 0
    for (const agent of agents) {
      try {
        await cdp.evm.requestFaucet({
          address: agent.address,
          network: 'base-sepolia',
          token: 'eth',
        })
        funded++
        if (funded % 5 === 0) console.log(`  Funded ${funded}/${agents.length}`)
      } catch {
        // Rate limit — continue
      }
    }
    console.log(`\nFunded ${funded}/${agents.length} wallets`)
  } else {
    console.log('CDP keys not found — skipping faucet funding')
  }

  // Write agent configs
  const dir = resolve(import.meta.dirname ?? __dirname, 'configs')
  mkdirSync(dir, { recursive: true })

  for (const agent of agents) {
    // .env file for each agent
    const envContent = [
      `AGENT_PRIVATE_KEY=${agent.privateKey}`,
      `AGENT_NAME=${agent.name}`,
      `AGENT_ROLE=${agent.role}`,
      `AGENT_REGISTRY_API=https://agent-registry-seven.vercel.app`,
    ].join('\n')

    writeFileSync(resolve(dir, `${agent.id}.env`), envContent)
  }

  // Write manifest
  const manifest = agents.map(a => ({
    id: a.id,
    name: a.name,
    role: a.role,
    address: a.address,
  }))
  writeFileSync(resolve(dir, 'manifest.json'), JSON.stringify(manifest, null, 2))

  console.log(`\nConfigs written to agents/configs/`)
  console.log(`Manifest: agents/configs/manifest.json`)

  // Summary table
  console.log('\n' + '='.repeat(70))
  for (const agent of agents) {
    console.log(`${agent.id} | ${agent.name.padEnd(20)} | ${agent.role.padEnd(18)} | ${agent.address.slice(0, 10)}...`)
  }
  console.log('='.repeat(70))
}

main().catch(console.error)
