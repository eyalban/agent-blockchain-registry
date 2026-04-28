-- Persistent cache for the agents listing.
--
-- Why: the listing endpoint used to hit the canonical IdentityRegistry
-- (`ownerOf` + `tokenURI` per agent) plus the IPFS gateway (per-agent
-- metadata fetch) on every cold serverless invocation. The in-process
-- TTL cache helps for warm functions but Vercel cold starts begin with
-- an empty cache, so the first request after idle was reliably 5–15s on
-- 30+ agents.
--
-- agents_cache stores everything the listing renders, keyed by agent_id.
-- The wrapper-discovery sweep populates `owner_address` and `token_uri`;
-- a follow-up enrichment pass (or the on-the-fly fallback in the listing
-- handler) fills `name`, `description`, `image`, and `metadata_fetched_at`.
-- A NULL `metadata_fetched_at` means the row is stub-only and should be
-- enriched; a non-NULL but old value is "stale" and a background refresh
-- is fire-and-forget.

CREATE TABLE IF NOT EXISTS agents_cache (
  agent_id              TEXT         NOT NULL,
  chain_id              INT          NOT NULL DEFAULT 84532,
  owner_address         TEXT         NOT NULL,
  token_uri             TEXT,
  name                  TEXT,
  description           TEXT,
  image                 TEXT,
  metadata_fetched_at   TIMESTAMPTZ,
  on_chain_fetched_at   TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chain_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agents_cache_metadata_fetched_at
  ON agents_cache (metadata_fetched_at NULLS FIRST);

-- Sort key for "newest first" listing without scanning the whole table.
CREATE INDEX IF NOT EXISTS idx_agents_cache_agent_id_numeric
  ON agents_cache ((agent_id::numeric) DESC);
