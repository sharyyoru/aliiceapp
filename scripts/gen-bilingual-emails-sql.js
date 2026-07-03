/**
 * Generates a paste-once SQL file for the Supabase SQL editor that:
 *   1. Adds preferred_language (organizations) + subject_fr/body_html_fr
 *      (sales_pipeline_email_templates) columns.
 *   2. Seeds two bilingual (EN/FR) templates with the Aliice logo:
 *        - "Aliice — Welcome (New Signup)"
 *        - "Aliice — Demo Confirmation"
 *   3. Attaches the Welcome template to the new_signup automation and the
 *      Demo Confirmation template to the demo_scheduled automation.
 *
 * Idempotent — safe to run more than once.
 *
 * Usage:  node scripts/gen-bilingual-emails-sql.js
 * Output: scripts/manual-bilingual-emails.sql
 */

const fs = require("fs");
const path = require("path");

const OUT_PATH = path.join(__dirname, "manual-bilingual-emails.sql");
const LOGO_URL = "https://www.aliice.app/logos/aliice-logo.png";
// Welcome CTA -> register with the lead's name & email prefilled (URL-encoded
// merge tags resolved by the automation engine at send time).
const REGISTER_URL =
  "https://www.aliice.app/register?name={{contact.name_encoded}}&email={{org.email_encoded}}";

// ---------------------------------------------------------------------------
// Shared, email-client-safe layout (table based, inline styles)
// ---------------------------------------------------------------------------
function check(text) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="26" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">${text}</td>
  </tr></table>`;
}

function shell({ preheader, badge, heading, inner }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${heading}</title>
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
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <img src="${LOGO_URL}" alt="Aliice" width="120" style="display:block;width:120px;max-width:120px;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:12px 40px 0 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#e0f2fe,#ede9fe);border-radius:999px;padding:7px 16px;">
                    <span style="font-size:12px;font-weight:600;letter-spacing:0.4px;color:#4f46e5;text-transform:uppercase;">${badge}</span>
                  </td>
                </tr>
              </table>
              <h1 class="h1" style="margin:18px 0 0 0;font-size:30px;line-height:36px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">${heading}</h1>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 8px 40px;" align="left">
              ${inner}
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
</html>`;
}

