-- Subscription payments tracking table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_payments_org ON subscription_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_period ON subscription_payments(period_start, period_end);

-- Add subscription_started_at to organizations to track when they became active clients
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;

-- Update existing active organizations to have subscription_started_at
UPDATE organizations 
SET subscription_started_at = created_at 
WHERE sales_funnel_stage = 'active' AND subscription_started_at IS NULL;
