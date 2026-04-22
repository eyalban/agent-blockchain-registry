-- Migration 003: Tax rates — replaces the hardcoded 30% in the MVP.
--
-- Every tax rate rendered in the product resolves against this table. Lookup
-- precedence at report time:
--   1. company override       (rate_type='override', company_id IS NOT NULL)
--   2. company effective rate (rate_type='effective', company_id IS NOT NULL)
--   3. jurisdiction statutory (rate_type='statutory', company_id IS NULL)
-- If none is available, the UI refuses to compute tax and shows pre-tax
-- figures with a "Tax rate source required" banner. There is no fallback
-- hardcoded number.
--
-- `source` / `source_ref` are required so every rate is auditable:
--   * 'oecd'           -- OECD Corporate Tax Statistics dataset
--   * 'tax_foundation' -- Tax Foundation Worldwide Corporate Tax Rates
--   * 'company_filing' -- uploaded tax filing (IPFS hash in source_ref)
--   * 'cfo_attested'   -- EAS attestation uid in source_ref

CREATE TABLE IF NOT EXISTS tax_rates (
  id              SERIAL PRIMARY KEY,
  company_id      TEXT,                              -- NULL = jurisdiction-wide
  jurisdiction_code TEXT NOT NULL,                   -- ISO-3166-1 alpha-3 [+ '-' + ISO-3166-2]
  rate            NUMERIC(6, 5) NOT NULL CHECK (rate >= 0 AND rate <= 1),
  rate_type       TEXT NOT NULL CHECK (rate_type IN ('statutory', 'effective', 'override')),
  source          TEXT NOT NULL CHECK (source IN ('oecd', 'tax_foundation', 'company_filing', 'cfo_attested')),
  source_ref      TEXT NOT NULL,                     -- URL, CSV row id, IPFS hash, or attestation uid
  effective_from  DATE NOT NULL,
  effective_to    DATE,                              -- NULL = currently in effect
  submitted_by    TEXT,                              -- wallet address, set when rate_type='override'
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UNIQUE with NULLS NOT DISTINCT so statutory rows (company_id = NULL) are
-- treated as duplicates when all other columns match. Requires PG 15+
-- (Neon is PG 16+). This lets ON CONFLICT work for both company-scoped and
-- jurisdiction-wide rows without needing separate partial indexes.
CREATE UNIQUE INDEX IF NOT EXISTS tax_rates_unique_idx
  ON tax_rates (company_id, jurisdiction_code, rate_type, effective_from)
  NULLS NOT DISTINCT;

CREATE INDEX IF NOT EXISTS tax_rates_jurisdiction_idx
  ON tax_rates (jurisdiction_code, effective_from DESC);

CREATE INDEX IF NOT EXISTS tax_rates_company_idx
  ON tax_rates (company_id, effective_from DESC)
  WHERE company_id IS NOT NULL;

-- Sanity constraint: effective_to, when set, must be after effective_from.
ALTER TABLE tax_rates
  DROP CONSTRAINT IF EXISTS tax_rates_effective_range_check;
ALTER TABLE tax_rates
  ADD CONSTRAINT tax_rates_effective_range_check
  CHECK (effective_to IS NULL OR effective_to > effective_from);

-- Overrides require a submitter wallet (chain of custody for who asserted the
-- rate); statutory/effective rates from data providers don't.
ALTER TABLE tax_rates
  DROP CONSTRAINT IF EXISTS tax_rates_override_requires_submitter_check;
ALTER TABLE tax_rates
  ADD CONSTRAINT tax_rates_override_requires_submitter_check
  CHECK (rate_type <> 'override' OR submitted_by IS NOT NULL);