const P = (html) => `<p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;">${html}</p>`;
const H2 = (t) => `<h2 style="margin:24px 0 12px 0;font-size:18px;font-weight:700;color:#0f172a;">${t}</h2>`;
function ctaButton(label, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px 0;">
    <tr><td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
      <a href="${url}" target="_blank" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:700;color:#ffffff;border-radius:999px;">${label}</a>
    </td></tr>
  </table>`;
}

// ---------------------------------------------------------------------------
// Welcome email (New Signup) — from images 1 (FR) & 2 (EN)
// ---------------------------------------------------------------------------
const welcomeEn = shell({
  preheader: "One platform to run your entire clinic — patient records, scheduling, billing & AI.",
  badge: "Welcome to Aliice",
  heading: "Welcome to Aliice",
  inner: `
    ${P("Hello <strong style=\"color:#0f172a;\">{{contact.name}}</strong>,")}
    ${P("Thank you for attending the presentation by <strong style=\"color:#0f172a;\">Dr. Tenorio</strong>, plastic surgeon, CEO of Aesthetics Clinic, and founder of Aliice.")}
    ${P("Aliice is a medical CRM designed around the real-world needs of medical practices and clinics. It centralizes the entire patient journey within a single, secure, and intuitive platform, helping healthcare teams streamline their daily operations, automate routine tasks, and provide a smoother patient experience.")}
    ${H2("Why discover Aliice?")}
    ${check("Developed by a physician, for healthcare professionals.")}
    ${check("A single platform to centralize the management of your practice or clinic.")}
    ${check("Intelligent automation to reduce administrative workload.")}
    ${check("A solution adaptable to all medical specialties.")}
    ${H2("Request your personalized demo")}
    ${P("Every practice and clinic has its own way of working. By completing the form below, we will be able to prepare a personalized demonstration tailored to your specialty and specific needs.")}
    ${check("No obligation")}
    ${check("Personalized demonstration")}
    ${check("Response within 48 hours")}
    ${ctaButton("Complete the form to get started &rarr;", REGISTER_URL)}
  `,
});

const welcomeFr = shell({
  preheader: "Une seule plateforme pour gérer toute votre clinique — dossiers, agenda, facturation & IA.",
  badge: "Bienvenue chez Aliice",
  heading: "Bienvenue chez Aliice",
  inner: `
    ${P("Bonjour <strong style=\"color:#0f172a;\">{{contact.name}}</strong>,")}
    ${P("Merci d'avoir assisté à la présentation du <strong style=\"color:#0f172a;\">Dr Tenorio</strong>, chirurgien plasticien, CEO d'Aesthetics Clinic et fondateur d'Aliice.")}
    ${P("Aliice est un CRM médical conçu à partir des besoins réels des cabinets et des cliniques. Il centralise l'ensemble du parcours patient dans une plateforme unique, sécurisée et intuitive, afin de simplifier l'organisation des équipes médicales, d'automatiser les tâches du quotidien et d'offrir un suivi patient plus fluide.")}
    ${H2("Pourquoi découvrir Aliice ?")}
    ${check("Développé par un médecin, pour les professionnels de santé.")}
    ${check("Une plateforme unique pour centraliser la gestion de votre activité.")}
    ${check("Des automatisations intelligentes pour réduire les tâches administratives.")}
    ${check("Une solution adaptable à toutes les spécialités médicales.")}
    ${H2("Demander votre démonstration personnalisée")}
    ${P("Chaque structure est différente. En complétant le formulaire ci-dessous, nous pourrons préparer une démonstration adaptée à votre pratique et répondre à vos besoins spécifiques.")}
    ${check("Sans engagement")}
    ${check("Démonstration personnalisée")}
    ${check("Réponse sous 48 heures")}
    ${ctaButton("Complétez le formulaire pour commencer &rarr;", REGISTER_URL)}
  `,
});

// ---------------------------------------------------------------------------
// Demo Confirmation (Demo Scheduled) — from image 3
// ---------------------------------------------------------------------------
const demoEn = shell({
  preheader: "We've received your demo request — a member of our team will be in touch shortly.",
  badge: "Demo request received",
  heading: "Thank you for your interest in Aliice",
  inner: `
    ${P("Dear Dr. <strong style=\"color:#0f172a;\">{{contact.name}}</strong>,")}
    ${P("Thank you for your interest in Aliice.")}
    ${P("We have successfully received your request for a personalized demonstration. A member of our team will contact you within the next few days to schedule a meeting and present the features that are most relevant to your practice and the specific needs of your clinic.")}
    ${P("In the meantime, we appreciate your interest and look forward to showing you how Aliice can help streamline your daily operations, optimize your patient journey, and support the growth of your practice.")}
    ${P("We look forward to speaking with you soon.")}
    ${P("Kind regards,<br/><strong style=\"color:#0f172a;\">The Aliice Team</strong>")}
  `,
});

const demoFr = shell({
  preheader: "Nous avons bien reçu votre demande de démonstration — notre équipe vous contactera rapidement.",
  badge: "Demande de démonstration reçue",
  heading: "Merci pour votre intérêt envers Aliice",
  inner: `
    ${P("Bonjour Dr <strong style=\"color:#0f172a;\">{{contact.name}}</strong>,")}
    ${P("Nous vous remercions pour votre intérêt envers Aliice.")}
    ${P("Nous avons bien reçu votre demande de démonstration. Un membre de notre équipe prendra contact avec vous dans les prochains jours afin d'organiser un échange personnalisé et de vous présenter les fonctionnalités les plus adaptées à votre pratique.")}
    ${P("En attendant, nous vous remercions de votre confiance et nous réjouissons de vous faire découvrir comment Aliice peut accompagner votre cabinet ou votre clinique dans l'optimisation de son organisation et du parcours patient.")}
    ${P("À très bientôt,<br/><strong style=\"color:#0f172a;\">L'équipe Aliice</strong>")}
  `,
});

// ---------------------------------------------------------------------------
// Build SQL (dollar-quoted bodies avoid escaping the HTML)
// ---------------------------------------------------------------------------
const WELCOME_NAME = "Aliice — Welcome (New Signup)";
const DEMO_NAME = "Aliice — Demo Confirmation";

function upsertTemplate(name, subjectEn, subjectFr, bodyEn, bodyFr, description) {
  const esc = (s) => s.replace(/'/g, "''");
  return `
  SELECT id INTO tpl_id FROM sales_pipeline_email_templates WHERE name = '${esc(name)}' LIMIT 1;
  IF tpl_id IS NULL THEN
    INSERT INTO sales_pipeline_email_templates (name, subject, subject_fr, body_html, body_html_fr, description)
    VALUES ('${esc(name)}', '${esc(subjectEn)}', '${esc(subjectFr)}', $body$${bodyEn}$body$, $bodyfr$${bodyFr}$bodyfr$, '${esc(description)}')
    RETURNING id INTO tpl_id;
  ELSE
    UPDATE sales_pipeline_email_templates
    SET subject = '${esc(subjectEn)}', subject_fr = '${esc(subjectFr)}',
        body_html = $body$${bodyEn}$body$, body_html_fr = $bodyfr$${bodyFr}$bodyfr$,
        description = '${esc(description)}', updated_at = NOW()
    WHERE id = tpl_id;
  END IF;`;
}

const sql = `-- ============================================================
-- Bilingual pipeline emails (EN/FR) + language column setup
-- Paste into the Supabase SQL editor and Run. Safe to re-run.
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';

ALTER TABLE sales_pipeline_email_templates
  ADD COLUMN IF NOT EXISTS subject_fr TEXT,
  ADD COLUMN IF NOT EXISTS body_html_fr TEXT,
  ADD COLUMN IF NOT EXISTS design_json JSONB,
  ADD COLUMN IF NOT EXISTS design_json_fr JSONB;

DO $seed$
DECLARE
  tpl_id uuid;
  welcome_id uuid;
  demo_id uuid;
BEGIN
  -- Welcome (New Signup)
${upsertTemplate(
  WELCOME_NAME,
  "Welcome to Aliice",
  "Bienvenue chez Aliice",
  welcomeEn,
  welcomeFr,
  "Bilingual welcome email sent when a lead reaches New Signup."
)}
  welcome_id := tpl_id;

  -- Demo Confirmation (Demo Scheduled)
${upsertTemplate(
  DEMO_NAME,
  "Thank you for your interest in Aliice",
  "Merci pour votre intérêt envers Aliice",
  demoEn,
  demoFr,
  "Bilingual confirmation email sent when a lead reaches Demo Scheduled."
)}
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
`;

fs.writeFileSync(OUT_PATH, sql, "utf-8");
console.log("Wrote", OUT_PATH);
console.log("Bytes:", sql.length);
