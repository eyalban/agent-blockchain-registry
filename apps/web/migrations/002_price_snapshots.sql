-- Migration 002: Price-snapshot cache.
--
-- Caches token USD prices at specific blocks so we only hit Chainlink /
-- CoinGecko once per (token, chain, block). Every consumer (tx sync, balance
-- sheet, reports) reads through this cache.
--
-- Source column distinguishes provenance so every cached number is auditable:
--   * 'chainlink'  -- read from a Chainlink AggregatorV3 feed on-chain
--   * 'coingecko'  -- CoinGecko historical API fallback
-- We never fall back to assumed peg values; if neither source returns a price,
-- the caller must handle the null and the UI flags "Price source missing".

CREATE TABLE IF NOT EXISTS price_snapshots (
  id           SERIAL PRIMARY KEY,
  chain_id     INT NOT NULL,
  token_address TEXT,                       -- NULL = native token (ETH)
  symbol       TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  block_timestamp TIMESTAMPTZ NOT NULL,
  usd_price    NUMERIC(38, 18) NOT NULL,
  source       TEXT NOT NULL CHECK (source IN ('chainlink', 'coingecko')),
  source_ref   TEXT NOT NULL,               -- feed address, round id, or CoinGecko endpoint
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chain_id, token_address, block_number)
);

CREATE INDEX IF NOT EXISTS price_snapshots_symbol_block_idx
  ON price_snapshots (symbol, block_number DESC);

CREATE INDEX IF NOT EXISTS price_snapshots_token_idx
  ON price_snapshots (chain_id, token_address, block_number DESC);
