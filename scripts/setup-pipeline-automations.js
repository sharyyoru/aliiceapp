/**
 * Phase 4 setup: create the sales pipeline automation tables and seed the
 * "Aliice — All-in-one Platform" email template (the same design served at
 * /template).
 *
 * Strategy:
 *   1. If DATABASE_URL / SUPABASE_DB_URL is set -> run DDL via node-postgres.
 *   2. Otherwise -> try the exec_sql RPC via the Supabase service client.
 * Template seeding always uses the Supabase service client (runs after DDL).
 *
 * Usage:  node scripts/setup-pipeline-automations.js
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config(); // fall back to .env

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

const MIGRATION_PATH = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "20260702_sales_pipeline_automations.sql"
);

// ---------------------------------------------------------------------------
// Email template (mirrors src/app/template/page.tsx buildEmailHtml)
// ---------------------------------------------------------------------------
const PRIMARY_CTA_URL = "https://www.aliice.app/signup";
const DEMO_CTA_URL = "https://www.aliice.app/contact";
const LOGO_URL = "https://www.aliice.app/logos/aliice-logo.png";

function featureCell(emoji, title, desc) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">${emoji}</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">${title}</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">${desc}</div>
    </td></tr>
  </table>`;
}

function checkItem(text) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">${text}</td>
  </tr></table>`;
}

function buildEmailHtml(greetingName) {
  return `<!DOCTYPE html>
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
              <img src="${LOGO_URL}" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
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
                Hi ${greetingName}, juggling separate tools for bookings, patient records, billing and marketing is costing you time and money. <strong style="color:#0f172a;">Aliice replaces 3+ systems with one</strong> — and clinics save up to <strong style="color:#4f46e5;">49%</strong> on software costs.
              </p>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:28px 40px 8px 40px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
                    <a href="${PRIMARY_CTA_URL}" target="_blank" style="display:inline-block;padding:16px 34px;font-size:16px;font-weight:700;color:#ffffff;border-radius:999px;">
                      Start your free trial &rarr;
                    </a>
                  </td>
                  <td style="width:14px;">&nbsp;</td>
                  <td>
                    <a href="${DEMO_CTA_URL}" target="_blank" style="display:inline-block;padding:15px 28px;font-size:16px;font-weight:600;color:#0f172a;border:1px solid #cbd5e1;border-radius:999px;">
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
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 18px 0;">${featureCell("🗂️", "Patient Management", "Records, history &amp; treatment tracking in one place.")}</td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 18px 10px;">${featureCell("📅", "Smart Scheduling", "Online booking with automated reminders.")}</td>
                </tr>
                <tr>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 18px 0;">${featureCell("🤖", "AI Medical Scribe", "Voice consultations turned into SOAP notes.")}</td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 18px 10px;">${featureCell("💳", "Billing &amp; Invoicing", "Insurance-ready billing with fewer errors.")}</td>
                </tr>
                <tr>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 0 0;">${featureCell("💬", "Omnichannel Messaging", "Email, SMS &amp; WhatsApp from one inbox.")}</td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 0 10px;">${featureCell("📊", "Analytics &amp; Reports", "Real-time insight into revenue &amp; growth.")}</td>
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
              ${checkItem("Save up to 49% vs. using separate CRM, ERP &amp; booking tools")}
              ${checkItem("Purpose-built for aesthetic &amp; medical clinics")}
              ${checkItem("AI Medical Scribe included — reclaim 2+ hours a day")}
              ${checkItem("GDPR compliant &amp; securely hosted")}
              ${checkItem("Flexible month-to-month pricing, cancel anytime")}
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:28px 40px 36px 40px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
                    <a href="${PRIMARY_CTA_URL}" target="_blank" style="display:inline-block;padding:17px 44px;font-size:17px;font-weight:700;color:#ffffff;border-radius:999px;">
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
</html>`;
}

const TEMPLATE_NAME = "Aliice — All-in-one Platform (Welcome)";
const TEMPLATE_SUBJECT = "Run your entire clinic on one platform, {{org.name}}";
// Greeting uses the org merge tag; the automation engine personalizes it per lead.
const TEMPLATE_BODY = buildEmailHtml("{{org.name}}");

async function runViaPg() {
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(MIGRATION_PATH, "utf-8");
    await client.query(sql);
    console.log("  ✓ Tables created (node-postgres)");
  } finally {
    client.release();
    await pool.end();
  }
}

async function runViaRpc(supabase) {
  const sql = fs.readFileSync(MIGRATION_PATH, "utf-8");
  const { error } = await supabase.rpc("exec_sql", { query: sql });
  if (error) throw new Error(error.message);
  console.log("  ✓ Tables created (exec_sql RPC)");
}

async function main() {
  console.log("=".repeat(60));
  console.log("Phase 4 — Sales Pipeline Automations setup");
  console.log("=".repeat(60));

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("\n✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // 1) Apply migration
  console.log("\n[1/2] Creating tables...");
  try {
    if (DB_URL) {
      await runViaPg();
    } else {
      await runViaRpc(supabase);
    }
  } catch (err) {
    console.error("\n✗ Failed to create tables automatically:", err.message);
    console.error("\nPlease run this SQL manually in the Supabase SQL editor:");
    console.error("  File: supabase/migrations/20260702_sales_pipeline_automations.sql");
    process.exit(1);
  }

  // 2) Seed template (idempotent by name)
  console.log("\n[2/2] Seeding email template...");
  const { data: existing } = await supabase
    .from("sales_pipeline_email_templates")
    .select("id")
    .eq("name", TEMPLATE_NAME)
    .limit(1);

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from("sales_pipeline_email_templates")
      .update({ subject: TEMPLATE_SUBJECT, body_html: TEMPLATE_BODY, updated_at: new Date().toISOString() })
      .eq("id", existing[0].id);
    if (error) throw error;
    console.log(`  ✓ Updated existing template "${TEMPLATE_NAME}"`);
  } else {
    const { error } = await supabase.from("sales_pipeline_email_templates").insert({
      name: TEMPLATE_NAME,
      subject: TEMPLATE_SUBJECT,
      body_html: TEMPLATE_BODY,
      description: "Marketing welcome email served at /template. Personalized via {{org.name}}.",
    });
    if (error) throw error;
    console.log(`  ✓ Seeded template "${TEMPLATE_NAME}"`);
  }

  console.log("\n✅ Done. Reload /admin/automations to see the template.");
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Setup error:", err);
    process.exit(1);
  });
}

module.exports = {
  buildEmailHtml,
  TEMPLATE_NAME,
  TEMPLATE_SUBJECT,
  TEMPLATE_BODY,
  MIGRATION_PATH,
};
