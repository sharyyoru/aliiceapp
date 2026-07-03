-- ============================================================
-- demo_bookings: stores prospect self-scheduled demo slots
-- ============================================================

CREATE TABLE IF NOT EXISTS demo_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  org_name        TEXT NOT NULL,
  org_email       TEXT NOT NULL,
  slot_start      TIMESTAMPTZ NOT NULL,
  slot_end        TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','cancelled')),
  google_event_id TEXT,
  meet_link       TEXT,
  calendar_link   TEXT,
  token           TEXT UNIQUE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_bookings_token_idx    ON demo_bookings (token);
CREATE INDEX IF NOT EXISTS demo_bookings_org_idx      ON demo_bookings (organization_id);
CREATE INDEX IF NOT EXISTS demo_bookings_slot_idx     ON demo_bookings (slot_start);
