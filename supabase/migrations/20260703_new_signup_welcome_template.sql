-- ============================================================
-- New Signup Welcome Template
-- Sent when a new lead signs up via /signup
-- ============================================================

INSERT INTO sales_pipeline_email_templates (name, subject, body_html, description)
VALUES (
  'New Signup – Welcome to Aliice',
  'Welcome to Aliice, {{org.name}}! 🚀',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Welcome to Aliice</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%);padding:36px 40px;text-align:center;">
          <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="110" style="display:block;margin:0 auto 16px;" />
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Welcome to Aliice!</h1>
          <p style="margin:8px 0 0;color:#bae6fd;font-size:15px;">Your journey to smarter clinic management starts now</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.7;">
            Thanks for signing up, <strong>{{org.name}}</strong>! We're excited to show you how Aliice can transform your clinic operations.
          </p>

          <p style="margin:0 0 28px;color:#334155;font-size:15px;line-height:1.7;">
            Our team will review your information and reach out within <strong>24 hours</strong> to schedule a personalized demo. In the meantime, here's what you can expect:
          </p>

          <!-- What to expect -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
              <td style="background:#f0f9ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:16px 20px;margin-bottom:12px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#0284c7;">📞 Personal demo call</p>
                <p style="margin:6px 0 0;font-size:14px;color:#475569;">We'll walk you through features tailored to your clinic's needs.</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
            <tr>
              <td style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;padding:16px 20px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#16a34a;">💡 Expert guidance</p>
                <p style="margin:6px 0 0;font-size:14px;color:#475569;">Our team has helped hundreds of clinics optimize their workflows.</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 28px;">
            <tr>
              <td style="background:#fdf4ff;border-left:4px solid #a855f7;border-radius:8px;padding:16px 20px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#9333ea;">🎯 No commitment</p>
                <p style="margin:6px 0 0;font-size:14px;color:#475569;">Explore the platform with zero pressure — we're here to help you decide.</p>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 28px;color:#334155;font-size:15px;line-height:1.7;">
            If you have any questions in the meantime, feel free to reply to this email. We read every message.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:10px;">
                <a href="https://www.aliice.app/contact" style="display:block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                  Contact us anytime →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Questions? Reply to this email or contact us at <a href="mailto:info@aliice.app" style="color:#0ea5e9;text-decoration:none;">info@aliice.app</a></p>
          <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">© 2025 Aliice · All-in-one clinic management platform</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>
$HTML$,
  'Welcome email sent when a new lead signs up via the signup form'
)
ON CONFLICT DO NOTHING;

-- Create automation for new_signup stage
DO $$
DECLARE
  tpl_new_signup UUID;
BEGIN
  SELECT id INTO tpl_new_signup FROM sales_pipeline_email_templates WHERE name = 'New Signup – Welcome to Aliice' LIMIT 1;

  IF tpl_new_signup IS NOT NULL THEN
    INSERT INTO sales_pipeline_automations (name, trigger_stage, action_type, template_id, admin_email, active)
    VALUES (
      'New Signup Welcome',
      'new_signup',
      'send_email',
      tpl_new_signup,
      'info@aliice.app',
      true
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
