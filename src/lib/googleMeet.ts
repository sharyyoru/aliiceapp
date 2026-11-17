/**
 * Google Meet video calls for clinic appointments.
 *
 * A clinic connects one Google account (per organization, or per user when the
 * user has no active organization). That account owns the Google Calendar
 * events that carry the Meet links. Reuses the Google OAuth client and the
 * redirect URI of the admin Gmail integration (see gmail.ts), so no extra
 * Google Cloud configuration is needed.
 */

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GOOGLE_OAUTH_REDIRECT_URI, isGmailConfigured, getGoogleEmail } from "@/lib/gmail";
import { createEvent, updateEvent, deleteEvent, type GoogleCalendarEvent } from "@/lib/googleCalendar";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const STATE_TTL_MS = 15 * 60 * 1000;

export const MEET_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

export const isGoogleMeetConfigured = isGmailConfigured;

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export async function getRequestUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
  ).auth.getUser(token);
  return data.user?.id ?? null;
}

export async function getUserOrganizationIds(userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("is_active", true);
  return (data || []).map((r: { organization_id: string }) => r.organization_id);
}

/** Connection owner: the user's organization, falling back to the user. */
export async function resolveOwnerKey(userId: string, organizationId?: string | null): Promise<string> {
  const orgIds = await getUserOrganizationIds(userId);
  if (organizationId && orgIds.includes(organizationId)) return `org:${organizationId}`;
  if (orgIds.length > 0) return `org:${orgIds[0]}`;
  return `user:${userId}`;
}

// ─── OAuth state (HMAC-signed so the owner can't be forged) ───────────────────
type MeetState = { k: "meet"; o: string; u: string; r: string; t: number; n: string };

/** Ties the OAuth flow to the browser that started it (blocks forwarded consent links). */
export const MEET_NONCE_COOKIE = "aliice_meet_nonce";

function sign(payload: string): string {
  return crypto.createHmac("sha256", GOOGLE_CLIENT_SECRET || "aliice").update(payload).digest("base64url");
}

export function createMeetState(ownerKey: string, userId: string, returnTo: string, nonce: string): string {
  const state: MeetState = { k: "meet", o: ownerKey, u: userId, r: returnTo, t: Date.now(), n: nonce };
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseMeetState(raw: string): MeetState | null {
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const state = JSON.parse(Buffer.from(payload, "base64url").toString()) as MeetState;
    if (state.k !== "meet" || Date.now() - state.t > STATE_TTL_MS) return null;
    return state;
  } catch {
    return null;
  }
}

export function getMeetAuthUrl(state: string, loginHint?: string): string {
  const url = new URL(OAUTH_AUTH_URL);
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", GOOGLE_OAUTH_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", MEET_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  if (loginHint) url.searchParams.set("login_hint", loginHint);
  return url.toString();
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, ...params }),
  });
  return (await res.json()) as TokenResponse;
}

/** Handles the OAuth callback for a Meet connection. Returns redirect target. */
export async function handleMeetCallback(
  origin: string,
  state: MeetState,
  code: string | null,
  oauthError: string | null,
  browserNonce: string | null
): Promise<URL> {
  const target = new URL(state.r || "/settings?tab=google-meet", origin);
  if (!state.n || !browserNonce || browserNonce !== state.n) {
    target.searchParams.set("meet", "error");
    target.searchParams.set("reason", "session_mismatch");
    return target;
  }
  if (oauthError || !code) {
    target.searchParams.set("meet", "error");
    target.searchParams.set("reason", oauthError || "missing_code");
    return target;
  }

  const tokens = await tokenRequest({
    code,
    redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  });
  if (!tokens.access_token) {
    target.searchParams.set("meet", "error");
    target.searchParams.set("reason", tokens.error || "token_exchange_failed");
    return target;
  }
  if (!tokens.scope?.includes("calendar.events")) {
    target.searchParams.set("meet", "error");
    target.searchParams.set("reason", "calendar_permission_not_granted");
    return target;
  }

  const googleEmail = await getGoogleEmail(tokens.access_token);
  const record: Record<string, unknown> = {
    owner_key: state.o,
    google_email: googleEmail || "unknown",
    access_token: tokens.access_token,
    token_expiry: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    scope: tokens.scope ?? null,
    connected_by: state.u,
    updated_at: new Date().toISOString(),
  };
  if (tokens.refresh_token) record.refresh_token = tokens.refresh_token;

  const { error } = await supabaseAdmin.from("google_meet_connections").upsert(record, { onConflict: "owner_key" });
  if (error) {
    console.error("[google-meet] failed to store connection:", error);
    target.searchParams.set("meet", "error");
    target.searchParams.set("reason", "storage_failed");
    return target;
  }
  target.searchParams.set("meet", "connected");
  return target;
}

// ─── Connection storage ───────────────────────────────────────────────────────
export type MeetConnection = {
  owner_key: string;
  google_email: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expiry: string | null;
  scope: string | null;
};

export async function getMeetConnection(ownerKey: string): Promise<MeetConnection | null> {
  const { data, error } = await supabaseAdmin
    .from("google_meet_connections")
    .select("owner_key, google_email, access_token, refresh_token, token_expiry, scope")
    .eq("owner_key", ownerKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MeetConnection) || null;
}

export async function deleteMeetConnection(ownerKey: string): Promise<void> {
  await supabaseAdmin.from("google_meet_connections").delete().eq("owner_key", ownerKey);
}

