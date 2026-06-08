-- Add sales_funnel_stage to organizations for admin tracking
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS sales_funnel_stage TEXT DEFAULT 'new_signup';

-- Valid stages:
-- 'new_signup'     - Just registered, not yet contacted
-- 'contacted'      - Initial contact made
-- 'demo_scheduled' - Demo or meeting scheduled
-- 'onboarding'     - In onboarding process
-- 'active'         - Active paying client
-- 'churned'        - Canceled/churned

CREATE INDEX IF NOT EXISTS idx_organizations_sales_funnel ON organizations(sales_funnel_stage);
