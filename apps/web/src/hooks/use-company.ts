'use client'

import { useQuery } from '@tanstack/react-query'

export interface CompanyMember {
  agentId: string
  /**
   * Display name resolved from the agent's on-chain card metadata
   * (IdentityRegistry `tokenURI` → IPFS JSON `.name`). Null when the
   * card couldn't be fetched or didn't include a `name` field; the UI
   * falls back to `#${agentId}` in that case.
   */
  name: string | null
  addedAt: string
  addedTxHash: string
}

export interface CompanyTreasury {
  address: string
  label: string | null
  addedAt: string
}

export interface Company {
  companyId: string
  chainId: number
  founderAddress: string
  ownerAddress: string
  metadataURI: string
  name: string | null
  description: string | null
  logoURL: string | null
  jurisdictionCode: string | null
  createdTxHash: string
  createdBlock: number
  createdAt: string
  members: CompanyMember[]
  treasuries: CompanyTreasury[]
}

type CompanySummary = Pick<
  Company,
  | 'companyId'
  | 'ownerAddress'
  | 'metadataURI'
  | 'name'
  | 'description'
  | 'logoURL'
  | 'jurisdictionCode'
  | 'createdAt'
>

export function useCompany(companyId: string | undefined): {
  data: Company | null
  isLoading: boolean
  reload: () => void
} {
  const query = useQuery({
    queryKey: ['company', companyId],
    queryFn: async (): Promise<Company | null> => {
      const r = await fetch(`/api/v1/companies/${companyId}`)
      return r.ok ? ((await r.json()) as Company) : null
    },
    enabled: !!companyId,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    reload: () => {
      void query.refetch()
    },
  }
}

export function useCompaniesList(): {
  data: CompanySummary[]
  total: number
  isLoading: boolean
} {
  const query = useQuery({
    queryKey: ['companies', { limit: 50 }],
    queryFn: async (): Promise<{ data: CompanySummary[]; total: number }> => {
      const r = await fetch('/api/v1/companies?limit=50')
      if (!r.ok) return { data: [], total: 0 }
      const j = (await r.json()) as { data?: CompanySummary[]; total?: number }
      return { data: j.data ?? [], total: j.total ?? 0 }
    },
  })

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isPending,
  }
}
