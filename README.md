# agent-registry

> An on-chain framework for AI-agent identity, companies, invoices, and accounting. Solidity contracts, a TypeScript SDK, and a subgraph. Built on [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) and deployed on Base.

![license: MIT](https://img.shields.io/badge/license-MIT-blue) ![solidity: ^0.8.24](https://img.shields.io/badge/solidity-^0.8.24-informational) ![tests: 62/62](https://img.shields.io/badge/tests-62%20passing-brightgreen)

This repository contains the **framework** — the smart contracts, the TypeScript SDK, the subgraph, and the shared ABIs/types/constants that any application building agentic financial tooling can depend on. A reference web product that uses this framework is deployed separately (see [website](#website)).

---

## Contents

- [Install](#install)
- [Quick usage](#quick-usage)
- [Packages](#packages)
- [Contract addresses (Base Sepolia)](#contract-addresses-base-sepolia)
- [Primitives](#primitives)
- [Deploy your own](#deploy-your-own)
- [Development](#development)
- [Limitations](#limitations)
- [Website](#website)
- [License](#license)

---

## Install

```bash
npm install @agent-registry/sdk viem
# or: pnpm add / yarn add
```

Peer dependencies: `viem ^2`. Optional: `@x402/fetch` for x402 payment integrations.

Works from Node.js 20+, any modern browser, Cloudflare Workers, Vercel Edge.

## Quick usage

```ts
import { AgentRegistryClient } from '@agent-registry/sdk'

const client = new AgentRegistryClient({ chain: 'base-sepolia' })

// Reads — no wallet needed
const agentURI  = await client.identity.getAgentURI(1n)
const company   = await client.company.getCompany(1n)
const invoice   = await client.invoice.getInvoice(1n)

// Writes — pass a viem / wagmi WalletClient
const { companyId } = await client.company.createCompany(walletClient, {
  metadataURI: 'ipfs://Qm…',
})

await client.company.addAgent(walletClient, companyId, 42n)
await client.company.addTreasury(walletClient, companyId, '0xTreasury…')

const { invoiceId } = await client.invoice.createInvoice(walletClient, {
  payer: '0xBob…',
  issuerCompanyId: companyId,
  payerCompanyId: 0n,
  token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC (Base Sepolia)
  amount: 100_000_000n,                                // 100 USDC (6 decimals)
  dueBlock: 0n,
  memoURI: 'ipfs://Qm…',
  memoHash: '0x…',
})

await client.invoice.payERC20(bobWalletClient, invoiceId)
```

Sub-clients: `client.identity`, `client.reputation`, `client.company`, `client.invoice`.

## Packages

| Package | What it is | When to use it |
|---------|------------|----------------|
| [`packages/contracts/`](packages/contracts) | Solidity sources, Foundry tests, deploy scripts | You want to read or fork the contracts, or redeploy to a new chain |
| [`packages/sdk/`](packages/sdk) (`@agent-registry/sdk`) | TypeScript client — reads + writes via `viem` | You're building an app / server / CLI against the registries |
| [`packages/subgraph/`](packages/subgraph) | The Graph subgraph — schema + event handlers | You want GraphQL queries over all events, or an independent backup indexer |
| [`packages/shared/`](packages/shared) | ABIs, addresses, supported tokens, Chainlink feed addresses, Zod schemas | Consumed by the SDK; import directly if you need the raw ABI or chain constants |

## Contract addresses (Base Sepolia)

| Contract | Address | Source |
|----------|---------|--------|
| `IdentityRegistry` | [`0x8004A818BFB912233c491871b3d84c89A494BD9e`](https://sepolia.basescan.org/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) | Canonical ERC-8004 |
| `ReputationRegistry` | [`0x8004B663056A597Dffe9eCcC1965A193B7388713`](https://sepolia.basescan.org/address/0x8004B663056A597Dffe9eCcC1965A193B7388713) | Canonical ERC-8004 |
| `AgentRegistryWrapper` | [`0xC02DE01B0ecBcE17c4E71fc7A0Ad86764B3DF64C`](https://sepolia.basescan.org/address/0xC02DE01B0ecBcE17c4E71fc7A0Ad86764B3DF64C) | [`AgentRegistryWrapper.sol`](packages/contracts/src/AgentRegistryWrapper.sol) |
| **`CompanyRegistry`** | [`0xD557AF896A116bdb9A671f2eB45baAa8e521f77f`](https://sepolia.basescan.org/address/0xD557AF896A116bdb9A671f2eB45baAa8e521f77f) | [`CompanyRegistry.sol`](packages/contracts/src/CompanyRegistry.sol) |
| **`InvoiceRegistry`** | [`0x645acDD5f85B52AD0CcE55B1c4f4Ac8BA00EC0Ac`](https://sepolia.basescan.org/address/0x645acDD5f85B52AD0CcE55B1c4f4Ac8BA00EC0Ac) | [`InvoiceRegistry.sol`](packages/contracts/src/InvoiceRegistry.sol) |

Chain: Base Sepolia (`84532`). Mainnet pending external audit.

## Primitives

### Identity (ERC-8004)

```solidity
interface IIdentityRegistry {
  function register(string memory agentURI, MetadataEntry[] memory metadata) external returns (uint256);
  function ownerOf(uint256 agentId) external view returns (address);
  function tokenURI(uint256 agentId) external view returns (string memory);
}
```

Every agent is an NFT. Its `tokenURI` points to an ERC-8004 agent card (name, description, endpoints, skills, supported trust models).

### Reputation (ERC-8004)

Anyone who transacted with an agent can submit structured feedback on-chain. Agents carry reputation across apps.

### Discovery — `AgentRegistryWrapper`

Adds a thin layer on top of the canonical identity contract: discovery tags, a registration fee, featured agents, activity tracking. Preserves full ERC-8004 interoperability.

### Company — `CompanyRegistry` (this repo)

Minimal on-chain primitive for grouping agents into a company. No custody of funds; ownership is a single EOA; membership and treasuries are stored as sets.

```solidity
function createCompany(string calldata metadataURI) external returns (uint256 companyId);
function addAgent(uint256 companyId, uint256 agentId) external;           // reverts if caller doesn't own agentId in the canonical registry
function addTreasury(uint256 companyId, address treasury) external;
function transferCompanyOwnership(uint256 companyId, address newOwner) external;

// Views
function companyOwner(uint256 companyId) external view returns (address);
function companyMetadataURI(uint256 companyId) external view returns (string memory);
function hasMember(uint256 companyId, uint256 agentId) external view returns (bool);
function hasTreasury(uint256 companyId, address treasury) external view returns (bool);
function members(uint256 companyId) external view returns (uint256[] memory);
function treasuries(uint256 companyId) external view returns (address[] memory);
```

Events: `CompanyCreated`, `AgentAdded`, `AgentRemoved`, `TreasuryAdded`, `TreasuryRemoved`, `CompanyMetadataUpdated`, `CompanyOwnershipTransferred`. 25 unit tests.

### Invoice — `InvoiceRegistry` (this repo)

Atomic invoice settlement. One transaction both transfers funds and marks the invoice paid.

```solidity
function createInvoice(
  address payer,
  uint256 issuerCompanyId,
  uint256 payerCompanyId,
  address token,            // address(0) = native ETH
  uint256 amount,           // raw token units
  uint256 dueBlock,         // 0 = no due date
  string calldata memoURI,  // IPFS or https
  bytes32 memoHash          // sha256 of memo for integrity
) external returns (uint256 id);

function payInvoiceETH(uint256 id) external payable;
function payInvoiceERC20(uint256 id) external;           // requires prior token.approve()
function cancelInvoice(uint256 id) external;
function requestInvoice(                                 // bookmark: "please invoice me for X"
  address issuerSuggested, address token,
  uint256 amount, string calldata memoURI
) external returns (uint256 requestId);

function getInvoice(uint256 id) external view returns (Invoice memory);
function statusOf(uint256 id) external view returns (Status);
```

Events: `InvoiceCreated`, `InvoicePaid`, `InvoiceCancelled`, `InvoiceRequested`. 21 unit tests, including full ERC-20 flow against a mock token.

## Deploy your own

If you want to redeploy the contracts to a different chain or your own testnet:

```bash
git clone https://github.com/eyalban/agent-blockchain-registry.git
cd agent-registry
pnpm install

cd packages/contracts
forge build
forge test                   # 62 tests should pass

# Configure a deployer. Two options:
#   A) Generate + auto-fund via Coinbase CDP faucet (Base Sepolia only):
#       cp .env.example .env
#       # fill CDP_API_KEY_ID + CDP_API_KEY_SECRET (free at portal.cdp.coinbase.com)
#       npx tsx script/autonomous-deploy-company.ts
#       npx tsx script/autonomous-deploy-invoice.ts
#
#   B) Use your own private key:
#       DEPLOYER_PRIVATE_KEY=0x… forge script script/DeployCompanyRegistry.s.sol \
#         --rpc-url base_sepolia --broadcast
#       DEPLOYER_PRIVATE_KEY=0x… forge script script/DeployInvoiceRegistry.s.sol \
#         --rpc-url base_sepolia --broadcast
```

Output is the deployed address for each contract. Update `packages/shared/src/constants/addresses.ts` (or the relevant env var) in consumers.

Full walk-through including subgraph redeploy: [docs/QUICKSTART.md](docs/QUICKSTART.md).

## Development

```bash
pnpm install
pnpm typecheck                 # strict TS across all packages
pnpm lint
pnpm test                      # Vitest unit tests (SDK)
pnpm build                     # Turborepo build

cd packages/contracts
forge fmt                      # format Solidity
forge test -vvv                # verbose with traces
forge test --match-contract CompanyRegistryTest
```

Conventions (enforced by [CLAUDE.md](CLAUDE.md)): no `any`, no `as` casts, no `@ts-ignore`, 2-space indentation, Prettier formatting, 100-char line length, single quotes, no semicolons.

## Limitations

- **Testnet only.** Both new contracts are unaudited. Do not deploy to mainnet without a security audit — they handle user funds.
- **Single-EOA company ownership.** No multi-sig; whoever holds the company's EOA can change membership, metadata, and transfer ownership. Multi-sig is a v1.1 item.
- **Invoice payment requires prior approve for ERC-20.** Two transactions on first use. EIP-2612 `permit` support (single-tx USDC flow on Base mainnet) is on the roadmap.
- **Companies don't custody funds.** The contract is a membership/metadata registry — there is no "company wallet" controlled by the contract. Treasuries are just addresses registered under the company id.
- **No multi-chain identity.** Each chain has its own deployment. Cross-chain company consolidation is out of scope for v1.
- **Subgraph is optional.** The SDK reads directly from the contracts; the subgraph gives you GraphQL + historical event pagination but isn't required.

Full list and roadmap: [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

## Website

A reference implementation of a full product built on this framework — a web app for creating companies, viewing consolidated income statements, issuing and paying invoices — is deployed at **[agent-registry-seven.vercel.app](https://agent-registry-seven.vercel.app)** (replace with your deployed URL). Its documentation page walks through every user-visible concept in plain English.

That web app is *not part of the framework*. It's a separate deliverable that demonstrates the framework's capabilities.

## Documentation

| Doc | Audience |
|-----|----------|
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Integrators — 5-minute setup |
| [docs/CONCEPTS.md](docs/CONCEPTS.md) | Non-expert readers — plain-English primer on agents, companies, invoices, provenance |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Contributors — deep reference |
| [docs/LIMITATIONS.md](docs/LIMITATIONS.md) | Evaluators — honest tradeoffs + roadmap |
| [docs/WHITEPAPER.md](docs/WHITEPAPER.md) | Research-oriented readers |

## Contributing

Issues and PRs welcome. Before opening a PR, run `pnpm typecheck && pnpm lint && forge test`. Keep contract changes minimal — the framework aims for a stable, small surface area.

## License

[MIT](LICENSE).
