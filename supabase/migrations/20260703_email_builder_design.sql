-- ============================================================
-- Drag-and-drop email builder support
-- Stores the Unlayer (react-email-editor) design JSON so templates
-- built visually can be re-opened and edited. body_html/body_html_fr
-- remain the rendered output that the automation engine sends.
-- ============================================================

ALTER TABLE sales_pipeline_email_templates
  ADD COLUMN IF NOT EXISTS design_json JSONB,
  ADD COLUMN IF NOT EXISTS design_json_fr JSONB;
