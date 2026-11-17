import { NextResponse } from "next/server";
import {
  getMeetConnection,
  getRequestUserId,
  isGoogleMeetConfigured,
  resolveOwnerKey,
} from "@/lib/googleMeet";

export async function GET(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isGoogleMeetConfigured()) {
    return NextResponse.json({ configured: false, connected: false });
  }

  const orgId = new URL(request.url).searchParams.get("organizationId");
  const ownerKey = await resolveOwnerKey(userId, orgId);
  try {
    const conn = await getMeetConnection(ownerKey);
    return NextResponse.json({
      configured: true,
      connected: !!conn?.refresh_token,
      googleEmail: conn?.google_email ?? null,
      scope: ownerKey.startsWith("org:") ? "organization" : "user",
    });
  } catch (err) {
    return NextResponse.json(
      { configured: true, connected: false, error: err instanceof Error ? err.message : "Failed to load connection" },
      { status: 500 }
    );
  }
}
