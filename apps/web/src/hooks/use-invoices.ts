'use client'

import { useEffect, useState } from 'react'

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

export function useInvoices(params: {
  issuer?: string
  payer?: string
  companyId?: string
  status?: string
}): { data: InvoiceRecord[]; isLoading: boolean; reload: () => void } {
  const [data, setData] = useState<InvoiceRecord[]>([])
  const [isLoading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const qs = new URLSearchParams()
    if (params.issuer) qs.set('issuer', params.issuer)
    if (params.payer) qs.set('payer', params.payer)
    if (params.companyId) qs.set('companyId', params.companyId)
    if (params.status) qs.set('status', params.status)

    setLoading(true)
    fetch(`/api/v1/invoices?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: InvoiceRecord[] } | null) => setData(j?.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [params.issuer, params.payer, params.companyId, params.status, nonce])

  return { data, isLoading, reload: () => setNonce((n) => n + 1) }
}

export function useInvoice(invoiceId: string | undefined): {
  data: InvoiceRecord | null
  isLoading: boolean
  reload: () => void
} {
  const [data, setData] = useState<InvoiceRecord | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!invoiceId) return
    setLoading(true)
    fetch(`/api/v1/invoices/${invoiceId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setData(j as InvoiceRecord | null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [invoiceId, nonce])

  return { data, isLoading, reload: () => setNonce((n) => n + 1) }
}
