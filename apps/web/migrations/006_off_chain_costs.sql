-- Migration 006: Off-chain costs (Milestone 2.2).
--
-- Real compute / LLM / SaaS expenses that agents incur but that never hit the
-- chain. Imported via CSV upload or (future) vendor API sync. Without these,
-- every agent looks infinitely profitable.

CREATE TABLE IF NOT EXISTS off_chain_costs (
  id             SERIAL PRIMARY KEY,
  company_id     TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  agent_id       TEXT,                              -- NULL = company-wide
  occurred_at    DATE NOT NULL,
  category       TEXT NOT NULL,                     -- matches cogs_*/opex_* sub-labels
  description    TEXT NOT NULL,
  amount_usd     NUMERIC(18, 4) NOT NULL CHECK (amount_usd >= 0),
  source         TEXT NOT NULL CHECK (source IN ('csv_upload', 'api_import', 'manual')),
  source_ref     TEXT,                              -- vendor invoice id / URL / file name
  uploaded_by    TEXT NOT NULL,                     -- wallet address of uploader
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS off_chain_costs_company_period_idx
  ON off_chain_costs (company_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS off_chain_costs_category_idx
  ON off_chain_costs (company_id, category, occurred_at DESC);
