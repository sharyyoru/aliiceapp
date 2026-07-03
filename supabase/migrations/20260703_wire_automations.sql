DO $$
DECLARE
  tpl_onboarding   UUID;
  tpl_contacted    UUID;
  tpl_churned      UUID;
  tpl_demo         UUID;
BEGIN
  SELECT id INTO tpl_onboarding FROM sales_pipeline_email_templates WHERE name = 'Onboarding – Welcome to Your Journey' LIMIT 1;
  SELECT id INTO tpl_contacted  FROM sales_pipeline_email_templates WHERE name = 'Follow-up – We''d Love to Connect' LIMIT 1;
  SELECT id INTO tpl_churned    FROM sales_pipeline_email_templates WHERE name = 'Win-back – We Miss You, {{org.name}}' LIMIT 1;
  SELECT id INTO tpl_demo       FROM sales_pipeline_email_templates WHERE name = 'Demo Confirmation – Your Aliice Demo is Confirmed' LIMIT 1;

  IF tpl_onboarding IS NOT NULL THEN
    UPDATE sales_pipeline_automations SET template_id = tpl_onboarding WHERE trigger_stage = 'onboarding' AND active = true;
  END IF;
  IF tpl_contacted IS NOT NULL THEN
    UPDATE sales_pipeline_automations SET template_id = tpl_contacted WHERE trigger_stage = 'contacted' AND active = true;
  END IF;
  IF tpl_churned IS NOT NULL THEN
    UPDATE sales_pipeline_automations SET template_id = tpl_churned WHERE trigger_stage = 'churned' AND active = true;
  END IF;
  IF tpl_demo IS NOT NULL THEN
    UPDATE sales_pipeline_automations SET template_id = tpl_demo WHERE trigger_stage = 'demo_scheduled' AND active = true;
  END IF;
END $$;
