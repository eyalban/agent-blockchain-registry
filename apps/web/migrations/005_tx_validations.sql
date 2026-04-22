-- Migration 005: Cross-validation of transaction labels (Milestone 1.3).
--
-- When both sides of a transaction are registered agents, we can reconcile
-- their independently-assigned labels. Matched = both sides agree (one side
-- = revenue, the other = an expense category). Mismatched = both definitive
-- but disagree → surfaced as an audit flag in the UI.

CREATE TABLE IF NOT EXISTS tx_validations (
  tx_hash          TEXT NOT NULL,
  self_agent_id    TEXT NOT NULL,
  other_agent_id   TEXT NOT NULL,
  self_label       TEXT NOT NULL,
  other_label      TEXT NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('matched', 'mismatched', 'pending')),
  self_confidence  TEXT,
  other_confidence TEXT,
  note             TEXT,
  validated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tx_hash, self_agent_id, other_agent_id)
);

CREATE INDEX IF NOT EXISTS tx_validations_hash_idx ON tx_validations (tx_hash);
CREATE INDEX IF NOT EXISTS tx_validations_status_idx
  ON tx_validations (status)
  WHERE status = 'mismatched';
