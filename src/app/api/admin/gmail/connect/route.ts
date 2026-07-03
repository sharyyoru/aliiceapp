import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getAuthUrl, isGmailConfigured } from "@/lib/gmail";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isGmailConfigured()) {
    return NextResponse.json(
      { error: "Gmail is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo") || "/admin/organizations";

  // Encode the admin email + return path in state (also used for CSRF continuity).
  const state = Buffer.from(JSON.stringify({ e: session.email, r: returnTo })).toString("base64url");
  return NextResponse.redirect(getAuthUrl(state));
}
