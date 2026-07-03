-- ============================================================
-- Gmail integration for the admin area
-- - Per-admin connected Google accounts (OAuth refresh tokens)
-- - Gmail identifiers on the emails table for threading/sync
-- Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_gmail_accounts (
  admin_email   TEXT PRIMARY KEY,
  google_email  TEXT NOT NULL,
  access_token  TEXT,
  refresh_token TEXT,
  token_expiry  TIMESTAMPTZ,
  scope         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gmail message/thread identifiers so we can thread replies and sync inbound.
ALTER TABLE emails ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS rfc822_message_id TEXT;

CREATE INDEX IF NOT EXISTS emails_gmail_thread_id_idx ON emails(gmail_thread_id);
CREATE UNIQUE INDEX IF NOT EXISTS emails_gmail_message_id_uidx
  ON emails(gmail_message_id) WHERE gmail_message_id IS NOT NULL;
