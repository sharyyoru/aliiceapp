-- ============================================================
-- Bilingual email support + organization language preference
-- ============================================================

-- Communication language for automated emails ('en' | 'fr').
-- Set on signup based on the language the lead used, editable by admins.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';

-- French variants for pipeline email templates. When an org's
-- preferred_language = 'fr' and these are present, the automation engine
-- sends the French version; otherwise it falls back to the English fields.
ALTER TABLE sales_pipeline_email_templates
  ADD COLUMN IF NOT EXISTS subject_fr TEXT,
  ADD COLUMN IF NOT EXISTS body_html_fr TEXT;
