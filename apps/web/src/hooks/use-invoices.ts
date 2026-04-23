'use client'

import { useQuery } from '@tanstack/react-query'

export interface InvoiceRecord {
  invoiceId: string
  chainId: number
  issuerAddress: string
  payerAddress: string
  issuerCompanyId: string | null
  payerCompanyId: string | null
  issuerAgentId: string | null
  payerAgentId: string | null
  tokenAddress: string | null
  tokenSymbol: string
  amountRaw: string
  amountUsdAtIssue: number | null
  priceSource: string | null
  status: 'issued' | 'paid' | 'cancelled'
  memoUri: string
  memoHash: string
  dueBlock: number | null
  issuedAt: string
  issuedTxHash: string
  paidAt: string | null
  paidTxHash: string | null
  cancelledAt: string | null
  cancelledTxHash: string | null
}

interface InvoicesParams {
  issuer?: string
  payer?: string
  companyId?: string
  status?: string
}

export function useInvoices(params: InvoicesParams): {
  data: InvoiceRecord[]
  isLoading: boolean
  reload: () => void
} {
  const query = useQuery({
    queryKey: ['invoices', params],
    queryFn: async (): Promise<InvoiceRecord[]> => {
      const qs = new URLSearchParams()
      if (params.issuer) qs.set('issuer', params.issuer)
      if (params.payer) qs.set('payer', params.payer)
      if (params.companyId) qs.set('companyId', params.companyId)
      if (params.status) qs.set('status', params.status)
      const r = await fetch(`/api/v1/invoices?${qs}`)
      if (!r.ok) return []
      const j = (await r.json()) as { data?: InvoiceRecord[] } | null
      return j?.data ?? []
    },
  })

  return {
    data: query.data ?? [],
    isLoading: query.isPending,
    reload: () => {
      void query.refetch()
    },
  }
}

export function useInvoice(invoiceId: string | undefined): {
  data: InvoiceRecord | null
  isLoading: boolean
  reload: () => void
} {
  const query = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async (): Promise<InvoiceRecord | null> => {
      const r = await fetch(`/api/v1/invoices/${invoiceId}`)
      return r.ok ? ((await r.json()) as InvoiceRecord) : null
    },
    enabled: !!invoiceId,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    reload: () => {
      void query.refetch()
    },
  }
}