export async function getMeetAccessToken(ownerKey: string): Promise<string | null> {
  const conn = await getMeetConnection(ownerKey);
  if (!conn) return null;

  const now = Date.now();
  const expiry = conn.token_expiry ? new Date(conn.token_expiry).getTime() : 0;
  if (conn.access_token && expiry - 60_000 > now) return conn.access_token;
  if (!conn.refresh_token) return null;

  const refreshed = await tokenRequest({ refresh_token: conn.refresh_token, grant_type: "refresh_token" });
  if (!refreshed.access_token) {
    console.error("[google-meet] token refresh failed:", refreshed.error, refreshed.error_description);
    return null;
  }
  await supabaseAdmin
    .from("google_meet_connections")
    .update({
      access_token: refreshed.access_token,
      token_expiry: new Date(now + (refreshed.expires_in ?? 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("owner_key", ownerKey);
  return refreshed.access_token;
}

// ─── Appointment events ───────────────────────────────────────────────────────
export type AppointmentForMeet = {
  id: string;
  start_time: string;
  end_time: string | null;
  title?: string | null;
  reason?: string | null;
  notes?: string | null;
  organization_id?: string | null;
  meet_link?: string | null;
  google_event_id?: string | null;
  google_event_owner?: string | null;
  patient?: { first_name: string | null; last_name: string | null; email: string | null; organization_id?: string | null } | null;
  provider?: { organization_id?: string | null } | null;
};

function appointmentSummary(appt: AppointmentForMeet): string {
  const patientName = [appt.patient?.first_name, appt.patient?.last_name].filter(Boolean).join(" ");
  const base = (appt.title || appt.reason || "Appointment").replace(/\s*\[[^\]]*\]/g, "").trim() || "Appointment";
  return patientName ? `${base} – ${patientName}` : base;
}

function appointmentEnd(appt: AppointmentForMeet): string {
  if (appt.end_time) return appt.end_time;
  return new Date(new Date(appt.start_time).getTime() + 30 * 60 * 1000).toISOString();
}

/**
 * Creates (or re-syncs) the Google Calendar event with a Meet link for an
 * appointment. Returns the updated Meet fields.
 */
export async function upsertAppointmentMeet(
  ownerKey: string,
  appt: AppointmentForMeet,
  invitePatient: boolean
): Promise<{ meetLink: string | null; eventId: string; htmlLink: string | null }> {
  const accessToken = await getMeetAccessToken(appt.google_event_owner || ownerKey);
  if (!accessToken) throw new Error("GOOGLE_NOT_CONNECTED");

  const attendees = invitePatient && appt.patient?.email ? [appt.patient.email] : [];
  const input = {
    summary: appointmentSummary(appt),
    description: appt.notes || "Video consultation via Google Meet.",
    start: new Date(appt.start_time).toISOString(),
    end: new Date(appointmentEnd(appt)).toISOString(),
    timeZone: "Europe/Zurich",
    sendUpdates: (invitePatient ? "all" : "none") as "all" | "none",
  };

  let event: GoogleCalendarEvent | null = null;
  if (appt.google_event_id) {
    try {
      event = await updateEvent(accessToken, appt.google_event_id, {
        ...input,
        ...(attendees.length ? { attendees } : {}),
      });
    } catch (err) {
      // The event is not in the connected calendar (e.g. the clinic switched Google accounts): recreate it.
      if (!isEventGoneError(err)) throw err;
    }
  }
  if (!event) {
    event = await createEvent(accessToken, { ...input, attendees, addMeet: true });
  }

  const meetLink = event.hangoutLink || (appt.google_event_id === event.id ? appt.meet_link : null) || null;
  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      meet_link: meetLink,
      google_event_id: event.id,
      google_event_owner: appt.google_event_owner || ownerKey,
    })
    .eq("id", appt.id);
  if (error) throw new Error(error.message);

  return { meetLink, eventId: event.id, htmlLink: event.htmlLink || null };
}

function isEventGoneError(err: unknown): boolean {
  return err instanceof Error && /\((404|410)\)/.test(err.message);
}

export async function removeAppointmentMeet(ownerKey: string, appt: AppointmentForMeet): Promise<void> {
  if (appt.google_event_id) {
    const accessToken = await getMeetAccessToken(appt.google_event_owner || ownerKey);
    if (!accessToken) throw new Error("GOOGLE_NOT_CONNECTED");
    // Multi-doctor bookings share one event; only delete it once no other appointment uses it.
    const { count } = await supabaseAdmin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("google_event_id", appt.google_event_id)
      .neq("id", appt.id);
    if (!count) {
      try {
        await deleteEvent(accessToken, appt.google_event_id);
      } catch (err) {
        if (!isEventGoneError(err)) throw err;
      }
    }
  }
  const { error } = await supabaseAdmin
    .from("appointments")
    .update({ meet_link: null, google_event_id: null, google_event_owner: null })
    .eq("id", appt.id);
  if (error) throw new Error(error.message);
}

export const APPOINTMENT_MEET_SELECT =
  "id, start_time, end_time, title, reason, notes, status, organization_id, meet_link, google_event_id, google_event_owner, patient:patients(first_name, last_name, email, organization_id), provider:providers(organization_id)";

/**
 * Keeps an appointment's Google Calendar event in step after a server-side
 * change (reschedule / cancel). No-op for appointments without a Meet event.
 */
export async function syncAppointmentMeet(appointmentId: string): Promise<void> {
  try {
    const { data } = await supabaseAdmin
      .from("appointments")
      .select(APPOINTMENT_MEET_SELECT)
      .eq("id", appointmentId)
      .maybeSingle();
    const appt = data as unknown as (AppointmentForMeet & { status?: string | null }) | null;
    if (!appt?.google_event_id || !appt.google_event_owner) return;
    if (appt.status === "cancelled") {
      await removeAppointmentMeet(appt.google_event_owner, appt);
    } else {
      await upsertAppointmentMeet(appt.google_event_owner, appt, true);
    }
  } catch (err) {
    console.error("[google-meet] failed to sync appointment event:", appointmentId, err);
  }
}
