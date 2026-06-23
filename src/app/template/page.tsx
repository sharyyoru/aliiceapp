"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Download,
  Monitor,
  Smartphone,
  Mail,
  Code2,
} from "lucide-react";

const PRIMARY_CTA_URL = "https://www.aliice.app/register";
const DEMO_CTA_URL = "https://www.aliice.app/contact";
const LOGO_URL = "https://www.aliice.app/logos/aliice-logo.png";

/**
 * Email-client-safe HTML (table based, inline styles).
 * This is the exact markup you can paste into your ESP (Mailchimp,
 * Brevo, HubSpot, Resend, etc.).
 */
function buildEmailHtml({ clinicName }: { clinicName: string }) {
  const greetingName = clinicName.trim() ? clinicName.trim() : "there";
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
  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;font-size:1px;line-height:1px;">
    Replace your CRM, ERP &amp; booking system with one platform — and save 49%. The Aliice mobile app is coming soon.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">

          <!-- Header / Logo -->
          <tr>
            <td class="px" style="padding:28px 40px 12px 40px;" align="left">
              <img src="${LOGO_URL}" alt="Aliice" width="120" style="display:block;height:auto;border:0;outline:none;" />
            </td>
          </tr>

          <!-- Hero -->
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

          <!-- Primary CTA -->
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

          <!-- Stats row -->
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

          <!-- Features -->
          <tr>
            <td class="px" style="padding:36px 40px 8px 40px;">
              <h2 style="margin:0 0 6px 0;font-size:20px;font-weight:700;color:#0f172a;">Everything your clinic needs</h2>
              <p style="margin:0 0 20px 0;font-size:14px;color:#64748b;">Replace your patchwork of tools with a single, beautiful platform.</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 18px 0;">
                    ${featureCell("🗂️", "Patient Management", "Records, history &amp; treatment tracking in one place.")}
                  </td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 18px 10px;">
                    ${featureCell("📅", "Smart Scheduling", "Online booking with automated reminders.")}
                  </td>
                </tr>
                <tr>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 18px 0;">
                    ${featureCell("🤖", "AI Medical Scribe", "Voice consultations turned into SOAP notes.")}
                  </td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 18px 10px;">
                    ${featureCell("💳", "Billing &amp; Invoicing", "Insurance-ready billing with fewer errors.")}
                  </td>
                </tr>
                <tr>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 10px 0 0;">
                    ${featureCell("💬", "Omnichannel Messaging", "Email, SMS &amp; WhatsApp from one inbox.")}
                  </td>
                  <td class="feature-td" width="50%" valign="top" style="padding:0 0 0 10px;">
                    ${featureCell("📊", "Analytics &amp; Reports", "Real-time insight into revenue &amp; growth.")}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- App coming soon banner -->
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

          <!-- Why switch checklist -->
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

          <!-- Closing CTA -->
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

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;" align="center">
              <p style="margin:0;font-size:13px;color:#64748b;">Aliice Computer Software Trading</p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#94a3b8;">Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE</p>
              <p style="margin:14px 0 0 0;font-size:12px;color:#94a3b8;">
                <a href="https://www.aliice.app" target="_blank" style="color:#0284c7;">aliice.app</a>
                &nbsp;&bull;&nbsp;
                <a href="{{unsubscribe}}" target="_blank" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
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

function featureCell(emoji: string, title: string, desc: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #eef2f7;border-radius:14px;">
    <tr><td style="padding:18px 18px;">
      <div style="font-size:22px;line-height:22px;">${emoji}</div>
      <div style="margin-top:10px;font-size:15px;font-weight:700;color:#0f172a;">${title}</div>
      <div style="margin-top:4px;font-size:13px;line-height:20px;color:#64748b;">${desc}</div>
    </td></tr>
  </table>`;
}

function checkItem(text: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="28" valign="top" style="padding:0 0 12px 0;">
      <div style="width:20px;height:20px;border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);color:#ffffff;font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
    </td>
    <td valign="top" style="padding:0 0 12px 0;font-size:14px;line-height:20px;color:#334155;">${text}</td>
  </tr></table>`;
}

function buildPlainText({ clinicName }: { clinicName: string }) {
  const greetingName = clinicName.trim() ? clinicName.trim() : "there";
  return `Hi ${greetingName},

Juggling separate tools for bookings, patient records, billing and marketing is costing you time and money.

Aliice replaces 3+ systems with ONE all-in-one platform — and clinics save up to 49% on software costs.

Everything your clinic needs:
- Patient Management — records, history & treatment tracking
- Smart Scheduling — online booking with automated reminders
- AI Medical Scribe — voice consultations turned into SOAP notes
- Billing & Invoicing — insurance-ready billing
- Omnichannel Messaging — Email, SMS & WhatsApp
- Analytics & Reports — real-time insight into revenue & growth

Why clinics switch to Aliice:
- Save up to 49% vs. separate CRM, ERP & booking tools
- Purpose-built for aesthetic & medical clinics
- AI Medical Scribe included — reclaim 2+ hours a day
- GDPR compliant & securely hosted
- Flexible month-to-month pricing

COMING SOON: The Aliice mobile app (iOS & Android). Get on the platform today and be first in line.

Start your free trial: ${PRIMARY_CTA_URL}
Book a demo: ${DEMO_CTA_URL}

No credit card required • 14-day free trial.

Questions? Just reply to this email.

Aliice Computer Software Trading
Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263, Dubai, UAE
https://www.aliice.app`;
}

export default function EmailTemplatePage() {
  const [clinicName, setClinicName] = useState("");
  const [subject, setSubject] = useState(
    "Run your whole clinic on one platform — and save 49%"
  );
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState<"html" | "text" | "subject" | null>(null);

  const emailHtml = useMemo(() => buildEmailHtml({ clinicName }), [clinicName]);
  const plainText = useMemo(() => buildPlainText({ clinicName }), [clinicName]);

  const handleCopy = async (type: "html" | "text" | "subject") => {
    const value =
      type === "html" ? emailHtml : type === "text" ? plainText : subject;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const blob = new Blob([emailHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aliice-marketing-email.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 leading-tight">
                Marketing Email Template
              </h1>
              <p className="text-xs text-slate-500">Clinic conversion campaign</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition ${
                  viewMode === "desktop"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Monitor className="w-4 h-4" /> Desktop
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition ${
                  viewMode === "mobile"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Smartphone className="w-4 h-4" /> Mobile
              </button>
            </div>

            <button
              onClick={() => handleCopy("html")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition"
            >
              {copied === "html" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Code2 className="w-4 h-4" />
              )}
              {copied === "html" ? "Copied!" : "Copy HTML"}
            </button>
            <button
              onClick={() => handleCopy("text")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              {copied === "text" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied === "text" ? "Copied!" : "Copy Text"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4" /> .html
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar controls */}
        <aside className="space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Personalize
            </h2>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Clinic name
            </label>
            <input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="e.g. Bella Aesthetics"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Used in the greeting. Leave blank for a generic &ldquo;Hi
              there&rdquo;.
            </p>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Subject line
              </h2>
              <button
                onClick={() => handleCopy("subject")}
                className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                {copied === "subject" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                Copy
              </button>
            </div>
            <textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
            />
            <p className="mt-2 text-xs font-medium text-slate-500">
              Alternatives:
            </p>
            <ul className="mt-1 space-y-1.5">
              {[
                "The all-in-one platform built for clinics like yours",
                "Cut your software bill by 49% — here's how",
                "Your clinic's CRM, booking & billing in one place",
              ].map((alt) => (
                <li key={alt}>
                  <button
                    onClick={() => setSubject(alt)}
                    className="text-left text-xs text-slate-600 hover:text-sky-700 hover:underline"
                  >
                    {alt}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-sky-50 to-violet-50 rounded-xl border border-sky-100 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              How to use
            </h2>
            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
              <li>Personalize the clinic name &amp; subject.</li>
              <li>
                Click <strong>Copy HTML</strong> and paste into your email tool
                (Brevo, Mailchimp, HubSpot, Resend).
              </li>
              <li>
                Or <strong>Copy Text</strong> for a plain-text version.
              </li>
              <li>
                Keep <code>{"{{unsubscribe}}"}</code> as your ESP&apos;s merge
                tag.
              </li>
            </ol>
          </div>
        </aside>

        {/* Preview */}
        <section>
          <div className="bg-white rounded-xl border p-3 mb-3 flex items-center gap-3 text-sm">
            <span className="text-slate-400 font-medium w-16 shrink-0">
              Subject
            </span>
            <span className="text-slate-900 font-medium truncate">
              {subject}
            </span>
          </div>

          <div className="flex justify-center">
            <div
              className="transition-all duration-300 w-full"
              style={{ maxWidth: viewMode === "mobile" ? 390 : 720 }}
            >
              <iframe
                title="Email preview"
                srcDoc={emailHtml}
                className="w-full rounded-xl border bg-white"
                style={{ height: "1500px" }}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
