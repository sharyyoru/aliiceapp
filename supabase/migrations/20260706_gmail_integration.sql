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

-- Link emails to an organization (admin org mailbox). This column did not
-- previously exist on the emails table.
ALTER TABLE emails ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS emails_organization_id_idx ON emails(organization_id);

-- Columns the app relies on (originally in 20260320; ensure present everywhere).
ALTER TABLE emails ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE emails ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS mailgun_message_id TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS in_reply_to TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS thread_id TEXT;
CREATE INDEX IF NOT EXISTS emails_read_at_idx ON emails(read_at);

-- Relax status from a restrictive enum to free text so the mailbox can use
-- values like 'sending', 'received', and 'read'.
ALTER TABLE emails ALTER COLUMN status DROP DEFAULT;
ALTER TABLE emails ALTER COLUMN status TYPE TEXT USING status::text;
ALTER TABLE emails ALTER COLUMN status SET DEFAULT 'draft';

-- Gmail message/thread identifiers so we can thread replies and sync inbound.
ALTER TABLE emails ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS rfc822_message_id TEXT;

CREATE INDEX IF NOT EXISTS emails_gmail_thread_id_idx ON emails(gmail_thread_id);
CREATE UNIQUE INDEX IF NOT EXISTS emails_gmail_message_id_uidx
  ON emails(gmail_message_id) WHERE gmail_message_id IS NOT NULL;
