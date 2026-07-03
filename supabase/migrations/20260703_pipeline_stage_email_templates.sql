-- ============================================================
-- Stage-specific email templates + automations update
-- Stages covered: onboarding, contacted, churned, demo_scheduled
-- ============================================================

-- ─── Shared CSS (embedded in each template) ──────────────────
-- Uses Aliice brand colours: #0ea5e9 (sky-500), #0f172a (slate-900)
-- Logo: https://www.aliice.app/logos/aliice-logo.png

-- ─── 1. ONBOARDING template ──────────────────────────────────
INSERT INTO sales_pipeline_email_templates (name, subject, body_html, description)
VALUES (
  'Onboarding – Welcome to Your Journey',
  'Your Aliice onboarding starts now, {{org.name}} 🚀',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Onboarding</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%);padding:36px 40px;text-align:center;">
          <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="110" style="display:block;margin:0 auto 16px;" />
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Welcome aboard, {{contact.first_name}}!</h1>
          <p style="margin:8px 0 0;color:#bae6fd;font-size:15px;">Your onboarding journey begins today</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.7;">
            We're thrilled to have <strong>{{org.name}}</strong> join the Aliice family. Your account is now in the <strong>Onboarding</strong> phase and we're here every step of the way.
          </p>

          <!-- Steps -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr>
              <td style="background:#f0f9ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:16px 20px;margin-bottom:12px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#0284c7;">Step 1 — Set up your clinic profile</p>
                <p style="margin:6px 0 0;font-size:14px;color:#475569;">Add your logo, services, team members and working hours.</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
            <tr>
              <td style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;padding:16px 20px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#16a34a;">Step 2 — Invite your team</p>
                <p style="margin:6px 0 0;font-size:14px;color:#475569;">Add staff accounts so everyone can collaborate.</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 28px;">
            <tr>
              <td style="background:#fdf4ff;border-left:4px solid #a855f7;border-radius:8px;padding:16px 20px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#9333ea;">Step 3 — Book your onboarding call</p>
                <p style="margin:6px 0 0;font-size:14px;color:#475569;">Our team will walk you through every feature live.</p>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 28px;color:#334155;font-size:15px;line-height:1.7;">
            Your dedicated success manager will reach out within <strong>24 hours</strong>. In the meantime feel free to explore the platform.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:10px;">
                <a href="https://www.aliice.app/{{org.slug}}" style="display:block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                  Go to my dashboard →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Questions? Reply to this email or contact us at <a href="mailto:hello@aliice.app" style="color:#0ea5e9;text-decoration:none;">hello@aliice.app</a></p>
          <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">© 2025 Aliice · All-in-one clinic management platform</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>
$HTML$,
  'Sent when an organisation enters the Onboarding stage'
)
ON CONFLICT DO NOTHING;


-- ─── 2. CONTACTED template ────────────────────────────────────
INSERT INTO sales_pipeline_email_templates (name, subject, body_html, description)
VALUES (
  'Follow-up – We''d Love to Connect',
  'Let''s find a time to talk, {{contact.first_name}} 👋',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Follow-up</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:36px 40px;text-align:center;">
          <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="110" style="display:block;margin:0 auto 16px;" />
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Hi {{contact.first_name}}, quick hello 👋</h1>
          <p style="margin:8px 0 0;color:#c7d2fe;font-size:15px;">We noticed your interest in Aliice</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.7;">
            We saw that <strong>{{org.name}}</strong> has been exploring Aliice and we'd love the chance to show you how we help clinics like yours save time and grow.
          </p>

          <!-- Value props -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
              <td width="48%" style="background:#f0f9ff;border-radius:12px;padding:20px;vertical-align:top;">
                <p style="margin:0 0 8px;font-size:22px;">⚡</p>
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0f172a;">Save hours every week</p>
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Automate appointments, invoices, and patient communications.</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#fdf4ff;border-radius:12px;padding:20px;vertical-align:top;">
                <p style="margin:0 0 8px;font-size:22px;">📈</p>
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0f172a;">Grow your practice</p>
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Built-in CRM, pipeline tracking, and marketing tools.</p>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 28px;color:#334155;font-size:15px;line-height:1.7;">
            Would you have <strong>20 minutes</strong> for a quick call this week? We'll show you what Aliice can do for <strong>{{org.name}}</strong> specifically — no sales pitch, just a real demo.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:10px;">
                <a href="https://www.aliice.app/demo" style="display:block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                  Book a free demo →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:28px 0 0;font-size:14px;color:#64748b;text-align:center;">
            Or simply reply to this email and we'll sort something out.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Questions? Reply to this email or write to <a href="mailto:hello@aliice.app" style="color:#6366f1;text-decoration:none;">hello@aliice.app</a></p>
          <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">© 2025 Aliice · All-in-one clinic management platform</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>
$HTML$,
  'Sent when an organisation enters the Contacted stage'
)
ON CONFLICT DO NOTHING;


