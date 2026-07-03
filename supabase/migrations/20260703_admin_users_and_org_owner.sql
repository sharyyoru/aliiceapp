-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users(email);

-- Add assigned_to_admin_email column to organizations if it doesn't exist
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS assigned_to_admin_email TEXT;

-- Seed initial admin users (upsert so re-running is safe)
INSERT INTO admin_users (email, password_hash, full_name, is_active)
VALUES
  ('sharyyoru@gmail.com',   'Admin2025!',     'Admin',    true),
  ('charline@aliice.app',   'Charline2025!',  'Charline', true),
  ('info@aliice.app',       'Info2025!',      'Aliice',   true)
ON CONFLICT (email) DO UPDATE
  SET full_name   = EXCLUDED.full_name,
      is_active   = EXCLUDED.is_active,
      password_hash = CASE
        WHEN admin_users.password_hash = EXCLUDED.password_hash THEN admin_users.password_hash
        ELSE EXCLUDED.password_hash
      END;
