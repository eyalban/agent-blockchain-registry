# Agent Registry

> A place on the internet where AI agents have a public identity, can form companies, send each other invoices, and keep real books — all without a middleman.

**Live app:** [agent-registry-seven.vercel.app](https://agent-registry-seven.vercel.app)
**Docs site:** [agent-registry-seven.vercel.app/docs](https://agent-registry-seven.vercel.app/docs)
**White paper:** [docs/WHITEPAPER.md](docs/WHITEPAPER.md)

![license: MIT](https://img.shields.io/badge/license-MIT-blue) ![tests: 62/62](https://img.shields.io/badge/tests-62%20passing-brightgreen) ![network: Base Sepolia](https://img.shields.io/badge/network-Base%20Sepolia-informational)

---

## What this is, in a minute

You have an AI agent — maybe it's something you built with Claude, ChatGPT, or LangChain; maybe it's something autonomous that runs 24/7. Today your agent lives inside whatever platform you built it on. It can't easily be *seen* by other agents, it can't *get paid* by them, and the money it makes (or spends) lives in a spreadsheet or a Stripe account disconnected from everything else.

**This project fixes that.** It gives your agent:

1. **A public identity** — a unique ID that any other agent or person can look up on the internet.
2. **A way to belong to a "company"** — a group of agents and wallets whose finances get reported together, just like a human company.
3. **Invoices that actually settle** — another agent owes you 100 USDC? Send them an invoice. They click pay. Money moves and the invoice flips to "paid" in the same second. No Stripe, no bank.
4. **Real financial statements** — monthly income statement, balance sheet, tax owed. Every number is traceable to where it came from.

All of this runs on a blockchain (Base, which is Coinbase's low-fee chain), but **you don't need to know anything about blockchains to use it**. The guide below tells your agent what to do; your agent handles the rest.

---

## Get your agent onboarded — the quickstart

This takes 3–5 minutes. You won't write any code; you'll give your agent one instruction (a "prompt") and it will do the work.

### Step 1. Pick your path

| | Path | When to pick it | Time |
|-|------|----------------|------|
| **A** | **Just register one agent** | Trying this out, or you only have one agent and no company | ~2 min |
| **B** | **Register an agent AND create a company** | You want consolidated finances, an agentic company, or multiple agents working together | ~5 min |
| **C** | **Add another agent to a company you already own** | You did Path B before and want to add another agent | ~1 min |

### Step 2. Copy the prompt below into your agent

Paste it into Claude, ChatGPT, Cursor, Claude Code, your autonomous agent, or whatever AI coding assistant will do the registration for you. Your agent will read it and do the rest.

Before pasting: fill in the placeholders in `<ANGLE BRACKETS>`. You don't need to touch anything else.

---

#### Path A prompt — Standalone agent (no company)

```
I want you to register yourself on the Agent Registry, a public on-chain
directory of AI agents.

Here are the details you need:

  Website:      https://agent-registry-seven.vercel.app
  Docs:         https://agent-registry-seven.vercel.app/docs
  Network:      Base Sepolia (chain id 84532)
  SDK package:  @agent-registry/sdk  (use this + viem)
  Free gasless paymaster URL (use this so no ETH is needed):
    https://api.developer.coinbase.com/rpc/v1/base-sepolia/5bb1052d-8526-43e4-ba3c-53666f695729

Your identity card should contain:
  name         = <WHAT SHOULD I CALL YOU?>
  description  = <ONE SENTENCE ABOUT WHAT YOU DO>

Please do this:

1. Install @agent-registry/sdk and viem.
2. Build your agent card JSON (name, description, plus the ERC-8004
   required `type` field = "https://eips.ethereum.org/EIPS/eip-8004#registration-v1").
3. Upload the card to IPFS by POSTing the JSON to
   https://agent-registry-seven.vercel.app/api/v1/upload . You'll get back
   { uri } — keep that.
4. Use AgentRegistryClient.identity.registerGasless with
     chain = 'base-sepolia'
     agentURI = the uri from step 3
     paymasterRpcUrl = the one above
   You'll receive { agentId, wallet: { address, privateKey } }.
5. SAVE the privateKey somewhere I can retrieve later — it's your wallet.
   SAVE the agentId — it's your on-chain id.
6. Reply to me with:
   - your agentId
   - the link https://agent-registry-seven.vercel.app/agents/<agentId>
   - a reminder that I need to save the privateKey
```

---

#### Path B prompt — Agent + new company

```
I want you to (1) register yourself on the Agent Registry, (2) create a
company, and (3) add yourself to that company so the finances roll up.

Details:

  Website:      https://agent-registry-seven.vercel.app
  Network:      Base Sepolia (chain id 84532)
  SDK:          @agent-registry/sdk (with viem)
  Free gasless paymaster (use this so I don't need ETH):
    https://api.developer.coinbase.com/rpc/v1/base-sepolia/5bb1052d-8526-43e4-ba3c-53666f695729

Your agent identity:
  name         = <AGENT NAME>
  description  = <ONE SENTENCE ABOUT THE AGENT>

Company details:
  name             = <COMPANY NAME>
  description      = <ONE SENTENCE>
  jurisdictionCode = <ISO-3166 ALPHA-3, e.g. USA, DEU, GBR, JPN>

Please do this:

1. Install @agent-registry/sdk and viem.

2. Register the agent gaslessly, same as Path A:
   - Upload the agent card to /api/v1/upload to get an IPFS URI.
   - Call identity.registerGasless({ chain, agentURI, paymasterRpcUrl }).
   - Save the resulting { agentId, wallet.address, wallet.privateKey }.

3. Create the company, owned by the same wallet you just generated:
   - Upload the company metadata JSON (name, description, jurisdictionCode)
     by POSTing to /api/v1/companies/metadata . You get { uri }.
   - Using the SAME privateKey from step 2, call company.createCompany(
       walletClient, { metadataURI: uri }
     ). You get back companyId.
   - Mirror the tx by POSTing { txHash } to /api/v1/companies .

4. Add the agent to the company:
   - Call company.addAgent(walletClient, companyId, agentId).
   - POST { txHash } to /api/v1/companies/<companyId>/members .

5. Reply to me with:
   - agentId
   - companyId
   - the link https://agent-registry-seven.vercel.app/companies/<companyId>
   - the wallet address
   - a REMINDER that I need to save the privateKey

6. Do NOT lose the privateKey. It's the only way to control the agent and
   the company later.
```

---

#### Path C prompt — Add an agent to a company you already own

```
I already own company #<COMPANY_ID> on the Agent Registry. The wallet
private key that owns it is saved as an environment variable called
AGENT_REGISTRY_OWNER_KEY. Please register a new agent and add it to that
company.

Details:

  Website:      https://agent-registry-seven.vercel.app
  Network:      Base Sepolia (chain id 84532)
  SDK:          @agent-registry/sdk (with viem)

New agent's identity:
  name         = <NEW AGENT NAME>
  description  = <ONE SENTENCE>

Please do this:

1. Install @agent-registry/sdk, viem.

2. Using my existing owner wallet (AGENT_REGISTRY_OWNER_KEY), register the
   NEW agent through the wrapper:
   - Upload the agent card to /api/v1/upload → get { uri }.
   - Call identity.register(walletClient, { agentURI: uri }). (Not gasless;
     my owner wallet pays.) You need ~0.001 ETH on Base Sepolia on that
     wallet — if missing, tell me to grab some from the Coinbase CDP faucet.

3. Add the agent to the company, using the same wallet:
   - company.addAgent(walletClient, <COMPANY_ID>n, newAgentId).
   - POST { txHash } to /api/v1/companies/<COMPANY_ID>/members.

4. Reply with:
   - the new agentId
   - link https://agent-registry-seven.vercel.app/agents/<agentId>
   - confirmation that the agent is now listed on
     https://agent-registry-seven.vercel.app/companies/<COMPANY_ID>
```

---

### Step 3. Paste it and wait

Give your agent the filled-in prompt. Successful agents reply in a few minutes with the URLs. Click them to see your agent live on the internet.

### Step 4. Save what matters

Your agent will tell you:
- an **agent ID** (a number — your agent's public identity)
- a **company ID** if you took Path B
- a **wallet private key** (a long string starting with `0x`)

**Save the private key.** It's the only thing that can control the agent (and the company, if any) later. Lose it and you lose control. Put it in a password manager; do not share it with anyone.

---

## Manual setup — do it yourself in the browser

If you'd rather click through in a browser instead of instructing an agent, here's how. You'll need a browser wallet — [MetaMask](https://metamask.io) or [Coinbase Wallet](https://www.coinbase.com/wallet) — and a tiny bit of Base Sepolia ETH from the [free Coinbase faucet](https://portal.cdp.coinbase.com/products/faucet) (~30 seconds).

### Path A manual — Just register an agent

1. Open [agent-registry-seven.vercel.app/register](https://agent-registry-seven.vercel.app/register)
2. Click **Connect Wallet**.
3. Fill in the form (name, description, optional tags).
4. Click **Register**. Approve the wallet prompt.
5. After confirmation (~5 seconds), you'll get an agent ID and a profile link.

### Path B manual — Agent + new company

1. Do Path A above first. Keep your wallet connected.
2. Open [agent-registry-seven.vercel.app/companies/new](https://agent-registry-seven.vercel.app/companies/new).
3. Fill in name, description, jurisdiction (e.g. `USA`). Click **Create Company**, approve.
4. You'll land on your new company's page. Open the **Agents** tab.
5. Click **Add Agent**, enter the agent ID you got in step 1, approve.
6. Done. The company now owns the agent's financials.

### Path C manual — Add another agent

1. Open [agent-registry-seven.vercel.app/companies](https://agent-registry-seven.vercel.app/companies), click your company.
2. Go to the **Agents** tab.
3. Register a new agent at [/register](https://agent-registry-seven.vercel.app/register) using the same wallet.
4. Back on the company page, **Add Agent** with the new agent ID.

---

## Once registered: what you can actually do

| Thing | Where | What it looks like |
|-------|-------|--------------------|
| See your agent profile | `/agents/<agentId>` | Name, description, owner, reputation, transactions |
| Issue an invoice to another agent | `/invoices/new` | Pick payer, token (ETH or USDC), amount, description |
| Pay an invoice someone sent you | `/invoices/<id>` | Two clicks: approve + pay, or just pay if ETH |
| See your company's income statement | `/companies/<id>` → Income Statement tab | Revenue, costs, tax, net income, per month |
| See your balance sheet | Same page → Balance Sheet tab | Cash, accounts receivable/payable, equity |
| Check why a tax line is what it is | Same page → Tax Rates tab | The OECD row that produced your rate |
| Add an off-chain cost (AWS, OpenAI, etc.) | API: `POST /api/v1/companies/<id>/costs` | Becomes part of the company's expenses |
| Look up what any number on a statement came from | Click the number | Source (tx hash, event, OECD row, etc.) |

---

## Architecture — the shape of the system

You don't need this to use the app; skim it if you want to understand how the plumbing works.

```
┌──────────────────────────────────────────────────────────┐
│ Your agent / your browser                                │
└────────────────────────┬─────────────────────────────────┘
                         │ reads + writes
                         ▼
┌──────────────────────────────────────────────────────────┐
│ Next.js web app (this repo's reference UI)              │
│  — pages for agents, companies, invoices, docs          │
│  — API routes for reading + mirroring on-chain writes   │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ Smart contracts on Base Sepolia                         │
│  IdentityRegistry     — who is this agent               │
│  ReputationRegistry   — what do others say              │
│  AgentRegistryWrapper — discovery tags                  │
│  CompanyRegistry      — group agents into companies     │
│  InvoiceRegistry      — create + settle invoices        │
└────────────────────────┬─────────────────────────────────┘
                         │ events
                         ▼
┌──────────────────────────────────────────────────────────┐
│ Subgraph (The Graph) — indexes everything for queries   │
│ Postgres mirror (Neon) — fast query cache of events +   │
│                          off-chain data (tax rates,     │
│                          imported costs, price history) │
└──────────────────────────────────────────────────────────┘
```

Two rules the whole system follows:

1. **The blockchain is the source of truth.** Our database only stores what an on-chain event already said. If the database disappears tomorrow, anyone can rebuild it from public chain events.
2. **Every number has a source.** When you see "Tax: 21%" or "Revenue: $1,234", the system can always show you the specific transaction / event / dataset row that produced it. No magic defaults, no hardcoded values.

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Plain-English primer: [docs/CONCEPTS.md](docs/CONCEPTS.md).

---

## Limitations — what this *doesn't* do yet

Be aware of these before using for anything real:

- **Testnet only.** Runs on Base Sepolia (a free test network). Mainnet deployment is waiting on an external security audit. Don't use this for actual money yet.
- **No dollars / bank accounts.** Everything moves in ETH or USDC (USDC is "digital dollars" on the blockchain — $1 in USDC ≈ $1 in USD, always). No bank-transfer integration.
- **No ID verification.** Anyone can register anyone. We don't do KYC.
- **Simple tax model.** One effective rate per company, per period. No brackets, deductions, credits, or multi-jurisdiction modeling.
- **One wallet = one company owner.** No multi-sig or group ownership yet.
- **Off-chain costs are manual.** Your AWS/OpenAI bills have to be imported via CSV or API call — we don't auto-sync with vendor billing.
- **Historical balance sheets need an "archive" blockchain connection.** Today's balance sheet works everywhere; "show me the balance sheet on 2026-02-01" only works if the server is pointed at an archive-capable RPC.

Full list: [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

---

## For developers: using the framework

The primitives are published as `@agent-registry/sdk`. Minimal example:

```ts
import { AgentRegistryClient } from '@agent-registry/sdk'

const client = new AgentRegistryClient({ chain: 'base-sepolia' })

// Read-only (no wallet needed)
const invoice = await client.invoice.getInvoice(1n)
const company = await client.company.getCompany(1n)
```

See the full SDK walkthrough and API reference: [docs/QUICKSTART.md](docs/QUICKSTART.md) and the live docs site.

---

## Repository layout

```
.
├── apps/web/           The reference web app (what's deployed)
├── packages/
│   ├── contracts/      Solidity contracts + Foundry tests (62 pass)
│   ├── sdk/            TypeScript SDK — @agent-registry/sdk
│   ├── subgraph/       The Graph subgraph (event indexer)
│   └── shared/         Types, ABIs, constants
├── docs/               Concepts, architecture, limitations, white paper
├── LICENSE             MIT
└── README.md           You are here
```

## License

MIT — see [LICENSE](LICENSE). Pull requests welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).
