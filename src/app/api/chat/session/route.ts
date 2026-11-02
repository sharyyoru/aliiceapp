import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendSystemEmailUnified } from "@/lib/email";

const NOTIFY_EMAIL = "info@aliice.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aliice.app";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function buildTranscriptHtml(transcript: { role: string; content: string }[]) {
  if (!transcript.length) return "<p><em>No messages recorded.</em></p>";
  return transcript
    .map(
      (m) =>
        `<div style="margin:8px 0;padding:8px 12px;border-radius:8px;background:${
          m.role === "user" ? "#f0f7ff" : "#f8fafc"
        };border-left:3px solid ${m.role === "user" ? "#0ea5e9" : "#6366f1"}">
          <strong style="color:${m.role === "user" ? "#0369a1" : "#4f46e5"};font-size:11px;text-transform:uppercase;letter-spacing:0.5px">${
            m.role === "user" ? "User" : "Aliice AI"
          }</strong>
          <p style="margin:4px 0 0;color:#334155;font-size:14px">${m.content.replace(/\n/g, "<br/>")}</p>
        </div>`
    )
    .join("");
}

// Shared: sends the "session ended" email for any session row
async function sendSessionEndEmail(session: {
  id: string;
  organization_id: string | null;
  organization_name: string | null;
  user_email: string | null;
  user_name: string | null;
  started_at: string;
  ended_at: string;
  message_count: number;
  transcript: { role: string; content: string }[];
  stale?: boolean;
}) {
  const orgLabel = session.organization_name ? ` (${session.organization_name})` : "";
  const durationMs = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
  const durationMins = Math.round(durationMs / 60000);
  const chatUrl = `${APP_URL}/admin/organizations${session.organization_id ? `/${session.organization_id}` : ""}`;
  const adminChatUrl = `${APP_URL}/admin/chat-logs?session=${session.id}`;
  const msgs = (session.transcript || []).filter((m) => m.role !== "system");
  const mc = session.message_count || msgs.filter((m) => m.role === "user").length;

  const icon = session.stale ? "⏱️" : "✅";
  const heading = session.stale ? `${icon} Chat Session Expired (No Proper Goodbye)` : `${icon} Live Chat Session Ended`;
  const headerColor = session.stale ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#10b981,#059669)";
  const headerTextColor = session.stale ? "#fef3c7" : "#d1fae5";

  await sendSystemEmailUnified({
    to: NOTIFY_EMAIL,
    subject: `${icon} Chat ${session.stale ? "Expired" : "Ended"}${orgLabel} — ${session.user_name || session.user_email || "Unknown"} (${mc} msg${mc !== 1 ? "s" : ""})`,
    html: `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:${headerColor};padding:24px 28px">
      <h2 style="margin:0;color:#fff;font-size:20px">${heading}</h2>
      <p style="margin:4px 0 0;color:${headerTextColor};font-size:14px">${fmtDateTime(session.ended_at)}</p>
      ${session.stale ? `<p style="margin:6px 0 0;color:${headerTextColor};font-size:12px">Session was inactive for 30+ minutes and auto-closed.</p>` : ""}
    </div>
    <div style="padding:24px 28px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#64748b;width:140px">User</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${session.user_name || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0;color:#1e293b">${session.user_email || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Organization</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${session.organization_name || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Duration</td><td style="padding:8px 0;color:#1e293b">${durationMins} minute${durationMins !== 1 ? "s" : ""}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Messages</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${mc} user message${mc !== 1 ? "s" : ""}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Session ID</td><td style="padding:8px 0;color:#94a3b8;font-size:12px">${session.id}</td></tr>
      </table>
      <div style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
        <h3 style="margin:0 0 12px;font-size:14px;color:#475569">Chat Transcript</h3>
        ${buildTranscriptHtml(msgs)}
      </div>
      <div style="margin-top:20px">
        <a href="${adminChatUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-right:8px">View Full Chat Log →</a>
        <a href="${chatUrl}" style="display:inline-block;background:#f1f5f9;color:#334155;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View Organization →</a>
      </div>
    </div>
  </div>
</body></html>`,
  });
}

