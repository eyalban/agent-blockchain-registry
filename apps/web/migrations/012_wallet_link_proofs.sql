-- Verifiable wallet ↔ user linking.
--
-- The previous user_wallets schema let a logged-in user save any address
-- via a simple POST. That can't be the source of truth for "who owns
-- this agent" because anyone could claim an address they don't control.
-- We now require a signed challenge before linking, and we enforce a
-- single user per address so two accounts can't both claim the same
-- agent.

-- 1. A given wallet can only be linked to one user. The migration
--    script splits on `;` so we use a CREATE UNIQUE INDEX with
--    IF NOT EXISTS instead of an ALTER TABLE inside DO $$.
CREATE UNIQUE INDEX IF NOT EXISTS user_wallets_address_unique
  ON user_wallets (wallet_address);

-- 2. Capture the proof for each link so the attribution is auditable.
ALTER TABLE user_wallets
  ADD COLUMN IF NOT EXISTS proof_message TEXT;

ALTER TABLE user_wallets
  ADD COLUMN IF NOT EXISTS proof_signature TEXT;

ALTER TABLE user_wallets
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 3. Outstanding challenges. The server issues a nonce-bound message;
--    the client signs it via personal_sign; the server verifies the
--    signature and inserts into user_wallets. Challenges expire so a
--    leaked nonce can't be replayed.
CREATE TABLE IF NOT EXISTS wallet_link_challenges (
  user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT         NOT NULL,
  nonce          TEXT         NOT NULL,
  message        TEXT         NOT NULL,
  expires_at     TIMESTAMPTZ  NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_wallet_link_challenges_expires
  ON wallet_link_challenges (expires_at);
