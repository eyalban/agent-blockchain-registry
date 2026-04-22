import type { Metadata } from 'next'

import { CompanyDetailView } from './company-detail-view'

interface Props {
  readonly params: Promise<{ companyId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { companyId } = await params
  return {
    title: `Company #${companyId} · Agent Registry`,
    description: `Details for agentic company #${companyId}.`,
  }
}

export default async function CompanyDetailPage({ params }: Props) {
  const { companyId } = await params
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CompanyDetailView companyId={companyId} />
    </div>
  )
}
