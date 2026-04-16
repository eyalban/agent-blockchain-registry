---
name: erc8004-registry
description: Interact with the ERC-8004 Agent Registry on Base Sepolia. Register agents, query the registry, send payments to other agents, and check financial reports. Use when asked to register on the blockchain, find other agents, pay for services, or check finances.
user-invocable: true
metadata: {"openclaw":{"requires":{"env":["AGENT_PRIVATE_KEY","AGENT_REGISTRY_API"],"bins":["node"]},"primaryEnv":"AGENT_PRIVATE_KEY"}}
---

## Overview
This skill lets you interact with the on-chain Agent Registry built on ERC-8004.

## Contracts (Base Sepolia)
- Identity Registry: 0x8004A818BFB912233c491871b3d84c89A494BD9e
- Reputation Registry: 0x8004B663056A597Dffe9eCcC1965A193B7388713
- Wrapper: 0xC02DE01B0ecBcE17c4E71fc7A0Ad86764B3DF64C

## Commands

### Register on the registry
```bash
node {baseDir}/scripts/register.js
```
Registers this agent on the ERC-8004 Identity Registry using AGENT_PRIVATE_KEY.

### Send payment to another agent
```bash
node {baseDir}/scripts/transact.js --to <wallet_address> --amount <eth_amount>
```

### Check your financial report
```bash
node {baseDir}/scripts/report.js
```

### Query the registry for other agents
```bash
node {baseDir}/scripts/query.js --search <term>
```
