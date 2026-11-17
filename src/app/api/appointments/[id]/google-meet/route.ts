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

function appointmentOrgId(appt: AppointmentForMeet): string | null {
  return appt.organization_id || appt.patient?.organization_id || appt.provider?.organization_id || null;
}

function canAccess(appt: AppointmentForMeet, userId: string, orgIds: string[]): boolean {
  const orgId = appointmentOrgId(appt);
  if (orgId) return orgIds.includes(orgId);
  return orgIds.length === 0 && (!appt.google_event_owner || appt.google_event_owner === `user:${userId}`);
}

async function loadContext(request: NextRequest, id: string) {
  const userId = await getRequestUserId(request);
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data, error } = await supabaseAdmin.from("appointments").select(APPOINTMENT_MEET_SELECT).eq("id", id).maybeSingle();
  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!data) return { error: NextResponse.json({ error: "Appointment not found" }, { status: 404 }) };

  const appt = data as unknown as AppointmentForMeet;
  const orgIds = await getUserOrganizationIds(userId);
  if (!canAccess(appt, userId, orgIds)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  const ownerKey = await resolveOwnerKey(userId, appointmentOrgId(appt));
  return { appt, ownerKey, userId, orgIds };
}

/** Points same-slot sibling appointments (multi-doctor bookings) at the same Meet event. */
async function shareWithSiblings(
  primary: AppointmentForMeet,
  siblingIds: string[],
  userId: string,
  orgIds: string[],
  fields: { meet_link: string | null; google_event_id: string; google_event_owner: string }
): Promise<string[]> {
  if (siblingIds.length === 0) return [];
  const { data } = await supabaseAdmin.from("appointments").select(APPOINTMENT_MEET_SELECT).in("id", siblingIds);
  const shareable = ((data || []) as unknown as AppointmentForMeet[])
    .filter(
      (s) =>
        s.id !== primary.id &&
        !s.google_event_id &&
        s.start_time === primary.start_time &&
        appointmentOrgId(s) === appointmentOrgId(primary) &&
        canAccess(s, userId, orgIds)
    )
    .map((s) => s.id);
  if (shareable.length === 0) return [];
  const { error } = await supabaseAdmin.from("appointments").update(fields).in("id", shareable);
  if (error) throw new Error(error.message);
  return shareable;
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

  const body = (await request.json().catch(() => ({}))) as { invitePatient?: boolean; shareWithIds?: string[] };
  try {
    const result = await upsertAppointmentMeet(ctx.ownerKey, ctx.appt, body.invitePatient !== false);
    const sharedIds = await shareWithSiblings(
      ctx.appt,
      Array.isArray(body.shareWithIds) ? body.shareWithIds.filter((v) => typeof v === "string") : [],
      ctx.userId,
      ctx.orgIds,
      { meet_link: result.meetLink, google_event_id: result.eventId, google_event_owner: ctx.appt.google_event_owner || ctx.ownerKey }
    );
    return NextResponse.json({ ...result, sharedIds });
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
