/**
 * Applies every SQL file in apps/web/migrations/ against the configured
 * database, in filename order. Each file is a single SQL script; migrations
 * are idempotent (`IF NOT EXISTS` etc.) so re-running is safe.
 *
 * Usage:
 *   pnpm --filter @agent-registry/web migrate
 *   (requires DATABASE_URL in apps/web/.env.local)
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set. Put it in apps/web/.env.local.')
  process.exit(1)
}

const MIGRATIONS_DIR = join(process.cwd(), 'migrations')

async function main(): Promise<void> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('No migrations found in', MIGRATIONS_DIR)
    return
  }

  const sql = neon(DATABASE_URL as string)

  for (const file of files) {
    const path = join(MIGRATIONS_DIR, file)
    const content = readFileSync(path, 'utf8')

    // Split on semicolons at statement boundaries. Comments and blank lines
    // are fine — Postgres ignores them. This is a simplistic splitter; avoid
    // semicolons inside string literals in migrations (none of ours have
    // any). For complex scripts, consider a real SQL parser later.
    const statements = content
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !/^(--.*\n?)+$/.test(s))

    console.log(`\n▶ ${file} (${statements.length} statements)`)
    for (const stmt of statements) {
      try {
        await sql.query(stmt)
      } catch (err) {
        console.error(`  ✖ ${(err as Error).message}`)
        console.error(`    Statement: ${stmt.slice(0, 120)}...`)
        throw err
      }
    }
    console.log(`  ✓ ${file} applied`)
  }

  console.log('\nAll migrations applied successfully.')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
