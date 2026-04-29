-- Claim keys: bearer secrets a user issues to their agents so the
-- agent can attribute itself (and any company it creates) back to the
-- user's account. The agent stores the key in its own config (e.g.
-- alongside its on-chain private key in agent-XX.env) and calls the
-- claim endpoints with it as a bearer credential.
--
-- We never store the plaintext: each row carries a bcrypt hash. The
-- prefix is kept in the clear so the UI can render "sm8_a1b2c3d4…"
-- next to a label, the way Stripe surfaces its sk_live_… keys.

CREATE TABLE IF NOT EXISTS claim_keys (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash      TEXT         NOT NULL,
  key_prefix    TEXT         NOT NULL,
  label         TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claim_keys_user
  ON claim_keys (user_id, revoked_at);

CREATE INDEX IF NOT EXISTS idx_claim_keys_prefix
  ON claim_keys (key_prefix);
