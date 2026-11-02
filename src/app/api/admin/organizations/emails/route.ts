import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import {
  sendEmail,
  isEmailConfigured,
  sanitizeTelLinks,
  addTrackingPixel,
} from "@/lib/email";
import { getValidAccessToken, sendGmailMessage } from "@/lib/gmail";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://maison-toa-dk99.vercel.app";
const REPLY_DOMAIN = process.env.EMAIL_REPLY_DOMAIN || "aliice.app";
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || "noreply@aliice.app";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "ALiice";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Convert a plain-text body into simple HTML while leaving existing HTML intact.
function toHtml(input: string): string {
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(input);
  if (looksLikeHtml) return input;
  const escaped = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\r?\n/g)
    .map((line) => (line.length === 0 ? "<br />" : line))
    .join("<br />");
}

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("organization_id");
  if (!orgId) {
    return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
  }

  const q = (searchParams.get("q") || "").trim();
  const direction = (searchParams.get("direction") || "").trim(); // inbound | outbound
  const statusParam = (searchParams.get("status") || "").trim(); // sent | read | failed | queued | received

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("emails")
    .select("id, direction, status, subject, to_address, cc_addresses, bcc_addresses, from_address, body, attachments, scheduled_for, sent_at, read_at, created_at, provider, gmail_thread_id, rfc822_message_id")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (direction) query = query.eq("direction", direction);
  if (statusParam) query = query.eq("status", statusParam);
  if (q) {
    const safe = q.replace(/[%,]/g, " ");
    query = query.or(
      `subject.ilike.%${safe}%,to_address.ilike.%${safe}%,from_address.ilike.%${safe}%,body.ilike.%${safe}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[org emails] fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails", details: error.message, code: error.code },
      { status: 500 }
    );
  }

  const emails = data || [];
  const stats = {
    total: emails.length,
    sent: emails.filter((e) => e.direction === "outbound").length,
    received: emails.filter((e) => e.direction === "inbound").length,
    read: emails.filter((e) => e.direction === "outbound" && (e.status === "read" || e.read_at)).length,
  };

  return NextResponse.json({ emails, stats });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    organization_id,
    to,
    cc,
    bcc,
    subject,
    html,
    attachments,
    scheduledFor,
    inReplyToEmailId,
  } = body as {
    organization_id?: string;
    to?: string;
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    html?: string;
    attachments?: Array<{ filename: string; content: string; contentType: string }>;
    scheduledFor?: string;
    inReplyToEmailId?: string;
  };

  if (!organization_id) {
    return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Resolve recipient: explicit `to`, else the organization's email.
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, email")
    .eq("id", organization_id)
    .single();

  const recipient = (to || org?.email || "").trim();
  const trimmedSubject = (subject || "").trim();
  const trimmedHtml = (html || "").trim();

  const normalizeList = (e?: string | string[]) => {
    if (!e) return [] as string[];
    return (Array.isArray(e) ? e : [e]).map((s) => s.trim()).filter(Boolean);
  };
  const ccList = normalizeList(cc);
  const bccList = normalizeList(bcc);
  const attachmentList = attachments || [];

  if (!recipient) {
    return NextResponse.json({ error: "No recipient — set an email on the organization or provide one" }, { status: 400 });
  }
  if (!trimmedSubject || !trimmedHtml) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const bodyHtml = sanitizeTelLinks(toHtml(trimmedHtml));
  const nowIso = new Date().toISOString();
  const scheduleTime = scheduledFor ? new Date(scheduledFor).toISOString() : null;
  const isScheduled = !!scheduleTime && new Date(scheduleTime).getTime() > Date.now();

  // Thread context when this is a reply.
  let threadId: string | null = null;
  let inReplyToRfc: string | null = null;
  if (inReplyToEmailId) {
    const { data: orig } = await supabase
      .from("emails")
      .select("gmail_thread_id, rfc822_message_id")
      .eq("id", inReplyToEmailId)
      .maybeSingle();
    threadId = orig?.gmail_thread_id ?? null;
    inReplyToRfc = orig?.rfc822_message_id ?? null;
  }

  // Prefer the logged-in admin's connected Gmail; fall back to Resend.
  const gmail = await getValidAccessToken(session.email);
  const fromAddress = gmail?.googleEmail || FROM_ADDRESS;

  // 1. Log the email first so we have an id for the open-tracking pixel.
  const { data: inserted, error: insertError } = await supabase
    .from("emails")
    .insert({
      organization_id,
      to_address: recipient,
      cc_addresses: ccList,
      bcc_addresses: bccList,
      from_address: fromAddress,
      admin_email: session.email,
      subject: trimmedSubject,
      body: bodyHtml,
      attachments: attachmentList,
      direction: "outbound",
      status: isScheduled ? "scheduled" : "sending",
      scheduled_for: isScheduled ? scheduleTime : null,
      sent_at: isScheduled ? null : nowIso,
      provider: gmail ? "gmail" : "resend",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[org emails] insert error:", insertError);
    return NextResponse.json({ error: "Failed to record email" }, { status: 500 });
  }

  const emailId = inserted.id as string;

  // Scheduled emails are queued for the cron job; nothing to send now.
  if (isScheduled) {
    return NextResponse.json({ ok: true, emailId, status: "scheduled", scheduledFor: scheduleTime });
  }

  const trackedHtml = addTrackingPixel(bodyHtml, emailId, APP_URL);

  // ── Gmail path (from the admin's real address) ──
  if (gmail) {
    const sendResult = await sendGmailMessage(gmail.accessToken, {
      from: gmail.googleEmail,
      to: recipient,
      cc: ccList,
      bcc: bccList,
      subject: trimmedSubject,
      html: trackedHtml,
      attachments: attachmentList.map((a) => ({
        filename: a.filename,
        content: a.content,
        encoding: "base64" as const,
        contentType: a.contentType || "application/octet-stream",
      })),
      threadId,
      inReplyTo: inReplyToRfc,
    });

    if (!sendResult.ok) {
      await supabase.from("emails").update({ status: "failed" }).eq("id", emailId);
      return NextResponse.json({ error: sendResult.error || "Failed to send via Gmail", emailId }, { status: 502 });
    }

    await supabase
      .from("emails")
      .update({
        status: "sent",
        gmail_message_id: sendResult.messageId ?? null,
        gmail_thread_id: sendResult.threadId ?? null,
        rfc822_message_id: sendResult.rfc822MessageId ?? null,
      })
      .eq("id", emailId);

    return NextResponse.json({ ok: true, emailId, provider: "gmail", threadId: sendResult.threadId });
  }

  // ── Resend fallback ──
  if (!isEmailConfigured()) {
    await supabase.from("emails").update({ status: "failed" }).eq("id", emailId);
    return NextResponse.json(
      { error: "No sending method available. Connect Gmail or configure Resend.", emailId },
      { status: 503 }
    );
  }

  const replyTo = `reply+${emailId}@${REPLY_DOMAIN}`;
  const result = await sendEmail({
    to: recipient,
    cc: ccList,
    bcc: bccList,
    subject: trimmedSubject,
    html: trackedHtml,
    from: FROM_ADDRESS,
    fromName: FROM_NAME,
    replyTo,
    attachments: attachmentList.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType || "application/octet-stream",
    })),
    tags: [{ name: "email_id", value: emailId }, { name: "organization_id", value: organization_id }],
  });

  if (!result.success) {
    await supabase.from("emails").update({ status: "failed" }).eq("id", emailId);
    return NextResponse.json({ error: result.error || "Failed to send email", emailId }, { status: 502 });
  }

  await supabase.from("emails").update({ status: "sent" }).eq("id", emailId);
  return NextResponse.json({ ok: true, emailId, provider: "resend", messageId: result.messageId });
}
