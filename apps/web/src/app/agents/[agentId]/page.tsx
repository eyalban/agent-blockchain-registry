import type { Metadata } from 'next'

import { AgentDetailView } from './agent-detail-view'

interface AgentDetailPageProps {
  readonly params: Promise<{ agentId: string }>
}

export async function generateMetadata({ params }: AgentDetailPageProps): Promise<Metadata> {
  const { agentId } = await params
  return {
    title: `Agent #${agentId}`,
    description: `View details for agent #${agentId} on the Agent Registry.`,
  }
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { agentId } = await params

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AgentDetailView agentId={agentId} />
    </div>
  )
}
