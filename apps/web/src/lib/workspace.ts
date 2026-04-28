/**
 * Server-side helpers for the signed-in user's workspace.
 *
 * Attribution rule: a row only shows up in a user's workspace if its
 * on-chain owner / issuer / payer address matches one of that user's
 * VERIFIED wallets in `user_wallets`. Linking a wallet requires a
 * personal_sign challenge against the matching private key (see
 * lib/wallet-link.ts), and `user_wallets.wallet_address` is unique
 * across all users, so a wallet can only ever attribute its activity
 * to one statem8 account at a time.
 */

import { sql } from '@/lib/db'
import type { DbCompany, DbInvoice } from '@/lib/db'

export interface WorkspaceAgent {
  agentId: string
  ownerAddress: string
  name: string | null
  description: string | null
}

export interface WorkspaceCompany {
  companyId: string
  ownerAddress: string
  founderAddress: string
  name: string | null
  description: string | null
  jurisdictionCode: string | null
}

export type WorkspaceInvoice = DbInvoice & {
  direction: 'incoming' | 'outgoing'
}

export async function getUserWallets(userId: string): Promise<string[]> {
  const rows = (await sql`
    SELECT wallet_address FROM user_wallets
    WHERE user_id = ${userId} AND verified_at IS NOT NULL
    ORDER BY verified_at ASC
  `) as Array<{ wallet_address: string }>
  return rows.map((r) => r.wallet_address.toLowerCase())
}

const CHAIN_ID = 84532

export async function getUserAgents(
  wallets: readonly string[],
): Promise<WorkspaceAgent[]> {
  if (wallets.length === 0) return []
  const rows = (await sql`
    SELECT agent_id, owner_address, name, description
    FROM agents_cache
    WHERE chain_id = ${CHAIN_ID}
      AND LOWER(owner_address) = ANY(${wallets as string[]})
    ORDER BY agent_id::numeric DESC
  `) as Array<{
    agent_id: string
    owner_address: string
    name: string | null
    description: string | null
  }>
  return rows.map((r) => ({
    agentId: r.agent_id,
    ownerAddress: r.owner_address,
    name: r.name,
    description: r.description,
  }))
}

export async function getUserCompanies(
  wallets: readonly string[],
): Promise<WorkspaceCompany[]> {
  if (wallets.length === 0) return []
  const rows = (await sql`
    SELECT company_id, owner_address, founder_address,
           name, description, jurisdiction_code
    FROM companies
    WHERE LOWER(owner_address) = ANY(${wallets as string[]})
       OR LOWER(founder_address) = ANY(${wallets as string[]})
    ORDER BY created_at DESC
  `) as Array<
    Pick<
      DbCompany,
      | 'company_id'
      | 'owner_address'
      | 'founder_address'
      | 'name'
      | 'description'
      | 'jurisdiction_code'
    >
  >
  return rows.map((r) => ({
    companyId: r.company_id,
    ownerAddress: r.owner_address,
    founderAddress: r.founder_address,
    name: r.name,
    description: r.description,
    jurisdictionCode: r.jurisdiction_code,
  }))
}

export async function getUserInvoices(
  wallets: readonly string[],
): Promise<WorkspaceInvoice[]> {
  if (wallets.length === 0) return []
  const rows = (await sql`
    SELECT invoice_id, chain_id, issuer_address, payer_address,
           issuer_company_id, payer_company_id, issuer_agent_id, payer_agent_id,
           token_address, token_symbol, amount_raw::text, amount_usd_at_issue::text,
           usd_price_at_issue::text, price_source, due_block, memo_uri, memo_hash,
           status, issued_at::text, issued_block, issued_tx_hash,
           paid_at::text, paid_block, paid_tx_hash,
           cancelled_at::text, cancelled_tx_hash
    FROM invoices
    WHERE LOWER(issuer_address) = ANY(${wallets as string[]})
       OR LOWER(payer_address) = ANY(${wallets as string[]})
    ORDER BY issued_at DESC
    LIMIT 500
  `) as DbInvoice[]
  return rows.map((r) => ({
    ...r,
    direction: wallets.includes(r.issuer_address.toLowerCase())
      ? 'outgoing'
      : 'incoming',
  }))
}

export interface WorkspaceSummary {
  walletsCount: number
  agentsCount: number
  companiesCount: number
  invoicesIssued: number
  invoicesPayable: number
  outstandingUsd: number
  receivableUsd: number
}

export async function getWorkspaceSummary(
  wallets: readonly string[],
): Promise<WorkspaceSummary> {
  if (wallets.length === 0) {
    return {
      walletsCount: 0,
      agentsCount: 0,
      companiesCount: 0,
      invoicesIssued: 0,
      invoicesPayable: 0,
      outstandingUsd: 0,
      receivableUsd: 0,
    }
  }

  const [agents, companies, invStats] = await Promise.all([
    sql`SELECT COUNT(*)::int AS c FROM agents_cache WHERE chain_id = ${CHAIN_ID} AND LOWER(owner_address) = ANY(${wallets as string[]})`,
    sql`
      SELECT COUNT(*)::int AS c FROM companies
      WHERE LOWER(owner_address) = ANY(${wallets as string[]})
         OR LOWER(founder_address) = ANY(${wallets as string[]})
    `,
    sql`
      SELECT
        COUNT(*) FILTER (WHERE LOWER(issuer_address) = ANY(${wallets as string[]}))::int AS issued,
        COUNT(*) FILTER (WHERE LOWER(payer_address) = ANY(${wallets as string[]}))::int AS payable,
        COALESCE(SUM(CASE
          WHEN status = 'issued' AND LOWER(payer_address) = ANY(${wallets as string[]})
            THEN amount_usd_at_issue
          ELSE 0
        END), 0)::text AS outstanding,
        COALESCE(SUM(CASE
          WHEN status = 'issued' AND LOWER(issuer_address) = ANY(${wallets as string[]})
            THEN amount_usd_at_issue
          ELSE 0
        END), 0)::text AS receivable
      FROM invoices
    `,
  ])

  const inv = (invStats as Array<{
    issued: number
    payable: number
    outstanding: string
    receivable: string
  }>)[0]!

  return {
    walletsCount: wallets.length,
    agentsCount: (agents as Array<{ c: number }>)[0]!.c,
    companiesCount: (companies as Array<{ c: number }>)[0]!.c,
    invoicesIssued: inv.issued,
    invoicesPayable: inv.payable,
    outstandingUsd: Number(inv.outstanding),
    receivableUsd: Number(inv.receivable),
  }
}

/**
 * True if `address` is a verified wallet for `userId`. Used to gate
 * private detail pages so an invoice can only be opened by a genuine
 * party — not someone who guessed the URL.
 */
export async function userOwnsAddress(
  userId: string,
  address: string,
): Promise<boolean> {
  const lower = address.toLowerCase()
  const rows = (await sql`
    SELECT 1 FROM user_wallets
    WHERE user_id = ${userId}
      AND wallet_address = ${lower}
      AND verified_at IS NOT NULL
    LIMIT 1
  `) as unknown[]
  return rows.length > 0
}
