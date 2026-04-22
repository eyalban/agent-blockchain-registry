-- Migration 004: Companies (agentic company entity).
--
-- Postgres mirror of the on-chain CompanyRegistry. Every row here is derived
-- from verified on-chain events (CompanyCreated, AgentAdded/Removed,
-- TreasuryAdded/Removed, CompanyOwnershipTransferred, CompanyMetadataUpdated)
-- — API writes never happen without a confirmed tx receipt.

CREATE TABLE IF NOT EXISTS companies (
  company_id        TEXT PRIMARY KEY,                -- on-chain uint256 as string
  chain_id          INT NOT NULL DEFAULT 84532,
  founder_address   TEXT NOT NULL,                   -- initial owner
  owner_address     TEXT NOT NULL,                   -- current owner (may differ after transfer)
  metadata_uri      TEXT NOT NULL,
  -- Parsed from metadata JSON after IPFS fetch; nullable until fetched.
  name              TEXT,
  description       TEXT,
  logo_url          TEXT,
  jurisdiction_code TEXT,                            -- ISO-3166 alpha-3 [+ '-' subdivision]
  created_tx_hash   TEXT NOT NULL,
  created_block     BIGINT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS companies_owner_idx ON companies (owner_address);
CREATE INDEX IF NOT EXISTS companies_jurisdiction_idx
  ON companies (jurisdiction_code)
  WHERE jurisdiction_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS company_members (
  company_id     TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  agent_id       TEXT NOT NULL,
  added_tx_hash  TEXT NOT NULL,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_tx_hash TEXT,
  removed_at     TIMESTAMPTZ,
  PRIMARY KEY (company_id, agent_id)
);
CREATE INDEX IF NOT EXISTS company_members_agent_idx ON company_members (agent_id);
CREATE INDEX IF NOT EXISTS company_members_active_idx
  ON company_members (company_id)
  WHERE removed_at IS NULL;

CREATE TABLE IF NOT EXISTS company_treasuries (
  company_id     TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  address        TEXT NOT NULL,
  label          TEXT,
  added_tx_hash  TEXT NOT NULL,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_tx_hash TEXT,
  removed_at     TIMESTAMPTZ,
  PRIMARY KEY (company_id, address)
);
CREATE INDEX IF NOT EXISTS company_treasuries_address_idx
  ON company_treasuries (address);
CREATE INDEX IF NOT EXISTS company_treasuries_active_idx
  ON company_treasuries (company_id)
  WHERE removed_at IS NULL;
