import { NextResponse } from 'next/server'

import { sql } from '@/lib/db'

interface RouteParams {
  params: Promise<{ agentId: string }>
}

interface Row {
  company_id: string
  name: string | null
}

/**
 * GET /api/v1/agents/:agentId/company
 *
 * Returns the active company membership for an agent (or { company: null }
 * when the agent isn't a member of any). Public — same data is already
 * derivable from the agents listing.
 */
export async function GET(
  _req: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { agentId } = await params
  if (!/^\d+$/.test(agentId)) {
    return NextResponse.json({ error: 'Invalid agent id' }, { status: 400 })
  }

  const rows = (await sql`
    SELECT m.company_id, c.name
    FROM company_members m
    LEFT JOIN companies c ON c.company_id = m.company_id
    WHERE m.agent_id = ${agentId} AND m.removed_at IS NULL
    ORDER BY m.added_at DESC
    LIMIT 1
  `) as Row[]

  const row = rows[0]
  return NextResponse.json({
    company: row ? { companyId: row.company_id, name: row.name } : null,
  })
}
