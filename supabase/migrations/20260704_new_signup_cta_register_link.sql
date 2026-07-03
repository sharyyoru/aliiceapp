-- Update the new_signup email template CTA to point to /register
-- with the user's name and email pre-filled as query parameters.
-- Uses {{contact.name_encoded}} and {{org.email_encoded}} which are
-- URL-safe (encodeURIComponent) values produced by the automation engine.

UPDATE sales_pipeline_email_templates SET

  body_html = REPLACE(
    REPLACE(
      body_html,
      'href="https://www.aliice.app/{{org.slug}}"',
      'href="https://www.aliice.app/register?name={{contact.name_encoded}}&amp;email={{org.email_encoded}}"'
    ),
    '>Explore Aliice →</a>',
    '>Get Started →</a>'
  ),

  body_html_fr = REPLACE(
    REPLACE(
      body_html_fr,
      'href="https://www.aliice.app/{{org.slug}}"',
      'href="https://www.aliice.app/register?name={{contact.name_encoded}}&amp;email={{org.email_encoded}}"'
    ),
    '>Explorer Aliice →</a>',
    '>Commencer →</a>'
  )

WHERE id IN (
  SELECT template_id FROM sales_pipeline_automations
  WHERE trigger_stage = 'new_signup' AND active = true AND template_id IS NOT NULL
  LIMIT 1
);
