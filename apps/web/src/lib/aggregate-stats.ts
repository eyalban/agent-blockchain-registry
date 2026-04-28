/**
 * Aggregate metrics for the list-page KPI strips.
 *
 * Each function returns a small, fixed-shape object the corresponding
 * Server Component renders into a stat strip. All values come from
 * Postgres mirrors of on-chain state so the strips ship in the initial
 * HTML with zero client round-trips.
 */

import { sql } from '@/lib/db'

const CHAIN_ID = 84532

export interface AgentStats {
  total: number
  newThisWeek: number
  uniqueOwners: number
  withCompany: number
}

export async function getAgentStats(): Promise<AgentStats> {
  const [totalRow, recentRow, ownersRow, withCompanyRow] = await Promise.all([
    sql`
      SELECT COUNT(*)::int AS c FROM (
        SELECT agent_id FROM agents_cache WHERE chain_id = ${CHAIN_ID}
        UNION
        SELECT agent_id FROM agent_wallets
        UNION
        SELECT agent_id FROM company_members WHERE removed_at IS NULL
      ) AS d
    `,
    sql`
      SELECT COUNT(*)::int AS c FROM agents_cache
      WHERE chain_id = ${CHAIN_ID}
        AND on_chain_fetched_at >= NOW() - INTERVAL '7 days'
    `,
    sql`SELECT COUNT(DISTINCT owner_address)::int AS c FROM agents_cache WHERE chain_id = ${CHAIN_ID}`,
    sql`SELECT COUNT(DISTINCT agent_id)::int AS c FROM company_members WHERE removed_at IS NULL`,
  ])
  return {
    total: (totalRow[0] as { c: number }).c,
    newThisWeek: (recentRow[0] as { c: number }).c,
    uniqueOwners: (ownersRow[0] as { c: number }).c,
    withCompany: (withCompanyRow[0] as { c: number }).c,
  }
}

export interface CompanyStats {
  total: number
  totalMembers: number
  totalTreasuries: number
  jurisdictions: number
}

export async function getCompanyStats(): Promise<CompanyStats> {
  const [totalRow, membersRow, treasuriesRow, jurisdictionsRow] = await Promise.all([
    sql`SELECT COUNT(*)::int AS c FROM companies`,
    sql`SELECT COUNT(*)::int AS c FROM company_members WHERE removed_at IS NULL`,
    sql`SELECT COUNT(*)::int AS c FROM company_treasuries WHERE removed_at IS NULL`,
    sql`SELECT COUNT(DISTINCT jurisdiction_code)::int AS c FROM companies WHERE jurisdiction_code IS NOT NULL`,
  ])
  return {
    total: (totalRow[0] as { c: number }).c,
    totalMembers: (membersRow[0] as { c: number }).c,
    totalTreasuries: (treasuriesRow[0] as { c: number }).c,
    jurisdictions: (jurisdictionsRow[0] as { c: number }).c,
  }
}

export interface InvoiceStats {
  total: number
  totalInvoicedUsd: number
  totalPaidUsd: number
  outstandingUsd: number
  last30dCount: number
}

export async function getInvoiceStats(): Promise<InvoiceStats> {
  const rows = (await sql`
    SELECT
      COUNT(*)::int AS total,
      COALESCE(SUM(amount_usd_at_issue), 0)::text AS invoiced,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_usd_at_issue ELSE 0 END), 0)::text AS paid,
      COALESCE(SUM(CASE WHEN status = 'issued' THEN amount_usd_at_issue ELSE 0 END), 0)::text AS outstanding,
      COUNT(*) FILTER (WHERE issued_at >= NOW() - INTERVAL '30 days')::int AS last30d
    FROM invoices
  `) as Array<{
    total: number
    invoiced: string
    paid: string
    outstanding: string
    last30d: number
  }>
  const r = rows[0]!
  return {
    total: r.total,
    totalInvoicedUsd: Number(r.invoiced),
    totalPaidUsd: Number(r.paid),
    outstandingUsd: Number(r.outstanding),
    last30dCount: r.last30d,
  }
}

export interface ReputationLeader {
  agentId: string
  name: string | null
  feedbackCount: number
}

/**
 * Top agents by on-chain feedback count. Sources from the
 * `reputation_feedback` mirror table if present, else falls back to a
 * trivial "newest" sort so the page is always meaningful.
 */
export async function getTopAgents(limit = 10): Promise<ReputationLeader[]> {
  // The reputation feedback table may or may not exist depending on
  // whether reputation indexing has been wired up yet — guard with a
  // try/catch so this never crashes the page.
  try {
    const rows = (await sql`
      SELECT
        c.agent_id,
        c.name,
        COALESCE(f.cnt, 0)::int AS feedback_count
      FROM agents_cache c
      LEFT JOIN (
        SELECT agent_id, COUNT(*) AS cnt
        FROM reputation_feedback
        GROUP BY agent_id
      ) f ON f.agent_id = c.agent_id
      WHERE c.chain_id = ${CHAIN_ID}
      ORDER BY feedback_count DESC, c.agent_id::numeric DESC
      LIMIT ${limit}
    `) as Array<{ agent_id: string; name: string | null; feedback_count: number }>
    return rows.map((r) => ({
      agentId: r.agent_id,
      name: r.name,
      feedbackCount: r.feedback_count,
    }))
  } catch {
    const rows = (await sql`
      SELECT agent_id, name FROM agents_cache
      WHERE chain_id = ${CHAIN_ID}
      ORDER BY agent_id::numeric DESC
      LIMIT ${limit}
    `) as Array<{ agent_id: string; name: string | null }>
    return rows.map((r) => ({
      agentId: r.agent_id,
      name: r.name,
      feedbackCount: 0,
    }))
  }
}
