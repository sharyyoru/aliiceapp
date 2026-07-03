import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getValidAccessToken, getThreadMessages } from "@/lib/gmail";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function extractEmail(input: string): string {
  const m = input.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return (m ? m[0] : input).toLowerCase();
}

/**
 * Pull new messages from every Gmail thread we've started for this org and
 * store inbound replies in the emails table. Idempotent — messages already
 * recorded (by gmail_message_id) are skipped.
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("organization_id");
  if (!orgId) {
    return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
  }

  const gmail = await getValidAccessToken(session.email);
  if (!gmail) {
    return NextResponse.json({ synced: 0, connected: false });
  }

  const supabase = getSupabaseAdmin();

  // Existing Gmail thread ids for this org + already-stored message ids.
  const { data: rows } = await supabase
    .from("emails")
    .select("gmail_thread_id, gmail_message_id")
    .eq("organization_id", orgId)
    .not("gmail_thread_id", "is", null);

  const threadIds = Array.from(new Set((rows || []).map((r) => r.gmail_thread_id).filter(Boolean))) as string[];
  const knownMessageIds = new Set((rows || []).map((r) => r.gmail_message_id).filter(Boolean) as string[]);

  const myEmail = gmail.googleEmail.toLowerCase();
  let synced = 0;

  for (const threadId of threadIds) {
    // eslint-disable-next-line no-await-in-loop
    const messages = await getThreadMessages(gmail.accessToken, threadId);
    for (const msg of messages) {
      if (knownMessageIds.has(msg.id)) continue;
      const fromEmail = extractEmail(msg.from);
      const isInbound = fromEmail !== myEmail;
      if (!isInbound) {
        // Our own sent copy that wasn't recorded — mark known and skip.
        knownMessageIds.add(msg.id);
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const { error } = await supabase.from("emails").insert({
        organization_id: orgId,
        to_address: extractEmail(msg.to) || myEmail,
        from_address: msg.from,
        subject: msg.subject,
        body: msg.html,
        direction: "inbound",
        status: "received",
        provider: "gmail",
        gmail_message_id: msg.id,
        gmail_thread_id: msg.threadId,
        rfc822_message_id: msg.rfc822MessageId,
        sent_at: msg.date,
      });
      if (!error) {
        knownMessageIds.add(msg.id);
        synced += 1;
      } else {
        console.error("[org emails sync] insert error:", error.message);
      }
    }
  }

  return NextResponse.json({ synced, connected: true, threads: threadIds.length });
}
