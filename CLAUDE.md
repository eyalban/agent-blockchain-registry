# Agent Blockchain Registry - Development Standards

## Project Overview
AI Agent Registry built on ERC-8004 ("Trustless Agents") standard, deployed on Base Sepolia / Base mainnet. Turborepo monorepo with Next.js 15, Foundry smart contracts, The Graph subgraph, and a published TypeScript SDK.

## Monorepo Structure
- `apps/web/` - Next.js 15 App Router application
- `packages/contracts/` - Foundry smart contracts (Solidity)
- `packages/subgraph/` - The Graph subgraph
- `packages/sdk/` - @agent-registry/sdk (npm package)
- `packages/shared/` - Shared types, constants, Zod schemas, ABIs

## Commands
```bash
pnpm dev              # Start Next.js dev server
pnpm build            # Build all packages
pnpm lint             # ESLint across all packages
pnpm typecheck        # TypeScript strict check across all packages
pnpm test             # Vitest unit tests
pnpm test:e2e         # Playwright end-to-end tests

# Contracts (from packages/contracts/)
forge build           # Compile contracts
forge test            # Run Foundry tests
forge test -vvv       # Verbose test output with traces

# Subgraph (from packages/subgraph/)
graph codegen         # Generate types from schema
graph build           # Build subgraph
```

---

## Mandatory Workflow Rules

### 1. Validate After Every Task
After completing ANY code change, you MUST:
1. Run `pnpm typecheck` to verify no type errors
2. Run `pnpm lint` to verify no lint violations
3. Run relevant tests (`pnpm test` or `forge test`)
4. If a UI component was changed, visually verify it renders correctly

Never mark a task complete if any of these checks fail. Fix all errors before moving on.

### 2. Type Safety is Non-Negotiable
- **NEVER use `any`**. Use `unknown` + type narrowing if the type is truly unknown.
- **NEVER use `as` type assertions** unless casting from `unknown` after a runtime check.
- **NEVER use `@ts-ignore` or `@ts-expect-error`**.
- All function parameters and return types must be explicitly typed.
- All API responses must be validated with Zod schemas before use.
- Shared types go in `packages/shared/src/types/` — never duplicate type definitions across packages.

### 3. Code Formatting
- **Prettier** handles all formatting. Do not manually format code.
- **2-space indentation** for TypeScript/JavaScript/JSON.
- **4-space indentation** for Solidity.
- **Single quotes** for strings in TypeScript.
- **Double quotes** for JSX attributes.
- **No semicolons** in TypeScript (Prettier enforced).
- **Trailing commas** everywhere (ES5 style).
- Max line length: 100 characters.
- Imports sorted: external deps first, then internal `@agent-registry/*`, then relative paths.
- Use `import type { X }` for type-only imports.

### 4. Naming Conventions
| Item | Convention | Example |
|------|-----------|---------|
| Files (components) | kebab-case | `agent-card.tsx` |
| Files (hooks) | kebab-case with `use-` prefix | `use-register-agent.ts` |
| Files (utils/lib) | kebab-case | `wagmi-config.ts` |
| React components | PascalCase | `AgentCard` |
| Hooks | camelCase with `use` prefix | `useRegisterAgent` |
| Constants | SCREAMING_SNAKE_CASE | `IDENTITY_REGISTRY_ADDRESS` |
| Types/Interfaces | PascalCase | `AgentCard`, `FeedbackEntry` |
| Enums | PascalCase (members too) | `AgentStatus.Active` |
| Solidity contracts | PascalCase | `AgentRegistryWrapper` |
| Solidity functions | camelCase | `registerAgent` |
| Solidity events | PascalCase | `AgentRegisteredViaWrapper` |
| Solidity constants | SCREAMING_SNAKE_CASE | `MAX_TAGS` |
| GraphQL entities | PascalCase | `Agent`, `Feedback` |
| API routes | kebab-case URL segments | `/api/v1/agents/:agentId/reputation` |
| Environment variables | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_CHAIN_ID` |

### 5. Component Architecture
- One component per file. File name matches component name in kebab-case.
- Props interface defined in the same file, named `{ComponentName}Props`.
- Use `function` declarations for components, not arrow functions.
- Mark client components with `'use client'` only when necessary. Prefer Server Components.
- Hooks that call `useWriteContract` or `useWaitForTransactionReceipt` must handle loading, error, and success states explicitly.
- All user-facing text must be in the component — no external string files (we're not i18n yet).

```tsx
// CORRECT
'use client'

import type { AgentCardProps } from './types'

