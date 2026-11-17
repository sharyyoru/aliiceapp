import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getRequestUserId,
  getUserOrganizationIds,
  removeAppointmentMeet,
  resolveOwnerKey,
  upsertAppointmentMeet,
  APPOINTMENT_MEET_SELECT,
  type AppointmentForMeet,
} from "@/lib/googleMeet";

async function loadContext(request: NextRequest, id: string) {
  const userId = await getRequestUserId(request);
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data, error } = await supabaseAdmin.from("appointments").select(APPOINTMENT_MEET_SELECT).eq("id", id).maybeSingle();
  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!data) return { error: NextResponse.json({ error: "Appointment not found" }, { status: 404 }) };

  const appt = data as unknown as AppointmentForMeet;
  const orgId = appt.organization_id || appt.patient?.organization_id || null;
  const orgIds = await getUserOrganizationIds(userId);
  const forbidden = orgId
    ? !orgIds.includes(orgId)
    : orgIds.length > 0 || (!!appt.google_event_owner && appt.google_event_owner !== `user:${userId}`);
  if (forbidden) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  const ownerKey = await resolveOwnerKey(userId, orgId);
  return { appt, ownerKey };
}

function errorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : "Google Meet request failed";
  if (message === "GOOGLE_NOT_CONNECTED") {
    return NextResponse.json(
      { error: "Google Meet is not connected. Connect a Google account in Settings → Google Meet.", code: "not_connected" },
      { status: 409 }
    );
  }
  console.error("[google-meet] appointment error:", err);
  return NextResponse.json({ error: message }, { status: 502 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadContext(request, id);
  if ("error" in ctx) return ctx.error;
  return NextResponse.json({ meetLink: ctx.appt.meet_link ?? null, eventId: ctx.appt.google_event_id ?? null });
}

/** Create the Meet link (or re-sync the existing event with the appointment's time). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadContext(request, id);
  if ("error" in ctx) return ctx.error;

  const body = (await request.json().catch(() => ({}))) as { invitePatient?: boolean };
  try {
    const result = await upsertAppointmentMeet(ctx.ownerKey, ctx.appt, body.invitePatient !== false);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadContext(request, id);
  if ("error" in ctx) return ctx.error;
  try {
    await removeAppointmentMeet(ctx.ownerKey, ctx.appt);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
