import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email";

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

      await sendEmail({
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

      const { data, error } = await supabaseAdmin
        .from("livechat_sessions")
        .update({
          ended_at: new Date().toISOString(),
          transcript: msgs,
          message_count: messageCount,
        })
        .eq("id", session_id)
        .select("id, organization_id, organization_name, user_email, user_name, started_at, ended_at")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const orgLabel = data.organization_name ? ` (${data.organization_name})` : "";
      const durationMs = data.ended_at
        ? new Date(data.ended_at).getTime() - new Date(data.started_at).getTime()
        : 0;
      const durationMins = Math.round(durationMs / 60000);
      const chatUrl = `${APP_URL}/admin/organizations${data.organization_id ? `/${data.organization_id}` : ""}`;
      const adminChatUrl = `${APP_URL}/admin/chat-logs?session=${session_id}`;

      await sendEmail({
        to: NOTIFY_EMAIL,
        subject: `✅ Live Chat Ended${orgLabel} — ${data.user_name || data.user_email || "Unknown"} (${messageCount} messages)`,
        html: `
<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px 28px">
      <h2 style="margin:0;color:#fff;font-size:20px">✅ Live Chat Session Ended</h2>
      <p style="margin:4px 0 0;color:#d1fae5;font-size:14px">${fmtDateTime(data.ended_at!)}</p>
    </div>
    <div style="padding:24px 28px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#64748b;width:140px">User</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${data.user_name || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0;color:#1e293b">${data.user_email || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Organization</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${data.organization_name || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Duration</td><td style="padding:8px 0;color:#1e293b">${durationMins} minute${durationMins !== 1 ? "s" : ""}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Messages</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${messageCount} user message${messageCount !== 1 ? "s" : ""}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Session ID</td><td style="padding:8px 0;color:#94a3b8;font-size:12px">${data.id}</td></tr>
      </table>
      
      <div style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
        <h3 style="margin:0 0 12px;font-size:14px;color:#475569">Chat Transcript</h3>
        ${buildTranscriptHtml(msgs)}
      </div>

      <div style="margin-top:20px;display:flex;gap:12px">
        <a href="${adminChatUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View Full Chat Log →</a>
        <a href="${chatUrl}" style="display:inline-block;background:#f1f5f9;color:#334155;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View Organization →</a>
      </div>
    </div>
  </div>
</body></html>`,
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[chat/session]", err);
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