export function AgentCard({ agent, onSelect }: AgentCardProps) {
  // ...
}
```

### 6. Smart Contract Standards
- Solidity version: `^0.8.24` (consistent across all contracts).
- Use OpenZeppelin contracts where applicable.
- All public/external functions must have NatSpec documentation (`@dev`, `@param`, `@return`).
- All state-changing functions must emit events.
- Use `custom errors` instead of `require` strings (gas optimization).
- Every contract function must have a corresponding Foundry test.
- Fork tests must test against Base Sepolia state.
- Run `forge fmt` before committing Solidity changes.

### 7. Error Handling
- **Frontend**: Use error boundaries for page-level errors. Use toast notifications for user-actionable errors. Never show raw error messages to users.
- **API routes**: Return structured JSON errors: `{ error: string, code: string, details?: unknown }`. Use consistent HTTP status codes.
- **Contract interactions**: Always handle revert reasons. Display human-readable messages for known revert codes.
- **SDK**: Throw typed errors extending a base `RegistryError` class with `code` and `cause`.

### 8. Testing Requirements
- **Unit tests (Vitest)**: All hooks, utilities, and pure functions must have tests.
- **Contract tests (Foundry)**: 100% line coverage for the wrapper contract. Use fork tests.
- **Component tests**: Key user flows (registration wizard, feedback form) need integration tests.
- **E2E tests (Playwright)**: Critical paths — wallet connect, register agent, view agent, give feedback.
- **SDK tests**: All public methods must have tests with mocked viem clients.
- Test files are colocated: `use-register-agent.test.ts` next to `use-register-agent.ts`.

### 9. Web3 Patterns
- **NEVER hardcode contract addresses**. Import from `packages/shared/src/constants/addresses.ts`.
- **NEVER hardcode chain IDs**. Import from `packages/shared/src/constants/chains.ts`.
- All contract reads go through wagmi hooks (`useReadContract`) or viem's `publicClient`.
- All contract writes go through wagmi hooks (`useWriteContract`).
- Always wait for transaction confirmation with `useWaitForTransactionReceipt`.
- Show transaction hash link (to BaseScan) immediately after submission, before confirmation.
- Use `parseEther`, `formatEther`, `parseUnits`, `formatUnits` from viem — never manual BigInt math for display values.

### 10. API Route Patterns
```typescript
// Every API route handler follows this pattern:
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRateLimit } from '@/lib/rate-limit'
import { validateApiKey } from '@/lib/api-keys'

const querySchema = z.object({ /* ... */ })

export async function GET(request: NextRequest) {
  // 1. Rate limit check
  // 2. Optional API key validation
  // 3. Input validation with Zod
  // 4. Business logic
  // 5. Return typed response
}
```

### 11. Environment Variables
- All client-exposed vars must be prefixed with `NEXT_PUBLIC_`.
- Never commit `.env` files. Use `.env.example` as template.
- Required vars must be validated at startup using Zod in `src/lib/env.ts`.
- Contract addresses and RPC URLs are configured via env vars, not hardcoded.

### 12. Git Conventions
- Branch naming: `feat/`, `fix/`, `chore/`, `docs/` prefix.
- Commit messages: imperative mood, max 72 chars first line.
- One logical change per commit.
- Always run `pnpm lint && pnpm typecheck` before committing.
- Never commit generated files (ABIs are built, not committed; exception: canonical ABIs in shared package).

### 13. Performance Standards
- Lighthouse score > 90 on all metrics.
- First Contentful Paint < 1.5s.
- No client-side JavaScript for pages that can be Server Components.
- Images use `next/image` with proper sizing and lazy loading.
- Dynamic imports for heavy components (charts, graphs).
- Subgraph queries use pagination (first/skip) — never fetch unbounded lists.
- Redis caching for all IPFS fetches (5-minute TTL) and subgraph queries (30-second TTL).

### 14. Accessibility Standards
- WCAG 2.1 AA compliance.
- All interactive elements must be keyboard navigable.
- All images must have alt text.
- Color contrast ratio >= 4.5:1 for text.
- Form inputs must have visible labels.
- Error messages must be associated with their inputs via `aria-describedby`.
- Use Radix UI primitives (they handle aria attributes automatically).

### 15. Security Checklist
- [ ] No secrets in client-side code.
- [ ] API keys hashed with argon2 before storage.
- [ ] Rate limiting on all public API endpoints.
- [ ] Zod validation on all user inputs (frontend AND backend).
- [ ] CORS configured to allow only known origins.
- [ ] CSP headers set in `next.config.ts`.
- [ ] Smart contract: reentrancy guards on state-changing functions.
- [ ] Smart contract: access control on admin functions.
- [ ] Smart contract: input validation (URI length, tag count limits).
- [ ] No `eval()`, `dangerouslySetInnerHTML`, or `innerHTML` usage.

---

## Package Dependency Rules
- `packages/shared` has ZERO runtime dependencies (only `zod` as peer).
- `packages/sdk` depends only on `viem` as peer. `@x402/fetch` is optional peer.
- `packages/subgraph` has no npm dependencies (AssemblyScript only).
- `apps/web` can depend on all packages.
- Packages NEVER import from `apps/web`.
- `packages/sdk` and `packages/shared` NEVER import from `packages/contracts`.
- ABI files are the interface boundary: contracts build ABIs -> shared exports them -> app and SDK consume them.

## Network Configuration
- **Testnet**: Base Sepolia (Chain ID: 84532)
- **Mainnet**: Base (Chain ID: 8453)
- **Identity Registry**: `0x8004A818BFB912233c491871b3d84c89A494BD9e` (Base Sepolia, verified)
- **Reputation Registry**: `0x8004B663056A597Dffe9eCcC1965A193B7388713` (Base Sepolia, verified)
- **Wrapper Contract**: Deployed by us (address in env vars)
