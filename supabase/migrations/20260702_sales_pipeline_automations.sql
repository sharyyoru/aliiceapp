-- ============================================================
-- Phase 4: Sales Pipeline Automations & Email Templates
-- Stage-based automation engine for the admin organizations funnel
-- ============================================================

-- Reusable email templates for the sales pipeline (separate from the
-- patient-facing email_templates table so admin/sales concerns stay isolated)
CREATE TABLE IF NOT EXISTS sales_pipeline_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stage-triggered automations. When an organization's sales_funnel_stage
-- changes to `trigger_stage`, matching active automations run their action.
CREATE TABLE IF NOT EXISTS sales_pipeline_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_stage TEXT NOT NULL,               -- funnel stage id, e.g. 'new_signup'
  active BOOLEAN NOT NULL DEFAULT true,
  action_type TEXT NOT NULL DEFAULT 'send_email', -- 'send_email' | 'send_email_to_admin'
  template_id UUID REFERENCES sales_pipeline_email_templates(id) ON DELETE SET NULL,
  admin_email TEXT,                          -- used when notifying internal team
  config JSONB DEFAULT '{}'::jsonb,          -- future: delays, extra recipients, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Execution log for observability / debugging
CREATE TABLE IF NOT EXISTS sales_pipeline_automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES sales_pipeline_automations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT,
  status TEXT NOT NULL DEFAULT 'success',    -- 'success' | 'failed' | 'skipped'
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_automations_stage
  ON sales_pipeline_automations(trigger_stage) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_pipeline_automation_runs_org
  ON sales_pipeline_automation_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_automation_runs_automation
  ON sales_pipeline_automation_runs(automation_id);

-- These tables are managed exclusively through the admin service-role API,
-- so RLS stays enabled with no public policies (service role bypasses RLS).
ALTER TABLE sales_pipeline_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_pipeline_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_pipeline_automation_runs ENABLE ROW LEVEL SECURITY;
