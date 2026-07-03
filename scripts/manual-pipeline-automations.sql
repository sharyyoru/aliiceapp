-- ============================================================
-- Phase 4: Sales Pipeline Automations — one-shot setup
-- Paste this entire file into the Supabase SQL editor and Run.
-- Safe to run more than once (idempotent).
-- ============================================================

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


-- ------------------------------------------------------------
-- Seed the /template welcome email + one automation per stage
-- ------------------------------------------------------------
DO $seed$
DECLARE
  tpl_id uuid;
BEGIN
  SELECT id INTO tpl_id
  FROM sales_pipeline_email_templates
  WHERE name = 'Aliice — All-in-one Platform (Welcome)'
  LIMIT 1;

  IF tpl_id IS NULL THEN
    INSERT INTO sales_pipeline_email_templates (name, subject, body_html, description)
    VALUES (
      'Aliice — All-in-one Platform (Welcome)',
      'Run your entire clinic on one platform, {{org.name}}',
      $body$<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Run your entire clinic on one platform — Aliice</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
      .stack{display:block !important;width:100% !important;}
      .h1{font-size:28px !important;line-height:34px !important;}
      .feature-td{display:block !important;width:100% !important;}
    }
    a{text-decoration:none;}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">
    Replace your CRM, ERP &amp; booking system with one platform — and save 49%. The Aliice mobile app is coming soon.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td class="px" style="padding:28px 40px 12px 40px;" align="left">
              <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 8px 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-radius:999px;padding:7px 16px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:0.4px;color:#4f46e5;text-transform:uppercase;">The all-in-one clinic platform</span>
                  </td>
                </tr>
              </table>
              <h1 class="h1" style="margin:20px 0 0 0;font-size:34px;line-height:40px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
                One platform to run your entire clinic.
              </h1>
              <p style="margin:16px 0 0 0;font-size:16px;line-height:26px;color:#475569;">
                Hi {{org.name}}, juggling separate tools for bookings, patient records, billing and marketing is costing you time and money. <strong style="color:#0f172a;">Aliice replaces 3+ systems with one</strong> — and clinics save up to <strong style="color:#4f46e5;">49%</strong> on software costs.
              </p>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
                    <a href="https://www.aliice.app/signup" target="_blank" style="display:inline-block;padding:16px 34px;font-size:16px;font-weight:700;color:#ffffff;border-radius:999px;">
                      Start your free trial &rarr;
                    </a>
                  </td>
                  <td style="width:14px;">&nbsp;</td>
                  <td>
                    <a href="https://www.aliice.app/contact" target="_blank" style="display:inline-block;padding:15px 28px;font-size:16px;font-weight:600;color:#0f172a;border:1px solid #cbd5e1;border-radius:999px;">
                      Book a demo
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0 0;font-size:13px;color:#94a3b8;">No credit card required &bull; 14-day free trial</p>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:28px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:16px;">
                <tr>
                  <td class="stack" width="33.33%" align="center" style="padding:20px 8px;border-right:1px solid #e2e8f0;">
                    <div style="font-size:24px;font-weight:800;color:#0284c7;">49%</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">Cost savings</div>
                  </td>
                  <td class="stack" width="33.33%" align="center" style="padding:20px 8px;border-right:1px solid #e2e8f0;">
                    <div style="font-size:24px;font-weight:800;color:#7c3aed;">3-in-1</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">CRM + ERP + Booking</div>
                  </td>
                  <td class="stack" width="33.33%" align="center" style="padding:20px 8px;">
                    <div style="font-size:24px;font-weight:800;color:#0f172a;">24/7</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">Cloud-based</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:36px 40px 8px 40px;">
              <h2 style="margin:0 0 6px 0;font-size:20px;font-weight:700;color:#0f172a;">Everything your clinic needs</h2>
              <p style="margin:0 0 20px 0;font-size:14px;color:#64748b;">Replace your patchwork of tools with a single, beautiful platform.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 18px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">🗂️</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">Patient Management</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Records, history &amp; treatment tracking in one place.</div>
    </td></tr>
  </table></td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 18px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">📅</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">Smart Scheduling</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Online booking with automated reminders.</div>
    </td></tr>
  </table></td>
                </tr>
                <tr>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 18px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">🤖</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">AI Medical Scribe</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Voice consultations turned into SOAP notes.</div>
    </td></tr>
  </table></td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 18px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">💳</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">Billing &amp; Invoicing</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Insurance-ready billing with fewer errors.</div>
    </td></tr>
  </table></td>
                </tr>
                <tr>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">💬</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">Omnichannel Messaging</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Email, SMS &amp; WhatsApp from one inbox.</div>
    </td></tr>
  </table></td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 0 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">📊</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">Analytics &amp; Reports</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Real-time insight into revenue &amp; growth.</div>
    </td></tr>
  </table></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:30px 40px 8px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#312e81);border-radius:18px;">
                <tr>
                  <td style="padding:28px 28px;">
                    <span style="display:inline-block;background:rgba(255,255,255,0.12);color:#c7d2fe;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 12px;border-radius:999px;">Coming soon</span>
                    <h3 style="margin:14px 0 6px 0;font-size:22px;font-weight:800;color:#ffffff;">📱 The Aliice mobile app</h3>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#cbd5e1;">
                      Manage appointments, message patients and review your day from anywhere. The native iOS &amp; Android app is launching soon — get on the platform today and be first in line.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:32px 40px 8px 40px;">
              <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#0f172a;">Why clinics switch to Aliice</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Save up to 49% vs. using separate CRM, ERP &amp; booking tools</td>
  </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Purpose-built for aesthetic &amp; medical clinics</td>
  </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">AI Medical Scribe included — reclaim 2+ hours a day</td>
  </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">GDPR compliant &amp; securely hosted</td>
  </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Flexible month-to-month pricing, cancel anytime</td>
  </tr></table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:28px 40px 36px 40px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
                    <a href="https://www.aliice.app/signup" target="_blank" style="display:inline-block;padding:17px 44px;font-size:17px;font-weight:700;color:#ffffff;border-radius:999px;">
                      Get started free &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:13px;color:#94a3b8;">Questions? Just reply to this email — a real person will get back to you.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;" align="center">
              <p style="margin:0;font-size:13px;color:#64748b;">Aliice Computer Software Trading</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;">Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#94a3b8;">
                <a href="https://www.aliice.app" target="_blank" style="color:#0284c7;">aliice.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$body$,
      'Marketing welcome email served at /template. Personalized via {{org.name}}.'
    )
    RETURNING id INTO tpl_id;
  ELSE
    UPDATE sales_pipeline_email_templates
    SET subject = 'Run your entire clinic on one platform, {{org.name}}',
        body_html = $body$<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Run your entire clinic on one platform — Aliice</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
      .stack{display:block !important;width:100% !important;}
      .h1{font-size:28px !important;line-height:34px !important;}
      .feature-td{display:block !important;width:100% !important;}
    }
    a{text-decoration:none;}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">
    Replace your CRM, ERP &amp; booking system with one platform — and save 49%. The Aliice mobile app is coming soon.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td class="px" style="padding:28px 40px 12px 40px;" align="left">
              <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 8px 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-radius:999px;padding:7px 16px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:0.4px;color:#4f46e5;text-transform:uppercase;">The all-in-one clinic platform</span>
                  </td>
                </tr>
              </table>
              <h1 class="h1" style="margin:20px 0 0 0;font-size:34px;line-height:40px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
                One platform to run your entire clinic.
              </h1>
              <p style="margin:16px 0 0 0;font-size:16px;line-height:26px;color:#475569;">
                Hi {{org.name}}, juggling separate tools for bookings, patient records, billing and marketing is costing you time and money. <strong style="color:#0f172a;">Aliice replaces 3+ systems with one</strong> — and clinics save up to <strong style="color:#4f46e5;">49%</strong> on software costs.
              </p>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
                    <a href="https://www.aliice.app/signup" target="_blank" style="display:inline-block;padding:16px 34px;font-size:16px;font-weight:700;color:#ffffff;border-radius:999px;">
                      Start your free trial &rarr;
                    </a>
                  </td>
                  <td style="width:14px;">&nbsp;</td>
                  <td>
                    <a href="https://www.aliice.app/contact" target="_blank" style="display:inline-block;padding:15px 28px;font-size:16px;font-weight:600;color:#0f172a;border:1px solid #cbd5e1;border-radius:999px;">
                      Book a demo
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0 0;font-size:13px;color:#94a3b8;">No credit card required &bull; 14-day free trial</p>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:28px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:16px;">
                <tr>
                  <td class="stack" width="33.33%" align="center" style="padding:20px 8px;border-right:1px solid #e2e8f0;">
                    <div style="font-size:24px;font-weight:800;color:#0284c7;">49%</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">Cost savings</div>
                  </td>
                  <td class="stack" width="33.33%" align="center" style="padding:20px 8px;border-right:1px solid #e2e8f0;">
                    <div style="font-size:24px;font-weight:800;color:#7c3aed;">3-in-1</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">CRM + ERP + Booking</div>
                  </td>
                  <td class="stack" width="33.33%" align="center" style="padding:20px 8px;">
                    <div style="font-size:24px;font-weight:800;color:#0f172a;">24/7</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">Cloud-based</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:36px 40px 8px 40px;">
              <h2 style="margin:0 0 6px 0;font-size:20px;font-weight:700;color:#0f172a;">Everything your clinic needs</h2>
              <p style="margin:0 0 20px 0;font-size:14px;color:#64748b;">Replace your patchwork of tools with a single, beautiful platform.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 18px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">🗂️</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">Patient Management</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Records, history &amp; treatment tracking in one place.</div>
    </td></tr>
  </table></td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 18px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">📅</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">Smart Scheduling</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Online booking with automated reminders.</div>
    </td></tr>
  </table></td>
                </tr>
                <tr>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 18px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">🤖</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">AI Medical Scribe</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Voice consultations turned into SOAP notes.</div>
    </td></tr>
  </table></td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 18px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">💳</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">Billing &amp; Invoicing</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Insurance-ready billing with fewer errors.</div>
    </td></tr>
  </table></td>
                </tr>
                <tr>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">💬</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">Omnichannel Messaging</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Email, SMS &amp; WhatsApp from one inbox.</div>
    </td></tr>
  </table></td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 0 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">📊</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">Analytics &amp; Reports</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">Real-time insight into revenue &amp; growth.</div>
    </td></tr>
  </table></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:30px 40px 8px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#312e81);border-radius:18px;">
                <tr>
                  <td style="padding:28px 28px;">
                    <span style="display:inline-block;background:rgba(255,255,255,0.12);color:#c7d2fe;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 12px;border-radius:999px;">Coming soon</span>
                    <h3 style="margin:14px 0 6px 0;font-size:22px;font-weight:800;color:#ffffff;">📱 The Aliice mobile app</h3>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#cbd5e1;">
                      Manage appointments, message patients and review your day from anywhere. The native iOS &amp; Android app is launching soon — get on the platform today and be first in line.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:32px 40px 8px 40px;">
              <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#0f172a;">Why clinics switch to Aliice</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Save up to 49% vs. using separate CRM, ERP &amp; booking tools</td>
  </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Purpose-built for aesthetic &amp; medical clinics</td>
  </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">AI Medical Scribe included — reclaim 2+ hours a day</td>
  </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">GDPR compliant &amp; securely hosted</td>
  </tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Flexible month-to-month pricing, cancel anytime</td>
  </tr></table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:28px 40px 36px 40px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
                    <a href="https://www.aliice.app/signup" target="_blank" style="display:inline-block;padding:17px 44px;font-size:17px;font-weight:700;color:#ffffff;border-radius:999px;">
                      Get started free &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:13px;color:#94a3b8;">Questions? Just reply to this email — a real person will get back to you.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;" align="center">
              <p style="margin:0;font-size:13px;color:#64748b;">Aliice Computer Software Trading</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;">Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#94a3b8;">
                <a href="https://www.aliice.app" target="_blank" style="color:#0284c7;">aliice.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$body$,
        updated_at = NOW()
    WHERE id = tpl_id;
  END IF;

  -- Create one automation per stage, only where one doesn't already exist.
  INSERT INTO sales_pipeline_automations (name, trigger_stage, action_type, template_id, active)
  SELECT v.name, v.stage, 'send_email', tpl_id, true
  FROM (VALUES
    ('Welcome email — New Signup', 'new_signup'),
    ('Follow-up — Contacted', 'contacted'),
    ('Demo confirmation — Demo Scheduled', 'demo_scheduled'),
    ('Onboarding kickoff — Onboarding', 'onboarding'),
    ('Welcome aboard — Active Client', 'active'),
    ('Win-back — Churned', 'churned')
  ) AS v(name, stage)
  WHERE NOT EXISTS (
    SELECT 1 FROM sales_pipeline_automations a WHERE a.trigger_stage = v.stage
  );
END
$seed$;

-- Verify
SELECT 'templates' AS kind, count(*) FROM sales_pipeline_email_templates
UNION ALL
SELECT 'automations', count(*) FROM sales_pipeline_automations;
