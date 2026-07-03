-- Ensure automation exists for new_signup stage
-- This migration creates the automation if it doesn't already exist

DO $$
DECLARE
  tpl_id UUID;
  auto_count INTEGER;
BEGIN
  -- Find the new_signup template (updated by previous migration)
  SELECT id INTO tpl_id FROM sales_pipeline_email_templates 
  WHERE id IN (
    SELECT template_id FROM sales_pipeline_automations
    WHERE trigger_stage = 'new_signup' AND active = true AND template_id IS NOT NULL
    LIMIT 1
  )
  LIMIT 1;

  -- Check if automation already exists
  SELECT COUNT(*) INTO auto_count FROM sales_pipeline_automations
  WHERE trigger_stage = 'new_signup' AND active = true;

  -- Only create if template exists and no automation exists
  IF tpl_id IS NOT NULL AND auto_count = 0 THEN
    INSERT INTO sales_pipeline_automations (name, trigger_stage, action_type, template_id, admin_email, active)
    VALUES (
      'New Signup Welcome',
      'new_signup',
      'send_email',
      tpl_id,
      'info@aliice.app',
      true
    );
  END IF;
END $$;
