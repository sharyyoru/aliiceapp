-- Live chat session logging
CREATE TABLE IF NOT EXISTS livechat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  organization_name TEXT,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  message_count INT DEFAULT 0,
  transcript JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS livechat_sessions_org_idx ON livechat_sessions(organization_id);
CREATE INDEX IF NOT EXISTS livechat_sessions_started_idx ON livechat_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS livechat_sessions_user_idx ON livechat_sessions(user_id);
