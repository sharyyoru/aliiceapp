import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail as sendEmailViaResend, isEmailConfigured, isResendConfigured } from "@/lib/email";
import { getValidAccessToken, sendGmailMessage } from "@/lib/gmail";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://maison-toa-dk99.vercel.app";
const REPLY_DOMAIN = process.env.EMAIL_REPLY_DOMAIN || "aliice.app";
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || "noreply@aliice.app";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "ALiice";

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

type AttachmentRow = { filename: string; content: string; contentType?: string };
type EmailRow = {
  id: string;
  organization_id: string | null;
  to_address: string;
  cc_addresses: string[] | null;
  bcc_addresses: string[] | null;
  from_address: string;
  admin_email: string | null;
  subject: string;
  body: string;
  attachments: AttachmentRow[] | null;
  provider: string | null;
  gmail_thread_id: string | null;
  rfc822_message_id: string | null;
};

import { addTrackingPixel } from "@/lib/email";

async function sendEmail(email: EmailRow): Promise<{ ok: boolean; error?: string; messageId?: string; threadId?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const cc = email.cc_addresses || [];
  const bcc = email.bcc_addresses || [];
  const attachments = (email.attachments || []).map((a) => ({
    filename: a.filename,
    content: a.content,
    contentType: a.contentType || "application/octet-stream",
  }));

  // Try to send from the original admin's connected Gmail.
  const adminEmail = email.admin_email || process.env.SYSTEM_GMAIL_ADMIN_EMAIL || "info@aliice.app";
  const gmail = await getValidAccessToken(adminEmail);

  if (gmail) {
    const trackedHtml = addTrackingPixel(email.body, email.id, APP_URL);
    const sendResult = await sendGmailMessage(gmail.accessToken, {
      from: gmail.googleEmail,
      to: email.to_address,
      cc,
      bcc,
      subject: email.subject,
      html: trackedHtml,
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        encoding: "base64" as const,
        contentType: a.contentType,
      })),
      threadId: email.gmail_thread_id,
      inReplyTo: email.rfc822_message_id,
    });
    return sendResult.ok
      ? { ok: true, messageId: sendResult.messageId, threadId: sendResult.threadId }
      : { ok: false, error: sendResult.error || "Gmail send failed" };
  }

  // Resend fallback.
  if (!isEmailConfigured()) {
    return { ok: false, error: "No sending method available" };
  }

  const replyTo = `reply+${email.id}@${REPLY_DOMAIN}`;
  const trackedHtml = addTrackingPixel(email.body, email.id, APP_URL);
  const result = await sendEmailViaResend({
    to: email.to_address,
    cc,
    bcc,
    subject: email.subject,
    html: trackedHtml,
    from: FROM_ADDRESS,
    fromName: FROM_NAME,
    replyTo,
    attachments,
    tags: [{ name: "email_id", value: email.id }, { name: "organization_id", value: email.organization_id || "" }],
  });

  return result.success
    ? { ok: true, messageId: result.messageId }
    : { ok: false, error: result.error || "Resend send failed" };
}

export async function GET(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pending scheduled emails that are due (scheduled_for <= now)
    const now = new Date().toISOString();
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("emails")
      .select(
        "id, organization_id, to_address, cc_addresses, bcc_addresses, from_address, admin_email, subject, body, attachments, provider, gmail_thread_id, rfc822_message_id"
      )
      .eq("direction", "outbound")
      .eq("status", "scheduled")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("Error fetching scheduled emails:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch scheduled emails", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ message: "No pending emails to send", sent: 0 });
    }

    console.log(`Processing ${pendingEmails.length} scheduled emails`);

    let sentCount = 0;
    let failedCount = 0;

    // Process emails one at a time to avoid token race conditions.
    for (const email of pendingEmails as EmailRow[]) {
      await supabase.from("emails").update({ status: "sending" }).eq("id", email.id);
      const result = await sendEmail(email);

      if (result.ok) {
        await supabase
          .from("emails")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            gmail_message_id: result.messageId ?? null,
            gmail_thread_id: result.threadId ?? email.gmail_thread_id ?? null,
          })
          .eq("id", email.id);
        sentCount++;
      } else {
        await supabase
          .from("emails")
          .update({ status: "failed", body: `${email.body}\n\n[send error]: ${result.error || "unknown"}` })
          .eq("id", email.id);
        failedCount++;
      }
    }

    console.log(`Scheduled emails processed: ${sentCount} sent, ${failedCount} failed`);

    return NextResponse.json({
      message: "Scheduled emails processed",
      sent: sentCount,
      failed: failedCount,
      total: pendingEmails.length,
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility with different cron providers
export async function POST(request: Request) {
  return GET(request);
}
