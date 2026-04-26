# Database Migrations

Numbered SQL files applied in order against the Neon Postgres database.

## Running

Migrations are applied manually (or via a Neon-compatible CI step) — the project
has no ORM. Each file is idempotent (`IF NOT EXISTS` / `DROP CONSTRAINT IF
EXISTS`) so re-running is safe.

```
psql $DATABASE_URL -f apps/web/migrations/001_transactions_multi_token.sql
psql $DATABASE_URL -f apps/web/migrations/002_price_snapshots.sql
psql $DATABASE_URL -f apps/web/migrations/003_tax_rates.sql
```

## Convention

- Filenames: `NNN_short_description.sql`, numbered sequentially.
- New migrations never edit or drop columns still read by the current code —
  they only add. Removals happen in a later migration, after readers migrate.
- Every migration begins with a comment block explaining the WHY.
- Check constraints and indexes use `DROP ... IF EXISTS` before `ADD ... ` /
  `CREATE ...` to keep re-runs clean.

## Current migrations

| # | File | Milestone | Purpose |
|---|------|-----------|---------|
| 001 | `001_transactions_multi_token.sql` | M0 | Multi-token + USD snapshot + company scoping on `transactions`. |
| 002 | `002_price_snapshots.sql` | M0 | Cache of token USD prices per block, sourced from Chainlink / CoinGecko. |
| 003 | `003_tax_rates.sql` | M0 | Per-jurisdiction tax rates with full provenance (replaces the hardcoded 30%). |
| 009 | `009_discovered_agents.sql` | M1 | `agent_discovery_cursor` for the wrapper-event indexer (`discoverWrapperRegistrations`). The accompanying `discovered_agents` table is unused as of the wrapper-events fix — kept in place to avoid a destructive migration and removed in a later one. |
