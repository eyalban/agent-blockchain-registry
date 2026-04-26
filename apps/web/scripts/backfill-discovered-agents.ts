/**
 * One-shot backfill of `discovered_agents` from the canonical IdentityRegistry.
 * Run after applying migration 009 to populate every existing on-chain agent.
 * Subsequent ingestion happens automatically via the listing endpoint.
 *
 *   pnpm tsx scripts/backfill-discovered-agents.ts
 */
import { discoverNewAgents } from '../src/lib/agent-discovery'
import { sql } from '../src/lib/db'

async function main(): Promise<void> {
  let total = 0
  for (let i = 0; i < 30; i++) {
    await sql`UPDATE agent_discovery_cursor SET last_scanned_at='epoch' WHERE chain_id=84532`
    const t0 = Date.now()
    const n = await discoverNewAgents()
    total += n
    const c = (await sql`SELECT last_scanned_block FROM agent_discovery_cursor WHERE chain_id=84532`) as Array<{
      last_scanned_block: string
    }>
    process.stdout.write(
      `pass ${i + 1}: inserted=${n} cursorBlock=${c[0]!.last_scanned_block} total=${total} (${Date.now() - t0}ms)\n`,
    )
    if (n === 0) break
  }

  const all = (await sql`SELECT COUNT(*) AS c FROM discovered_agents`) as Array<{
    c: string
  }>
  const has5243 = (await sql`SELECT * FROM discovered_agents WHERE agent_id='5243'`) as Array<unknown>
  const maxId = (await sql`SELECT MAX(agent_id::numeric) AS m FROM discovered_agents`) as Array<{
    m: string
  }>
  process.stdout.write(
    `FINAL total=${all[0]!.c} max=${maxId[0]!.m} has5243=${JSON.stringify(has5243[0] ?? null)}\n`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
