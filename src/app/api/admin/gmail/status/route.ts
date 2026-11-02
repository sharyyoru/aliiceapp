import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getGmailAccount, isGmailConfigured } from "@/lib/gmail";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGmailConfigured()) {
    return NextResponse.json({ configured: false, connected: false });
  }

  const account = await getGmailAccount(session.email);
  return NextResponse.json({
    configured: true,
    connected: !!(account && account.refresh_token),
    googleEmail: account?.google_email ?? null,
  });
}
