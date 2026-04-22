-- Migration 008: Invoices (Milestone 4).
--
-- Postgres mirror of the on-chain InvoiceRegistry. Every row derives from a
-- verified InvoiceCreated / InvoicePaid / InvoiceCancelled event. Unpaid rows
-- surface as accounts-receivable (for the issuer) and accounts-payable (for
-- the payer) on the company balance sheet.

CREATE TABLE IF NOT EXISTS invoices (
  invoice_id          TEXT PRIMARY KEY,              -- on-chain uint256 as string
  chain_id            INT NOT NULL DEFAULT 84532,
  issuer_address      TEXT NOT NULL,
  payer_address       TEXT NOT NULL,
  issuer_company_id   TEXT,
  payer_company_id    TEXT,
  issuer_agent_id     TEXT,                           -- resolved from agent_wallets
  payer_agent_id      TEXT,
  token_address       TEXT,                           -- NULL = native ETH
  token_symbol        TEXT NOT NULL,
  amount_raw          NUMERIC(78, 0) NOT NULL,
  amount_usd_at_issue NUMERIC(18, 4),
  usd_price_at_issue  NUMERIC(38, 18),
  price_source        TEXT,
  due_block           BIGINT,
  memo_uri            TEXT NOT NULL,
  memo_hash           TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('issued', 'paid', 'cancelled')),
  issued_at           TIMESTAMPTZ NOT NULL,
  issued_block        BIGINT NOT NULL,
  issued_tx_hash      TEXT NOT NULL,
  paid_at             TIMESTAMPTZ,
  paid_block          BIGINT,
  paid_tx_hash        TEXT,
  cancelled_at        TIMESTAMPTZ,
  cancelled_tx_hash   TEXT
);

CREATE INDEX IF NOT EXISTS invoices_issuer_status_idx
  ON invoices (issuer_address, status);
CREATE INDEX IF NOT EXISTS invoices_payer_status_idx
  ON invoices (payer_address, status);
CREATE INDEX IF NOT EXISTS invoices_issuer_company_idx
  ON invoices (issuer_company_id, status)
  WHERE issuer_company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS invoices_payer_company_idx
  ON invoices (payer_company_id, status)
  WHERE payer_company_id IS NOT NULL;
