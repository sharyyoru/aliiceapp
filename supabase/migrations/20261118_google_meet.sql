-- ============================================================
-- Google Meet video calls for clinic appointments
-- - One Google account per organization (or per user when the user has no
--   active organization membership) that owns the calendar events and
--   Meet links.
-- - Appointment columns to store the generated Meet link / event.
-- Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS google_meet_connections (
  owner_key     TEXT PRIMARY KEY, -- 'org:<organization_id>' or 'user:<user_id>'
  google_email  TEXT NOT NULL,
  access_token  TEXT,
  refresh_token TEXT,
  token_expiry  TIMESTAMPTZ,
  scope         TEXT,
  connected_by  UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tokens are only ever read by the service role (API routes).
ALTER TABLE google_meet_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON google_meet_connections FROM anon, authenticated;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meet_link TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_event_owner TEXT;
