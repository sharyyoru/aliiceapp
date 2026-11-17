import { NextResponse } from "next/server";
import { deleteMeetConnection, getRequestUserId, resolveOwnerKey } from "@/lib/googleMeet";

export async function POST(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { organizationId?: string | null };
  const ownerKey = await resolveOwnerKey(userId, body.organizationId);
  await deleteMeetConnection(ownerKey);
  return NextResponse.json({ ok: true });
}