-- ─── 3. CHURNED / WIN-BACK template ──────────────────────────
INSERT INTO sales_pipeline_email_templates (name, subject, body_html, description)
VALUES (
  'Win-back – We Miss You, {{org.name}}',
  'Come back to Aliice — here''s what''s new ✨',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Win-back</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:36px 40px;text-align:center;">
          <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="110" style="display:block;margin:0 auto 16px;" />
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">We miss you, {{contact.first_name}} 💛</h1>
          <p style="margin:8px 0 0;color:#fed7aa;font-size:15px;">A lot has changed since you left</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.7;">
            We noticed <strong>{{org.name}}</strong> hasn't been active lately and we wanted to reach out personally. We've shipped a lot of improvements you asked for — and we think you'll love what's new.
          </p>

          <!-- What's new -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border-radius:12px;padding:24px;margin:0 0 28px;">
            <tr>
              <td>
                <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#9a3412;">What's new in Aliice 🚀</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #fed7aa;">
                      <p style="margin:0;font-size:14px;color:#334155;">✅ <strong>New booking flow</strong> — faster, mobile-friendly patient scheduling</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #fed7aa;">
                      <p style="margin:0;font-size:14px;color:#334155;">✅ <strong>Integrated payments</strong> — invoicing with Payrexx, right inside Aliice</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #fed7aa;">
                      <p style="margin:0;font-size:14px;color:#334155;">✅ <strong>Two-way Gmail sync</strong> — manage all client emails without leaving the app</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <p style="margin:0;font-size:14px;color:#334155;">✅ <strong>Team calendar</strong> — Google Meet meetings, straight from Aliice</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 28px;color:#334155;font-size:15px;line-height:1.7;">
            We'd love to welcome <strong>{{org.name}}</strong> back. If there was something that didn't work for you before, tell us — we read every reply.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="background:linear-gradient(135deg,#f97316,#ea580c);border-radius:10px;">
                <a href="https://www.aliice.app/{{org.slug}}" style="display:block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                  Reactivate my account →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
            Not ready yet? No worries. We'll keep the door open.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Reply to this email or write to <a href="mailto:hello@aliice.app" style="color:#f97316;text-decoration:none;">hello@aliice.app</a></p>
          <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">© 2025 Aliice · All-in-one clinic management platform</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>
$HTML$,
  'Sent when an organisation enters the Churned stage (win-back)'
)
ON CONFLICT DO NOTHING;


