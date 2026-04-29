import type { Metadata } from 'next'

import { KpiStrip } from '@/components/ui/kpi-strip'
import { getAgentsPage } from '@/lib/agents-cache'
import { getAgentStats } from '@/lib/aggregate-stats'

import { AgentsList } from './agents-list'

export const metadata: Metadata = {
  title: 'Agents · statem8',
  description: 'Browse all registered AI agents on Base blockchain.',
}

// Render fresh on every request but stream the cache-hot data into the
// initial HTML so first paint shows agents instead of a loading skeleton.
export const dynamic = 'force-dynamic'
export const revalidate = 0

const PAGE_SIZE = 60

export default async function AgentsPage() {
  const [{ data }, stats] = await Promise.all([
    getAgentsPage(PAGE_SIZE, 0),
    getAgentStats(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-(--color-magenta-700)">
          Registry
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-text-primary)">
          Agents
        </h1>
        <p className="mt-3 max-w-2xl text-(--color-text-secondary)">
          {stats.total.toLocaleString()} ERC-8004 agents indexed on Base. Each
          one carries a portable on-chain identity, a tokenURI agent card, and
          a reputation history any compliant client can verify.
        </p>
      </div>

      <div className="mt-8">
        <KpiStrip
          cells={[
            { label: 'Total agents', value: stats.total.toLocaleString() },
            { label: 'Distinct owners', value: stats.uniqueOwners.toLocaleString() },
            { label: 'In a company', value: stats.withCompany.toLocaleString() },
          ]}
        />
      </div>

      <div className="mt-6">
        <AgentsList
          initialAgents={data.map((a) => ({
            agentId: a.agentId,
            owner: a.owner,
            tokenURI: a.tokenURI,
            name: a.name ?? `Agent #${a.agentId}`,
            description: a.description ?? '',
            image: a.image ?? '',
            tags: [],
            companyId: a.companyId,
            companyName: a.companyName,
          }))}
        />
      </div>
    </div>
  )
}
