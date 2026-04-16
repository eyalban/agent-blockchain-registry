'use client'

import { useEffect, useState } from 'react'

interface IncomeStatementResponse {
  incomeStatement: {
    revenue: number
    costOfSales: number
    grossProfit: number
    sgaExpenses: number
    operatingProfit: number
    taxRate: number
    incomeTaxExpense: number
    netIncome: number
    transactionCount: number
  }
  breakdown: Record<string, { count: number; totalEth: number }>
}

export function useIncomeStatement(agentId: string): {
  data: IncomeStatementResponse | null
  isLoading: boolean
} {
  const [data, setData] = useState<IncomeStatementResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/v1/agents/${agentId}/financials`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d as IncomeStatementResponse | null))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false))
  }, [agentId])

  return { data, isLoading }
}
