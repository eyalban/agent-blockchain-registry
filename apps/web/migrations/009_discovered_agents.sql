-- Migration 009: Discovered agents (on-chain mirror).
--
-- Mirror of every agent NFT minted on the canonical IdentityRegistry, sourced
-- from `Registered(uint256,string,address)` event logs via Blockscout.
--
-- Why: the listing at `/api/v1/agents` was previously gated on either a wallet
-- in `agent_wallets` or active membership in `company_members`. Agents that
-- registered on-chain through the public framework repo (and never linked a
-- wallet through this app) were invisible in the listing even though their
-- detail page worked (it reads on-chain). This table closes that gap so every
-- on-chain registration shows up automatically.

CREATE TABLE IF NOT EXISTS discovered_agents (
  agent_id          TEXT NOT NULL,
  chain_id          INT  NOT NULL DEFAULT 84532,
  owner_address     TEXT NOT NULL,
  registered_block  BIGINT NOT NULL,
  registered_tx     TEXT NOT NULL,
  discovered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chain_id, agent_id)
);

CREATE INDEX IF NOT EXISTS discovered_agents_block_idx
  ON discovered_agents (chain_id, registered_block);

-- Singleton-per-chain cursor tracking how far we've scanned the Registered
-- event log. `last_scanned_block` is inclusive: the next scan starts from
-- this block (Blockscout pagination tolerates the overlap and we ON CONFLICT
-- DO NOTHING). `last_scanned_at` is used to throttle scans triggered from
-- request handlers.
CREATE TABLE IF NOT EXISTS agent_discovery_cursor (
  chain_id           INT PRIMARY KEY,
  last_scanned_block BIGINT NOT NULL DEFAULT 0,
  last_scanned_at    TIMESTAMPTZ NOT NULL DEFAULT 'epoch'
);
