# 1-Minute Video Script — Statemate Experiments

**Title:** "ERC-8004 Statemate: System Experiments on Base Sepolia"  
**Duration:** ~60 seconds  
**Recording method:** Screen record (QuickTime/OBS/Loom)

---

## Script & Actions (time-stamped)

### 0:00-0:10 — Show the live app
**Action:** Open https://agent-registry-seven.vercel.app  
**Narration:** "This is the Statemate — a blockchain-based registry for AI agents, built on the ERC-8004 standard and deployed on Base Sepolia. Let me show the results of three system experiments."

### 0:10-0:15 — Show the agents list
**Action:** Navigate to https://agent-registry-seven.vercel.app/agents  
**Narration:** "There are now 60 agents registered on-chain, including 6 that were registered autonomously from Vercel serverless functions."

### 0:15-0:25 — Show Experiment 1 results (terminal)
**Action:** Switch to terminal, show the experiment output or open the summary at `experiments/EXPERIMENT-SUMMARY.md`  
**Narration:** "Experiment 1 compared data URI versus IPFS CID registration. Result: IPFS CIDs use 56% less gas — 177K versus 408K gas units. Always upload to IPFS first."

### 0:25-0:35 — Show Experiment 2 results
**Action:** Show the API performance numbers from the summary  
**Narration:** "Experiment 2 benchmarked our REST API against direct RPC calls. Direct RPC averaged 32 milliseconds, the API averaged 112 milliseconds. The 80ms overhead is acceptable for non-Web3 clients."

### 0:35-0:45 — Show Experiment 3 (cloud agents)
**Action:** Open https://agent-registry-seven.vercel.app/api/v1/agents/experiment in browser (or show cached result)  
**Narration:** "Experiment 3 ran entirely on cloud infrastructure. A single Vercel serverless function created 6 agent wallets, funded them via CDP faucet, and registered 5 of 6 on-chain — all in 12 seconds with zero human interaction."

### 0:45-0:55 — Show an agent detail page
**Action:** Navigate to https://agent-registry-seven.vercel.app/agents/1  
**Narration:** "Each agent has an on-chain identity card with reputation scores and feedback from other agents. The reputation tab shows real feedback from our experiment — three wallets submitted scores of plus 80, plus 60, and minus 20."

### 0:55-1:00 — Closing
**Action:** Show the homepage hero  
**Narration:** "The key takeaway: autonomous AI agents can register, discover, and evaluate each other entirely on-chain, with gasless registration via the CDP Paymaster. 60 agents and counting."

---

## URLs to show:
1. https://agent-registry-seven.vercel.app (homepage)
2. https://agent-registry-seven.vercel.app/agents (registry with 60 agents)
3. https://agent-registry-seven.vercel.app/agents/1 (agent detail with reputation)
4. https://agent-registry-seven.vercel.app/api/v1/agents/experiment (cloud experiment endpoint)
5. Terminal showing experiment results or `experiments/EXPERIMENT-SUMMARY.md`
