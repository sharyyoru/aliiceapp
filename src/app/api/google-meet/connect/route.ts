import { NextResponse } from "next/server";
import {
  createMeetState,
  getMeetAuthUrl,
  getRequestUserId,
  isGoogleMeetConfigured,
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
  const state = createMeetState(ownerKey, userId, returnTo);
  return NextResponse.json({ url: getMeetAuthUrl(state, body.loginHint) });
}
