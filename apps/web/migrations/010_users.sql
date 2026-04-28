-- Email + password authentication.
--
-- Wallet auth (RainbowKit / wagmi) remains the primary path for AI agents
-- and on-chain users; this table adds an account-style identity for humans
-- who want to manage their agents and companies without holding a hot key
-- in the browser. A user may link one or more wallet addresses via
-- user_wallets; that lookup is what we use to scope "your agents" and
-- "your companies" to the signed-in account.

CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT         NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  display_name  TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS user_wallets (
  user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT         NOT NULL,
  linked_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets (wallet_address);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT         PRIMARY KEY,
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ  NOT NULL,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
