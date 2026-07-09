-- ============================================================
-- Extend emails table for full compose experience
-- CC/BCC recipients, attachments, scheduled send tracking, and admin attribution
-- Safe to re-run.
-- ============================================================

ALTER TABLE emails ADD COLUMN IF NOT EXISTS cc_addresses TEXT[] DEFAULT '{}';
ALTER TABLE emails ADD COLUMN IF NOT EXISTS bcc_addresses TEXT[] DEFAULT '{}';
ALTER TABLE emails ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS admin_email TEXT;

-- Ensure we can quickly look up scheduled outbound emails.
CREATE INDEX IF NOT EXISTS emails_scheduled_status_idx
  ON emails(status, scheduled_for)
  WHERE direction = 'outbound' AND status = 'scheduled';