// POST /api/chat/session
// action: "start" | "end"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, session_id, organization_id, organization_name, user_id, user_email, user_name, transcript } = body;

    if (action === "start") {
      const { data, error } = await supabaseAdmin
        .from("livechat_sessions")
        .insert({
          organization_id: organization_id || null,
          organization_name: organization_name || null,
          user_id: user_id || null,
          user_email: user_email || null,
          user_name: user_name || null,
          started_at: new Date().toISOString(),
          transcript: [],
          message_count: 0,
        })
        .select("id, started_at")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Notify info@aliice.app that a chat has started
      const orgLabel = organization_name ? ` (${organization_name})` : "";
      const chatUrl = `${APP_URL}/admin/organizations${organization_id ? `/${organization_id}` : ""}`;

      await sendSystemEmailUnified({
        to: NOTIFY_EMAIL,
        subject: `💬 Live Chat Started${orgLabel} — ${user_name || user_email || "Unknown user"}`,
        html: `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:24px 28px">
      <h2 style="margin:0;color:#fff;font-size:20px">💬 New Live Chat Session Started</h2>
      <p style="margin:4px 0 0;color:#e0f2fe;font-size:14px">${fmtDateTime(data.started_at)}</p>
    </div>
    <div style="padding:24px 28px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#64748b;width:140px">User</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${user_name || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0;color:#1e293b">${user_email || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Organization</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${organization_name || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Session ID</td><td style="padding:8px 0;color:#94a3b8;font-size:12px">${data.id}</td></tr>
      </table>
      <div style="margin-top:20px">
        <a href="${chatUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View Organization →</a>
      </div>
    </div>
  </div>
</body></html>`,
      });

      return NextResponse.json({ session_id: data.id });
    }

    if (action === "end") {
      if (!session_id) return NextResponse.json({ error: "session_id required" }, { status: 400 });

      const msgs: { role: string; content: string }[] = transcript || [];
      const messageCount = msgs.filter((m) => m.role === "user").length;

      const endedAt = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("livechat_sessions")
        .update({ ended_at: endedAt, transcript: msgs, message_count: messageCount })
        .eq("id", session_id)
        .select("id, organization_id, organization_name, user_email, user_name, started_at, ended_at, transcript")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await sendSessionEndEmail({ ...data, message_count: messageCount, stale: false });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[chat/session]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/chat/session  — close stale open sessions (called by cron)
export async function PATCH(req: NextRequest) {
  try {
    // Require a secret to prevent public abuse
    const secret = req.headers.get("x-cron-secret");
    if (secret !== (process.env.CRON_SECRET || "aliice-cron-2025")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staleThresholdMs = 30 * 60 * 1000; // 30 minutes
    const cutoff = new Date(Date.now() - staleThresholdMs).toISOString();

    // Find all open sessions started more than 30 mins ago
    const { data: staleSessions, error: fetchErr } = await supabaseAdmin
      .from("livechat_sessions")
      .select("id, organization_id, organization_name, user_email, user_name, started_at, message_count, transcript")
      .is("ended_at", null)
      .lt("started_at", cutoff);

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (!staleSessions || staleSessions.length === 0) return NextResponse.json({ closed: 0 });

    const endedAt = new Date().toISOString();
    const ids = staleSessions.map((s: { id: string }) => s.id);

    await supabaseAdmin
      .from("livechat_sessions")
      .update({ ended_at: endedAt })
      .in("id", ids);

    // Send notification for each stale session
    await Promise.allSettled(
      staleSessions.map((s: {
        id: string;
        organization_id: string | null;
        organization_name: string | null;
        user_email: string | null;
        user_name: string | null;
        started_at: string;
        message_count: number;
        transcript: { role: string; content: string }[];
      }) =>
        sendSessionEndEmail({
          ...s,
          ended_at: endedAt,
          stale: true,
        })
      )
    );

    return NextResponse.json({ closed: staleSessions.length, ids });
  } catch (err) {
    console.error("[chat/session PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET /api/chat/session?org_id=xxx  (admin use)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id");
  const session_id = searchParams.get("session_id");
  const limit = parseInt(searchParams.get("limit") || "50");

  let query = supabaseAdmin
    .from("livechat_sessions")
    .select("id, organization_id, organization_name, user_email, user_name, started_at, ended_at, message_count, transcript")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (org_id) query = query.eq("organization_id", org_id);
  if (session_id) query = query.eq("id", session_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data || [] });
}
