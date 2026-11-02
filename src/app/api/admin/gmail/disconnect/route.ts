import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAdminSession } from "@/lib/adminSession";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Allow an admin to disconnect another admin's account by passing target_email.
  // Falls back to the current session's own email.
  let targetEmail = session.email;
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.target_email && typeof body.target_email === "string") {
      targetEmail = body.target_email.trim();
    }
  } catch { /* no body */ }

  await supabaseAdmin.from("admin_gmail_accounts").delete().eq("admin_email", targetEmail);
  return NextResponse.json({ ok: true, disconnected: targetEmail });
}
