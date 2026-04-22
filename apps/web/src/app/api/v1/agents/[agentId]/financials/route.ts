import { NextResponse } from 'next/server'
import { computeIncomeStatement, getTransactionsByAgent } from '@/lib/db'

interface RouteParams {
  params: Promise<{ agentId: string }>
}

/**
 * GET /api/v1/agents/:agentId/financials
 * Returns the income statement computed from labeled transactions.
 */
export async function GET(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  const { agentId } = await params

  const [statement, transactions] = await Promise.all([
    computeIncomeStatement(agentId),
    getTransactionsByAgent(agentId),
  ])

  // Group transactions by label for breakdown
  const breakdown: Record<string, { count: number; totalEth: number }> = {}
  for (const tx of transactions) {
    if (!breakdown[tx.label]) {
      breakdown[tx.label] = { count: 0, totalEth: 0 }
    }
    breakdown[tx.label]!.count++
    breakdown[tx.label]!.totalEth += Number(tx.value_eth)
  }

  return NextResponse.json({
    incomeStatement: {
      ...statement,
      revenue: Number(statement.revenue.toFixed(6)),
      costOfSales: Number(statement.costOfSales.toFixed(6)),
      grossProfit: Number(statement.grossProfit.toFixed(6)),
      sgaExpenses: Number(statement.sgaExpenses.toFixed(6)),
      operatingProfit: Number(statement.operatingProfit.toFixed(6)),
    },
    taxComputed: false,
    taxComputedReason:
      'Tax is resolved at the company level against a jurisdiction-specific rate. Create a company and link this agent to see tax and net income.',
    breakdown,
    transactionCount: transactions.length,
  })
}
