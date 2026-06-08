-- Add sales_funnel_stage and deal_value to organizations for admin tracking
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS sales_funnel_stage TEXT DEFAULT 'new_signup';

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS deal_value DECIMAL(12,2) DEFAULT 0;

-- Valid stages:
-- 'new_signup'     - Just registered, not yet contacted
-- 'contacted'      - Initial contact made
-- 'demo_scheduled' - Demo or meeting scheduled
-- 'onboarding'     - In onboarding process
-- 'active'         - Active paying client
-- 'churned'        - Canceled/churned

CREATE INDEX IF NOT EXISTS idx_organizations_sales_funnel ON organizations(sales_funnel_stage);

-- Admin users table for multiple admin accounts
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Insert default admin user (password: wilsontest)
-- Note: In production, use proper password hashing
INSERT INTO admin_users (email, password_hash, full_name)
VALUES ('sharyyoru@gmail.com', 'wilsontest', 'Admin User')
ON CONFLICT (email) DO NOTHING;
