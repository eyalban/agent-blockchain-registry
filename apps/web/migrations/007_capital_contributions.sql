-- Migration 007: Capital contributions (Milestone 3.3).
--
-- Tracks funder-to-company inflows that represent equity rather than revenue:
-- the founder (or later, outside investors) sending ETH/USDC to a company
-- treasury or member-agent wallet. These end up under Equity on the balance
-- sheet, not Revenue on the income statement.

CREATE TABLE IF NOT EXISTS capital_contributions (
  id             SERIAL PRIMARY KEY,
  company_id     TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  from_address   TEXT NOT NULL,
  to_address     TEXT NOT NULL,
  token_address  TEXT,
  token_symbol   TEXT NOT NULL,
  amount_raw     NUMERIC(78, 0) NOT NULL,
  amount_usd     NUMERIC(18, 4),
  tx_hash        TEXT NOT NULL UNIQUE,
  block_number   BIGINT NOT NULL,
  contributed_at TIMESTAMPTZ NOT NULL,
  source         TEXT NOT NULL CHECK (source IN ('detected', 'manual'))
);

CREATE INDEX IF NOT EXISTS capital_contributions_company_idx
  ON capital_contributions (company_id, contributed_at DESC);