-- ─── 4. DEMO SCHEDULED template ──────────────────────────────
INSERT INTO sales_pipeline_email_templates (name, subject, body_html, description)
VALUES (
  'Demo Confirmation – Your Aliice Demo is Confirmed',
  'Your Aliice demo is confirmed, {{contact.first_name}} 🗓️',
  $HTML$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Demo Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:36px 40px;text-align:center;">
          <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="110" style="display:block;margin:0 auto 16px;" />
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Your demo is confirmed! 🗓️</h1>
          <p style="margin:8px 0 0;color:#a7f3d0;font-size:15px;">We can't wait to show you Aliice</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.7;">
            Hi <strong>{{contact.first_name}}</strong>, your demo for <strong>{{org.name}}</strong> is all set. Here's what you can expect during our session:
          </p>

          <!-- Agenda -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:24px;margin:0 0 28px;">
            <tr>
              <td>
                <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#065f46;">What we'll cover in 30 minutes</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #bbf7d0;">
                      <p style="margin:0;font-size:14px;color:#334155;">
                        <span style="display:inline-block;width:24px;height:24px;background:#10b981;border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:24px;margin-right:10px;">1</span>
                        <strong>Platform overview</strong> — the full Aliice suite in action
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #bbf7d0;">
                      <p style="margin:0;font-size:14px;color:#334155;">
                        <span style="display:inline-block;width:24px;height:24px;background:#10b981;border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:24px;margin-right:10px;">2</span>
                        <strong>Your use-case</strong> — tailored walkthrough for {{org.name}}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #bbf7d0;">
                      <p style="margin:0;font-size:14px;color:#334155;">
                        <span style="display:inline-block;width:24px;height:24px;background:#10b981;border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:24px;margin-right:10px;">3</span>
                        <strong>Pricing &amp; next steps</strong> — transparent, no surprises
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;">
                      <p style="margin:0;font-size:14px;color:#334155;">
                        <span style="display:inline-block;width:24px;height:24px;background:#10b981;border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:24px;margin-right:10px;">4</span>
                        <strong>Q&amp;A</strong> — ask us anything
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Tips box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 28px;">
            <tr>
              <td>
                <p style="margin:0;font-size:14px;font-weight:700;color:#92400e;">💡 To get the most out of your demo</p>
                <p style="margin:8px 0 0;font-size:13px;color:#78350f;line-height:1.6;">Think about your biggest clinic pain-points right now — we'll show you exactly how Aliice solves them.</p>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 28px;color:#334155;font-size:15px;line-height:1.7;">
            If you need to reschedule or have any questions beforehand, just reply to this email. We're happy to help.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;">
                <a href="https://www.aliice.app/demo" style="display:block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                  View demo details →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Questions? Reply to this email or write to <a href="mailto:hello@aliice.app" style="color:#10b981;text-decoration:none;">hello@aliice.app</a></p>
          <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">© 2025 Aliice · All-in-one clinic management platform</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>
$HTML$,
  'Sent when an organisation enters the Demo Scheduled stage'
)
ON CONFLICT DO NOTHING;


-- ─── Wire each automation to its new dedicated template ──────
-- We do this with a DO $$ block so we can resolve template IDs by name.
DO $$
DECLARE
  tpl_onboarding   UUID;
  tpl_contacted    UUID;
  tpl_churned      UUID;
  tpl_demo         UUID;
BEGIN
  SELECT id INTO tpl_onboarding   FROM sales_pipeline_email_templates WHERE name = 'Onboarding – Welcome to Your Journey'         LIMIT 1;
  SELECT id INTO tpl_contacted    FROM sales_pipeline_email_templates WHERE name = 'Follow-up – We''d Love to Connect'             LIMIT 1;
  SELECT id INTO tpl_churned      FROM sales_pipeline_email_templates WHERE name = 'Win-back – We Miss You, {{org.name}}'          LIMIT 1;
  SELECT id INTO tpl_demo         FROM sales_pipeline_email_templates WHERE name = 'Demo Confirmation – Your Aliice Demo is Confirmed' LIMIT 1;

  -- Update each automation by trigger_stage (first active match).
  -- Only updates template_id; leaves all other fields untouched.
  IF tpl_onboarding IS NOT NULL THEN
    UPDATE sales_pipeline_automations
    SET template_id = tpl_onboarding
    WHERE trigger_stage = 'onboarding' AND active = true;
  END IF;

  IF tpl_contacted IS NOT NULL THEN
    UPDATE sales_pipeline_automations
    SET template_id = tpl_contacted
    WHERE trigger_stage = 'contacted' AND active = true;
  END IF;

  IF tpl_churned IS NOT NULL THEN
    UPDATE sales_pipeline_automations
    SET template_id = tpl_churned
    WHERE trigger_stage = 'churned' AND active = true;
  END IF;

  IF tpl_demo IS NOT NULL THEN
    UPDATE sales_pipeline_automations
    SET template_id = tpl_demo
    WHERE trigger_stage = 'demo_scheduled' AND active = true;
  END IF;
END $$;
