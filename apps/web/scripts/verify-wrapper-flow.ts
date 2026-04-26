/**
 * End-to-end verification of the new README Path A flow.
 *
 * Runs the exact sequence an autonomous agent would: generate key →
 * faucet → upload → wrapper.registerAgent → poll the listing endpoint
 * until the new agentId surfaces. Catches any drift between the README
 * and the live contracts/server before agents start hitting production.
 *
 *   pnpm tsx scripts/verify-wrapper-flow.ts
 */
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

const API = 'https://agent-registry-seven.vercel.app'
const WRAPPER = '0xC02DE01B0ecBcE17c4E71fc7A0Ad86764B3DF64C' as const
const WRAPPER_REGISTERED_TOPIC =
  '0xf378f340d0146df55419ce014484d27d25b1b13cafac89f1407566f737ba2e9a' as const
const MIN_FUNDING = parseEther('0.0015')

const wrapperAbi = [
  {
    type: 'function',
    name: 'registerAgent',
    inputs: [
      { name: 'agentURI', type: 'string' },
      {
        name: 'metadata',
        type: 'tuple[]',
        components: [
          { name: 'key', type: 'string' },
          { name: 'value', type: 'bytes' },
        ],
      },
      { name: 'tags', type: 'string[]' },
    ],
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'registrationFee',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

async function main(): Promise<void> {
  const pk = generatePrivateKey()
  const account = privateKeyToAccount(pk)
  console.log(`generated test agent wallet: ${account.address}`)

  const pub = createPublicClient({ chain: baseSepolia, transport: http() })
  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() })

  // 1. Fund via faucet. CDP rate-limits at 10 drips/min/address, so we
  //    split across two calls 65s apart. First call covers the
  //    registrationFee, second call covers gas.
  async function drip(drips: number): Promise<void> {
    const fr = await fetch(`${API}/api/v1/faucet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: account.address, drips }),
    })
    if (!fr.ok) throw new Error(`faucet ${fr.status}: ${await fr.text()}`)
    const j = (await fr.json()) as { successfulDrips: number; errors?: string[] }
    console.log(`  drip(${drips}) → succeeded=${j.successfulDrips} errors=${(j.errors ?? []).length}`)
  }

  console.log('faucet: 10 drips...')
  await drip(10)
  console.log('waiting 65s for CDP rate-limit window...')
  await new Promise((s) => setTimeout(s, 65_000))
  console.log('faucet: 5 more drips...')
  await drip(5)

  for (let i = 0; i < 30; i++) {
    await new Promise((s) => setTimeout(s, 2000))
    const bal = await pub.getBalance({ address: account.address })
    if (i % 5 === 0) console.log(`  balance check ${i + 1}: ${bal} wei`)
    if (bal >= MIN_FUNDING) {
      console.log(`  funded: ${bal} wei`)
      break
    }
    if (i === 29) throw new Error(`funding never landed (bal ${bal})`)
  }

  // 2. Upload agent card.
  console.log('uploading agent card...')
  const ur = await fetch(`${API}/api/v1/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: 'Wrapper Verify',
      description: 'End-to-end test of the new wrapper-flow README path',
      image: 'https://placehold.co/400x400/0f1520/00e5ff?text=WV',
    }),
  })
  if (!ur.ok) throw new Error(`upload ${ur.status}: ${await ur.text()}`)
  const { uri: agentURI } = (await ur.json()) as { uri: string }
  console.log(`agentURI: ${agentURI}`)

  // 3. Register via wrapper.
  const fee = (await pub.readContract({
    address: WRAPPER,
    abi: wrapperAbi,
    functionName: 'registrationFee',
  })) as bigint
  console.log(`registrationFee: ${fee} wei`)

  const txHash = await wallet.writeContract({
    address: WRAPPER,
    abi: wrapperAbi,
    functionName: 'registerAgent',
    args: [agentURI, [], []],
    value: fee,
  })
  console.log(`registration tx: ${txHash}`)
  const receipt = await pub.waitForTransactionReceipt({ hash: txHash })
  console.log(`receipt status: ${receipt.status}, gas used: ${receipt.gasUsed}`)

  const ev = receipt.logs.find(
    (l) =>
      l.address.toLowerCase() === WRAPPER.toLowerCase() &&
      l.topics[0] === WRAPPER_REGISTERED_TOPIC,
  )
  if (!ev) throw new Error('AgentRegisteredViaWrapper event not found in receipt')
  const agentId = BigInt(ev.topics[1]!).toString()
  console.log(`agentId from event: ${agentId}`)

  // 4. Poll the listing endpoint until the agent surfaces.
  console.log('polling listing endpoint...')
  for (let i = 0; i < 12; i++) {
    await new Promise((s) => setTimeout(s, 5000))
    const lr = await fetch(`${API}/api/v1/agents?pageSize=5`)
    const data = (await lr.json()) as {
      total: number
      data: Array<{ agentId: string; name: string | null }>
    }
    const found = data.data.find((a) => a.agentId === agentId)
    console.log(
      `  poll ${i + 1}: total=${data.total} firstIds=${data.data
        .map((a) => a.agentId)
        .join(',')} found=${found ? 'YES' : 'no'}`,
    )
    if (found) {
      console.log(`SUCCESS — wrapper-flow agent #${agentId} (${found.name}) is listed`)
      return
    }
  }
  throw new Error(`agent #${agentId} did NOT surface in the listing within 60s`)
}

main().catch((e) => {
  console.error('FAILED:', e)
  process.exit(1)
})
