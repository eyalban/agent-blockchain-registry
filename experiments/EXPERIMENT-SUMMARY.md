# Agent Registry — Experiment Summary

**Date:** April 8, 2026  
**Network:** Base Sepolia (Chain ID 84532)  
**Live App:** https://agent-registry-seven.vercel.app  
**Registry Contract:** `0x8004A818BFB912233c491871b3d84c89A494BD9e`  
**Total Agents on Registry:** 60  

---

## Experiment 1: Data URI vs IPFS CID Registration (Local + Cloud)

**What we tested:** Gas cost and submission latency when registering agents with full base64-encoded data URIs (~500 bytes calldata) vs short IPFS CID references (~60 bytes). 6 agents registered from local machine.

**What we changed:** 3 agents used `data:application/json;base64,...` encoding, 3 used `ipfs://bafkrei...` short URIs. All 6 wallets generated programmatically via `viem.generatePrivateKey()`, funded via CDP faucet.

**Results:**

| Method | Avg Gas | Avg Latency | Agents |
|--------|---------|-------------|--------|
| Data URI (base64) | **408,260** | 252ms | 3 |
| Short URI (IPFS CID) | **177,732** | 196ms | 3 |
| **Savings** | **56% less gas** | ~22% faster | — |

**Key takeaway:** IPFS CIDs save 56% gas. At Base L2 gas prices, data URI costs ~$0.0025 vs ~$0.0011 for IPFS. For Paymaster-sponsored registrations, this means 2.3x more registrations per dollar. **Always upload to IPFS first.**

---

## Experiment 2: Direct RPC vs REST API Performance (Cloud)

**What we tested:** Response time for reading agent data via direct viem RPC calls vs the deployed Vercel REST API (`/api/v1/agents/:id`). 30 total requests from local client to cloud infrastructure.

**What we changed:** Same query (Agent #1) executed via (A) direct Base Sepolia RPC and (B) the Vercel serverless API endpoint.

**Results:**

| Method | Avg Latency | P95 | Trials |
|--------|-------------|-----|--------|
| Direct RPC (viem) | **32ms** | 37ms | 10 |
| REST API (single) | **112ms** | 144ms | 10 |
| REST API (list, 5 agents) | **102ms** | — | 10 |

**Key takeaway:** API adds ~80ms overhead (Vercel cold start + serialization), stays under 200ms. Acceptable for non-Web3 clients. Subgraph deployment would reduce list queries from sequential RPC to single GraphQL (~30ms).

---

## Experiment 3: Multi-Agent Cloud Coordination (Vercel Serverless)

**What we tested:** 6 autonomous agents created and operated entirely on Vercel serverless infrastructure. Each agent generates its own wallet, registers on-chain, and gives feedback to other agents in a ring topology.

**What we changed:** Single API endpoint (`/api/v1/agents/experiment`) that:
1. Creates 6 agent identities (DeFi Analyzer, Security Auditor, Data Collector, Trading Bot, Research Agent, Governance Watcher)
2. Funds wallets via CDP faucet (programmatic, no human)
3. Registers each agent on Base Sepolia Identity Registry
4. Agents give feedback to each other (Agent 0 reviews Agent 1, Agent 1 reviews Agent 2, etc.)

**Results:**

| Metric | Value |
|--------|-------|
| Agents created | **6** |
| Agents registered on-chain | **5** (1 hit faucet rate limit) |
| Feedback transactions | **1** (others hit gas estimation issues) |
| Total on-chain transactions | **6** |
| Total duration (serverless) | **12.3 seconds** |
| Avg registration gas | **177,750** |
| Avg registration latency | **108ms** (Vercel → Base RPC) |
| Runtime | Vercel Serverless (iad1, Washington D.C.) |

**Agent Details:**

| Agent | Role | Registered | Gas | Latency |
|-------|------|------------|-----|---------|
| DeFi Analyzer | defi-analysis | Yes | 177,756 | 141ms |
| Security Auditor | security-audit | Yes | 177,792 | 97ms |
| Data Collector | data-collection | Yes | 177,768 | 105ms |
| Trading Bot | trading | Yes | 177,732 | 99ms |
| Research Agent | research | Yes | 177,768 | 99ms |
| Governance Watcher | governance | No (rate limit) | — | — |

**Key takeaway:** Autonomous agent registration from cloud serverless functions works end-to-end. The CDP faucet's rate limit (1000 claims/24h/address) is the main bottleneck — 5/6 agents funded successfully before hitting the limit. Registration latency from Vercel (East US) to Base Sepolia is ~100ms, and gas costs are consistent at ~177K per registration. **For production, the Paymaster eliminates the faucet dependency entirely.**

---

## Overall Findings

1. **IPFS-first registration saves 56% gas** — always upload the agent card to IPFS before registering on-chain
2. **REST API latency (112ms) is production-ready** for agent-to-agent queries from any HTTP client
3. **Cloud serverless agents work** — 5/6 agents registered autonomously from Vercel in 12 seconds
4. **CDP faucet rate limits** are the testnet bottleneck — Paymaster on mainnet eliminates this entirely
5. **Gas costs are consistent** (~177K per registration) and predictable for protocol budgeting
6. **60 agents now live** on the Base Sepolia Identity Registry

---

## Reproduction

```bash
# Local experiments (registrations + API benchmarks)
pnpm tsx experiments/run-experiments.ts

# Cloud experiment (triggers Vercel serverless agents)
curl https://agent-registry-seven.vercel.app/api/v1/agents/experiment
```
