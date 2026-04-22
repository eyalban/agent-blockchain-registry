'use client'

import { useEffect, useState } from 'react'

export interface CompanyMember {
  agentId: string
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

export function useCompany(companyId: string | undefined): {
  data: Company | null
  isLoading: boolean
  reload: () => void
} {
  const [data, setData] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!companyId) return
    setIsLoading(true)
    fetch(`/api/v1/companies/${companyId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setData(j as Company | null))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false))
  }, [companyId, nonce])

  return { data, isLoading, reload: () => setNonce((n) => n + 1) }
}

export function useCompaniesList(): {
  data: Array<Pick<Company, 'companyId' | 'ownerAddress' | 'metadataURI' | 'name' | 'description' | 'logoURL' | 'jurisdictionCode' | 'createdAt'>>
  total: number
  isLoading: boolean
} {
  const [data, setData] = useState<
    Array<Pick<Company, 'companyId' | 'ownerAddress' | 'metadataURI' | 'name' | 'description' | 'logoURL' | 'jurisdictionCode' | 'createdAt'>>
  >([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetch('/api/v1/companies?limit=50')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: typeof data; total?: number } | null) => {
        if (j) {
          setData(j.data ?? [])
          setTotal(j.total ?? 0)
        }
      })
      .catch(() => {
        /* keep empty state */
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { data, total, isLoading }
}
