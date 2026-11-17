import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  createMeetState,
  getMeetAuthUrl,
  getRequestUserId,
  isGoogleMeetConfigured,
  MEET_NONCE_COOKIE,
  resolveOwnerKey,
} from "@/lib/googleMeet";

/** Returns the Google consent URL; the client then navigates to it. */
export async function POST(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isGoogleMeetConfigured()) {
    return NextResponse.json(
      { error: "Google is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string | null;
    returnTo?: string;
    loginHint?: string;
  };
  const returnTo =
    body.returnTo && body.returnTo.startsWith("/") && !body.returnTo.startsWith("//")
      ? body.returnTo
      : "/settings?tab=google-meet";

  const ownerKey = await resolveOwnerKey(userId, body.organizationId);
  const nonce = crypto.randomUUID();
  const state = createMeetState(ownerKey, userId, returnTo, nonce);
  const response = NextResponse.json({ url: getMeetAuthUrl(state, body.loginHint) });
  response.cookies.set(MEET_NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/gmail/callback",
    maxAge: 15 * 60,
  });
  return response;
}
