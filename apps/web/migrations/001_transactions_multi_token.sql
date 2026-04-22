-- Migration 001: Multi-token + USD snapshot support on transactions.
--
-- Extends the existing `transactions` table (created outside of migrations
-- during the MVP phase) with columns required by Milestone 0 of the financial
-- infrastructure plan:
--   * chain_id: which chain the tx was on (defaults to Base Sepolia = 84532)
--   * token_address / token_symbol / value_token: ERC-20 support (USDC)
--   * value_usd / usd_price_at_block: FX snapshot taken once at sync time
--   * company_id / is_internal: company-scoping (filled when classifier v2
--     resolves the agent's company membership)
--   * label_evidence: JSONB audit trail for the v2 classifier (selector, args,
--     event signatures) so every label is traceable to its source
--
-- Idempotent: uses IF NOT EXISTS guards so re-running is a no-op.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS chain_id INT NOT NULL DEFAULT 84532;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS token_address TEXT;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS token_symbol TEXT;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS value_token NUMERIC(78, 0);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS value_usd NUMERIC(38, 18);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS usd_price_at_block NUMERIC(38, 18);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS price_source TEXT;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS company_id TEXT;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS label_evidence JSONB;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS label_confidence TEXT;

CREATE INDEX IF NOT EXISTS transactions_company_id_idx
  ON transactions (company_id)
  WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS transactions_token_address_idx
  ON transactions (token_address)
  WHERE token_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS transactions_chain_block_idx
  ON transactions (chain_id, block_number);

-- The legacy `value_eth` column remains to avoid breaking the current UI during
-- the rollout. New sync code writes `value_token` / `value_usd`; the UI will be
-- rewired in Milestone 2. When all readers have migrated, drop `value_eth` in a
-- subsequent migration.
