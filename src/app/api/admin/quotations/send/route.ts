import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { sendSystemEmail } from "@/lib/gmail";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { to, quoteNumber, clientName, pdfBase64, fileName, organizationId } = body as {
    to: string;
    quoteNumber: string;
    clientName: string;
    pdfBase64: string;
    fileName: string;
    organizationId?: string | null;
  };

  if (!to || !pdfBase64) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.07);">
        <tr><td style="background:#6d28d9;padding:28px 36px;">
          <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="100" style="display:block;margin:0 0 14px;" />
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Your Quotation is Ready</h1>
          <p style="margin:8px 0 0;color:#ddd6fe;font-size:14px;">${quoteNumber}</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
            Dear <strong>${clientName}</strong>,
          </p>
          <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.7;">
            Please find attached your quotation from Aliice. The PDF contains a detailed breakdown of all items and pricing in CHF, along with our terms and conditions.
          </p>
          <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.7;">
            If you have any questions or would like to discuss the proposal, please don't hesitate to reach out — we're happy to help.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0;">
            <tr><td style="background:#6d28d9;border-radius:10px;">
              <a href="mailto:hello@aliice.app" style="display:block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
                Reply to Discuss →
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">Aliice Computer Software Trading · Dubai, UAE · hello@aliice.app</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const result = await sendSystemEmail({
    to,
    subject: `Quotation ${quoteNumber} from Aliice`,
    html,
    replyTo: "hello@aliice.app",
    attachments: [{ filename: fileName, content: pdfBase64, encoding: "base64", contentType: "application/pdf" }],
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Failed to send quotation" }, { status: 502 });
  }

  // Log to org emails table if org is linked
  if (organizationId) {
    try {
      const supabase = getSupabase();
      await supabase.from("emails").insert({
        organization_id: organizationId,
        to_address: to,
        from_address: process.env.SYSTEM_GMAIL_ADMIN_EMAIL || "info@aliice.app",
        subject: `Quotation ${quoteNumber} from Aliice`,
        body: html,
        direction: "outbound",
        status: "sent",
        sent_at: new Date().toISOString(),
        provider: "gmail",
      });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
