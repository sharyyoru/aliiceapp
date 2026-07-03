-- ============================================================
-- Bilingual pipeline emails (EN/FR) + language column setup
-- Paste into the Supabase SQL editor and Run. Safe to re-run.
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';

ALTER TABLE sales_pipeline_email_templates
  ADD COLUMN IF NOT EXISTS subject_fr TEXT,
  ADD COLUMN IF NOT EXISTS body_html_fr TEXT;

DO $seed$
DECLARE
  tpl_id uuid;
  welcome_id uuid;
  demo_id uuid;
BEGIN
  -- Welcome (New Signup)

  SELECT id INTO tpl_id FROM sales_pipeline_email_templates WHERE name = 'Aliice — Welcome (New Signup)' LIMIT 1;
  IF tpl_id IS NULL THEN
    INSERT INTO sales_pipeline_email_templates (name, subject, subject_fr, body_html, body_html_fr, description)
    VALUES ('Aliice — Welcome (New Signup)', 'Welcome to Aliice', 'Bienvenue chez Aliice', $body$<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Welcome to Aliice</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
      .h1{font-size:26px !important;line-height:32px !important;}
    }
    a{text-decoration:none;}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">One platform to run your entire clinic — patient records, scheduling, billing & AI.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:12px 40px 0 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-radius:999px;padding:7px 16px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:0.4px;color:#4f46e5;text-transform:uppercase;">Welcome to Aliice</span>
                  </td>
                </tr>
              </table>
              <h1 class="h1" style="margin:18px 0 0 0;font-size:30px;line-height:36px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Welcome to Aliice</h1>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 8px 40px;" align="left">
              
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Hello <strong style="color:#0f172a;">{{contact.name}}</strong>,</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Thank you for attending the presentation by <strong style="color:#0f172a;">Dr. Tenorio</strong>, plastic surgeon, CEO of Aesthetics Clinic, and founder of Aliice.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Aliice is a medical CRM designed around the real-world needs of medical practices and clinics. It centralizes the entire patient journey within a single, secure, and intuitive platform, helping healthcare teams streamline their daily operations, automate routine tasks, and provide a smoother patient experience.</p>
    <h2 style="margin:24px 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">Why discover Aliice?</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Developed by a physician, for healthcare professionals.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">A single platform to centralize the management of your practice or clinic.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Intelligent automation to reduce administrative workload.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">A solution adaptable to all medical specialties.</td>
  </tr></table>
    <h2 style="margin:24px 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">Request your personalized demo</h2>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Every practice and clinic has its own way of working. By completing the form below, we will be able to prepare a personalized demonstration tailored to your specialty and specific needs.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">No obligation</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Personalized demonstration</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Response within 48 hours</td>
  </tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px 0;">
    <tr><td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
      <a href="https://www.aliice.app/register?name={{contact.name_encoded}}&email={{org.email_encoded}}" target="_blank" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:700;color:#ffffff;border-radius:999px;">Complete the form to get started &rarr;</a>
    </td></tr>
  </table>
  
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;" align="center">
              <p style="margin:0;font-size:13px;color:#64748b;">Aliice Computer Software Trading</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;">Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#94a3b8;"><a href="https://www.aliice.app" target="_blank" style="color:#0284c7;">aliice.app</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$body$, $bodyfr$<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Bienvenue chez Aliice</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
      .h1{font-size:26px !important;line-height:32px !important;}
    }
    a{text-decoration:none;}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">Une seule plateforme pour gérer toute votre clinique — dossiers, agenda, facturation & IA.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:12px 40px 0 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-radius:999px;padding:7px 16px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:0.4px;color:#4f46e5;text-transform:uppercase;">Bienvenue chez Aliice</span>
                  </td>
                </tr>
              </table>
              <h1 class="h1" style="margin:18px 0 0 0;font-size:30px;line-height:36px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Bienvenue chez Aliice</h1>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 8px 40px;" align="left">
              
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Bonjour <strong style="color:#0f172a;">{{contact.name}}</strong>,</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Merci d'avoir assisté à la présentation du <strong style="color:#0f172a;">Dr Tenorio</strong>, chirurgien plasticien, CEO d'Aesthetics Clinic et fondateur d'Aliice.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Aliice est un CRM médical conçu à partir des besoins réels des cabinets et des cliniques. Il centralise l'ensemble du parcours patient dans une plateforme unique, sécurisée et intuitive, afin de simplifier l'organisation des équipes médicales, d'automatiser les tâches du quotidien et d'offrir un suivi patient plus fluide.</p>
    <h2 style="margin:24px 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">Pourquoi découvrir Aliice ?</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Développé par un médecin, pour les professionnels de santé.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Une plateforme unique pour centraliser la gestion de votre activité.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Des automatisations intelligentes pour réduire les tâches administratives.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Une solution adaptable à toutes les spécialités médicales.</td>
  </tr></table>
    <h2 style="margin:24px 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">Demander votre démonstration personnalisée</h2>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Chaque structure est différente. En complétant le formulaire ci-dessous, nous pourrons préparer une démonstration adaptée à votre pratique et répondre à vos besoins spécifiques.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Sans engagement</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Démonstration personnalisée</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Réponse sous 48 heures</td>
  </tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px 0;">
    <tr><td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
      <a href="https://www.aliice.app/register?name={{contact.name_encoded}}&email={{org.email_encoded}}" target="_blank" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:700;color:#ffffff;border-radius:999px;">Complétez le formulaire pour commencer &rarr;</a>
    </td></tr>
  </table>
  
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;" align="center">
              <p style="margin:0;font-size:13px;color:#64748b;">Aliice Computer Software Trading</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;">Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#94a3b8;"><a href="https://www.aliice.app" target="_blank" style="color:#0284c7;">aliice.app</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$bodyfr$, 'Bilingual welcome email sent when a lead reaches New Signup.')
    RETURNING id INTO tpl_id;
  ELSE
    UPDATE sales_pipeline_email_templates
    SET subject = 'Welcome to Aliice', subject_fr = 'Bienvenue chez Aliice',
        body_html = $body$<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Welcome to Aliice</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
      .h1{font-size:26px !important;line-height:32px !important;}
    }
    a{text-decoration:none;}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">One platform to run your entire clinic — patient records, scheduling, billing & AI.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:12px 40px 0 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-radius:999px;padding:7px 16px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:0.4px;color:#4f46e5;text-transform:uppercase;">Welcome to Aliice</span>
                  </td>
                </tr>
              </table>
              <h1 class="h1" style="margin:18px 0 0 0;font-size:30px;line-height:36px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Welcome to Aliice</h1>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 8px 40px;" align="left">
              
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Hello <strong style="color:#0f172a;">{{contact.name}}</strong>,</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Thank you for attending the presentation by <strong style="color:#0f172a;">Dr. Tenorio</strong>, plastic surgeon, CEO of Aesthetics Clinic, and founder of Aliice.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Aliice is a medical CRM designed around the real-world needs of medical practices and clinics. It centralizes the entire patient journey within a single, secure, and intuitive platform, helping healthcare teams streamline their daily operations, automate routine tasks, and provide a smoother patient experience.</p>
    <h2 style="margin:24px 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">Why discover Aliice?</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Developed by a physician, for healthcare professionals.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">A single platform to centralize the management of your practice or clinic.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Intelligent automation to reduce administrative workload.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">A solution adaptable to all medical specialties.</td>
  </tr></table>
    <h2 style="margin:24px 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">Request your personalized demo</h2>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Every practice and clinic has its own way of working. By completing the form below, we will be able to prepare a personalized demonstration tailored to your specialty and specific needs.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">No obligation</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Personalized demonstration</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Response within 48 hours</td>
  </tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px 0;">
    <tr><td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
      <a href="https://www.aliice.app/register?name={{contact.name_encoded}}&email={{org.email_encoded}}" target="_blank" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:700;color:#ffffff;border-radius:999px;">Complete the form to get started &rarr;</a>
    </td></tr>
  </table>
  
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;" align="center">
              <p style="margin:0;font-size:13px;color:#64748b;">Aliice Computer Software Trading</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;">Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#94a3b8;"><a href="https://www.aliice.app" target="_blank" style="color:#0284c7;">aliice.app</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$body$, body_html_fr = $bodyfr$<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Bienvenue chez Aliice</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
      .h1{font-size:26px !important;line-height:32px !important;}
    }
    a{text-decoration:none;}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">Une seule plateforme pour gérer toute votre clinique — dossiers, agenda, facturation & IA.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:12px 40px 0 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-radius:999px;padding:7px 16px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:0.4px;color:#4f46e5;text-transform:uppercase;">Bienvenue chez Aliice</span>
                  </td>
                </tr>
              </table>
              <h1 class="h1" style="margin:18px 0 0 0;font-size:30px;line-height:36px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Bienvenue chez Aliice</h1>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 8px 40px;" align="left">
              
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Bonjour <strong style="color:#0f172a;">{{contact.name}}</strong>,</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Merci d'avoir assisté à la présentation du <strong style="color:#0f172a;">Dr Tenorio</strong>, chirurgien plasticien, CEO d'Aesthetics Clinic et fondateur d'Aliice.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Aliice est un CRM médical conçu à partir des besoins réels des cabinets et des cliniques. Il centralise l'ensemble du parcours patient dans une plateforme unique, sécurisée et intuitive, afin de simplifier l'organisation des équipes médicales, d'automatiser les tâches du quotidien et d'offrir un suivi patient plus fluide.</p>
    <h2 style="margin:24px 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">Pourquoi découvrir Aliice ?</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Développé par un médecin, pour les professionnels de santé.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Une plateforme unique pour centraliser la gestion de votre activité.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Des automatisations intelligentes pour réduire les tâches administratives.</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Une solution adaptable à toutes les spécialités médicales.</td>
  </tr></table>
    <h2 style="margin:24px 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">Demander votre démonstration personnalisée</h2>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Chaque structure est différente. En complétant le formulaire ci-dessous, nous pourrons préparer une démonstration adaptée à votre pratique et répondre à vos besoins spécifiques.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Sans engagement</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Démonstration personnalisée</td>
  </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">Réponse sous 48 heures</td>
  </tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px 0;">
    <tr><td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
      <a href="https://www.aliice.app/register?name={{contact.name_encoded}}&email={{org.email_encoded}}" target="_blank" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:700;color:#ffffff;border-radius:999px;">Complétez le formulaire pour commencer &rarr;</a>
    </td></tr>
  </table>
  
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;" align="center">
              <p style="margin:0;font-size:13px;color:#64748b;">Aliice Computer Software Trading</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;">Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#94a3b8;"><a href="https://www.aliice.app" target="_blank" style="color:#0284c7;">aliice.app</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$bodyfr$,
        description = 'Bilingual welcome email sent when a lead reaches New Signup.', updated_at = NOW()
    WHERE id = tpl_id;
  END IF;
  welcome_id := tpl_id;

  -- Demo Confirmation (Demo Scheduled)

  SELECT id INTO tpl_id FROM sales_pipeline_email_templates WHERE name = 'Aliice — Demo Confirmation' LIMIT 1;
  IF tpl_id IS NULL THEN
    INSERT INTO sales_pipeline_email_templates (name, subject, subject_fr, body_html, body_html_fr, description)
    VALUES ('Aliice — Demo Confirmation', 'Thank you for your interest in Aliice', 'Merci pour votre intérêt envers Aliice', $body$<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Thank you for your interest in Aliice</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
      .h1{font-size:26px !important;line-height:32px !important;}
    }
    a{text-decoration:none;}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">We've received your demo request — a member of our team will be in touch shortly.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:12px 40px 0 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-radius:999px;padding:7px 16px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:0.4px;color:#4f46e5;text-transform:uppercase;">Demo request received</span>
                  </td>
                </tr>
              </table>
              <h1 class="h1" style="margin:18px 0 0 0;font-size:30px;line-height:36px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Thank you for your interest in Aliice</h1>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 8px 40px;" align="left">
              
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Dear Dr. <strong style="color:#0f172a;">{{contact.name}}</strong>,</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Thank you for your interest in Aliice.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">We have successfully received your request for a personalized demonstration. A member of our team will contact you within the next few days to schedule a meeting and present the features that are most relevant to your practice and the specific needs of your clinic.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">In the meantime, we appreciate your interest and look forward to showing you how Aliice can help streamline your daily operations, optimize your patient journey, and support the growth of your practice.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">We look forward to speaking with you soon.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Kind regards,<br/><strong style="color:#0f172a;">The Aliice Team</strong></p>
  
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;" align="center">
              <p style="margin:0;font-size:13px;color:#64748b;">Aliice Computer Software Trading</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;">Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#94a3b8;"><a href="https://www.aliice.app" target="_blank" style="color:#0284c7;">aliice.app</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$body$, $bodyfr$<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Merci pour votre intérêt envers Aliice</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
      .h1{font-size:26px !important;line-height:32px !important;}
    }
    a{text-decoration:none;}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">Nous avons bien reçu votre demande de démonstration — notre équipe vous contactera rapidement.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:12px 40px 0 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-radius:999px;padding:7px 16px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:0.4px;color:#4f46e5;text-transform:uppercase;">Demande de démonstration reçue</span>
                  </td>
                </tr>
              </table>
              <h1 class="h1" style="margin:18px 0 0 0;font-size:30px;line-height:36px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Merci pour votre intérêt envers Aliice</h1>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 8px 40px;" align="left">
              
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Bonjour Dr <strong style="color:#0f172a;">{{contact.name}}</strong>,</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Nous vous remercions pour votre intérêt envers Aliice.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Nous avons bien reçu votre demande de démonstration. Un membre de notre équipe prendra contact avec vous dans les prochains jours afin d'organiser un échange personnalisé et de vous présenter les fonctionnalités les plus adaptées à votre pratique.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">En attendant, nous vous remercions de votre confiance et nous réjouissons de vous faire découvrir comment Aliice peut accompagner votre cabinet ou votre clinique dans l'optimisation de son organisation et du parcours patient.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">À très bientôt,<br/><strong style="color:#0f172a;">L'équipe Aliice</strong></p>
  
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;" align="center">
              <p style="margin:0;font-size:13px;color:#64748b;">Aliice Computer Software Trading</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;">Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#94a3b8;"><a href="https://www.aliice.app" target="_blank" style="color:#0284c7;">aliice.app</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$bodyfr$, 'Bilingual confirmation email sent when a lead reaches Demo Scheduled.')
    RETURNING id INTO tpl_id;
  ELSE
    UPDATE sales_pipeline_email_templates
    SET subject = 'Thank you for your interest in Aliice', subject_fr = 'Merci pour votre intérêt envers Aliice',
        body_html = $body$<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Thank you for your interest in Aliice</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
      .h1{font-size:26px !important;line-height:32px !important;}
    }
    a{text-decoration:none;}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">We've received your demo request — a member of our team will be in touch shortly.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:12px 40px 0 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-radius:999px;padding:7px 16px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:0.4px;color:#4f46e5;text-transform:uppercase;">Demo request received</span>
                  </td>
                </tr>
              </table>
              <h1 class="h1" style="margin:18px 0 0 0;font-size:30px;line-height:36px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Thank you for your interest in Aliice</h1>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 8px 40px;" align="left">
              
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Dear Dr. <strong style="color:#0f172a;">{{contact.name}}</strong>,</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Thank you for your interest in Aliice.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">We have successfully received your request for a personalized demonstration. A member of our team will contact you within the next few days to schedule a meeting and present the features that are most relevant to your practice and the specific needs of your clinic.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">In the meantime, we appreciate your interest and look forward to showing you how Aliice can help streamline your daily operations, optimize your patient journey, and support the growth of your practice.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">We look forward to speaking with you soon.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Kind regards,<br/><strong style="color:#0f172a;">The Aliice Team</strong></p>
  
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;" align="center">
              <p style="margin:0;font-size:13px;color:#64748b;">Aliice Computer Software Trading</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;">Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#94a3b8;"><a href="https://www.aliice.app" target="_blank" style="color:#0284c7;">aliice.app</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$body$, body_html_fr = $bodyfr$<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Merci pour votre intérêt envers Aliice</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
      .h1{font-size:26px !important;line-height:32px !important;}
    }
    a{text-decoration:none;}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">Nous avons bien reçu votre demande de démonstration — notre équipe vous contactera rapidement.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:12px 40px 0 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-radius:999px;padding:7px 16px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:0.4px;color:#4f46e5;text-transform:uppercase;">Demande de démonstration reçue</span>
                  </td>
                </tr>
              </table>
              <h1 class="h1" style="margin:18px 0 0 0;font-size:30px;line-height:36px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Merci pour votre intérêt envers Aliice</h1>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 8px 40px;" align="left">
              
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Bonjour Dr <strong style="color:#0f172a;">{{contact.name}}</strong>,</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Nous vous remercions pour votre intérêt envers Aliice.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">Nous avons bien reçu votre demande de démonstration. Un membre de notre équipe prendra contact avec vous dans les prochains jours afin d'organiser un échange personnalisé et de vous présenter les fonctionnalités les plus adaptées à votre pratique.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">En attendant, nous vous remercions de votre confiance et nous réjouissons de vous faire découvrir comment Aliice peut accompagner votre cabinet ou votre clinique dans l'optimisation de son organisation et du parcours patient.</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">À très bientôt,<br/><strong style="color:#0f172a;">L'équipe Aliice</strong></p>
  
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;" align="center">
              <p style="margin:0;font-size:13px;color:#64748b;">Aliice Computer Software Trading</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;">Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#94a3b8;"><a href="https://www.aliice.app" target="_blank" style="color:#0284c7;">aliice.app</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$bodyfr$,
        description = 'Bilingual confirmation email sent when a lead reaches Demo Scheduled.', updated_at = NOW()
    WHERE id = tpl_id;
  END IF;
  demo_id := tpl_id;

  -- Attach templates to the matching stage automations (create if missing).
  UPDATE sales_pipeline_automations SET template_id = welcome_id, action_type = 'send_email', active = true
  WHERE trigger_stage = 'new_signup';
  IF NOT EXISTS (SELECT 1 FROM sales_pipeline_automations WHERE trigger_stage = 'new_signup') THEN
    INSERT INTO sales_pipeline_automations (name, trigger_stage, action_type, template_id, active)
    VALUES ('Welcome email — New Signup', 'new_signup', 'send_email', welcome_id, true);
  END IF;

  UPDATE sales_pipeline_automations SET template_id = demo_id, action_type = 'send_email', active = true
  WHERE trigger_stage = 'demo_scheduled';
  IF NOT EXISTS (SELECT 1 FROM sales_pipeline_automations WHERE trigger_stage = 'demo_scheduled') THEN
    INSERT INTO sales_pipeline_automations (name, trigger_stage, action_type, template_id, active)
    VALUES ('Demo confirmation — Demo Scheduled', 'demo_scheduled', 'send_email', demo_id, true);
  END IF;
END
$seed$;

-- Verify
SELECT name, (subject_fr IS NOT NULL) AS has_fr FROM sales_pipeline_email_templates ORDER BY name;
SELECT a.trigger_stage, a.active, t.name AS template
FROM sales_pipeline_automations a
LEFT JOIN sales_pipeline_email_templates t ON t.id = a.template_id
ORDER BY a.trigger_stage;
