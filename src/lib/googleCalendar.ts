/**
 * Google Calendar integration for the admin Agenda.
 *
 * Reuses the per-admin Google OAuth connection stored in `admin_gmail_accounts`
 * (see gmail.ts). The same connection now also carries the calendar.events
 * scope, so we can list/create/update/delete events and mint Google Meet links.
 *
 * Uses plain fetch — no googleapis dependency required.
 */

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getValidAccessToken, hasCalendarScope } from "@/lib/gmail";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// ─── Types ──────────────────────────────────────────────────────────────────
export type GoogleEventDateTime = {
  date?: string; // all-day (YYYY-MM-DD)
  dateTime?: string; // timed (RFC3339)
  timeZone?: string;
};

export type GoogleCalendarEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  hangoutLink?: string;
  htmlLink?: string;
  attendees?: { email: string; responseStatus?: string; displayName?: string }[];
  organizer?: { email?: string; displayName?: string };
  conferenceData?: unknown;
};

// A normalized event enriched with the owner admin (for the aggregate view).
export type AgendaEvent = {
  id: string;
  ownerEmail: string; // admin_email that owns this calendar
  ownerGoogleEmail: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
  meetLink: string | null;
  htmlLink: string | null;
  attendees: { email: string; responseStatus?: string }[];
};

// ─── Reading ──────────────────────────────────────────────────────────────────
export async function listEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  const url = new URL(`${CALENDAR_API}/calendars/primary/events`);
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "2500");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Calendar list failed (${res.status}): ${err}`);
  }
  const data = (await res.json()) as { items?: GoogleCalendarEvent[] };
  return data.items || [];
}

function normalizeEvent(
  raw: GoogleCalendarEvent,
  ownerEmail: string,
  ownerGoogleEmail: string
): AgendaEvent {
  const allDay = !!raw.start?.date && !raw.start?.dateTime;
  const start = raw.start?.dateTime || raw.start?.date || "";
  const end = raw.end?.dateTime || raw.end?.date || start;
  return {
    id: raw.id,
    ownerEmail,
    ownerGoogleEmail,
    title: raw.summary || "(no title)",
    description: raw.description || null,
    location: raw.location || null,
    start,
    end,
    allDay,
    meetLink: raw.hangoutLink || null,
    htmlLink: raw.htmlLink || null,
    attendees: (raw.attendees || []).map((a) => ({
      email: a.email,
      responseStatus: a.responseStatus,
    })),
  };
}

// ─── Connected admins (for the aggregate calendar) ────────────────────────────
export type ConnectedAdmin = {
  adminEmail: string;
  googleEmail: string;
  hasCalendar: boolean;
};

export async function listConnectedAdmins(): Promise<ConnectedAdmin[]> {
  const { data } = await supabaseAdmin
    .from("admin_gmail_accounts")
    .select("admin_email, google_email, scope");
  return (data || []).map((r: { admin_email: string; google_email: string; scope: string | null }) => ({
    adminEmail: r.admin_email,
    googleEmail: r.google_email,
    hasCalendar: hasCalendarScope(r.scope),
  }));
}

/**
 * Aggregate events across every connected admin that has granted the calendar
 * scope. Failures for a single account are swallowed so one bad token doesn't
 * break the whole agenda.
 */
export async function listAggregatedEvents(
  timeMin: string,
  timeMax: string
): Promise<{ events: AgendaEvent[]; accounts: ConnectedAdmin[] }> {
  const accounts = await listConnectedAdmins();
  const calendarAccounts = accounts.filter((a) => a.hasCalendar);

  const results = await Promise.all(
    calendarAccounts.map(async (acc) => {
      try {
        const token = await getValidAccessToken(acc.adminEmail);
        if (!token) return [] as AgendaEvent[];
        const raw = await listEvents(token.accessToken, timeMin, timeMax);
        return raw
          .filter((e) => e.status !== "cancelled")
          .map((e) => normalizeEvent(e, acc.adminEmail, acc.googleEmail));
      } catch (err) {
        console.error(`[agenda] failed to list events for ${acc.adminEmail}:`, err);
        return [] as AgendaEvent[];
      }
    })
  );

  const events = results.flat();
  events.sort((a, b) => a.start.localeCompare(b.start));
  return { events, accounts };
}

// ─── Demo event auto-creation ─────────────────────────────────────────────────

export type DemoEventResult = {
  meetLink: string | null;
  htmlLink: string | null;
  start: string;
  end: string;
  eventId: string;
  calendarAdminEmail: string;
};

/**
 * Creates a 1-hour demo calendar event on the first connected admin that has
 * the calendar scope. Adds a Google Meet link and invites the org contact.
 *
 * @param orgName       Display name for the event title
 * @param orgEmail      Org contact email to add as attendee (optional)
 * @param startISO      ISO start time; defaults to next round hour if omitted
 * @param timeZone      IANA tz string; defaults to "Europe/Zurich"
 */
export async function createDemoCalendarEvent(
  orgName: string,
  orgEmail: string | null,
  startISO?: string,
  timeZone = "Europe/Zurich"
): Promise<DemoEventResult | null> {
  const admins = await listConnectedAdmins();
  const calendarAdmin = admins.find((a) => a.hasCalendar);
  if (!calendarAdmin) return null;

  const token = await getValidAccessToken(calendarAdmin.adminEmail);
  if (!token) return null;

  // Default start = next round hour from now
  let start: Date;
  if (startISO) {
    start = new Date(startISO);
  } else {
    start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
  }
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const attendees: string[] = [];
  if (orgEmail) attendees.push(orgEmail);

  const event = await createEvent(token.accessToken, {
    summary: `Aliice Demo – ${orgName}`,
    description: `Product demo for ${orgName}. This event was automatically created by Aliice when the deal moved to "Demo Scheduled".`,
    start: start.toISOString(),
    end: end.toISOString(),
    timeZone,
    attendees,
    addMeet: true,
    sendUpdates: "all",
  });

  return {
    meetLink: event.hangoutLink || null,
    htmlLink: event.htmlLink || null,
    start: event.start?.dateTime || start.toISOString(),
    end: event.end?.dateTime || end.toISOString(),
    eventId: event.id,
    calendarAdminEmail: calendarAdmin.adminEmail,
  };
}

// ─── Writing ──────────────────────────────────────────────────────────────────
export type CreateEventInput = {
  summary: string;
  description?: string;
  location?: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  timeZone?: string;
  attendees?: string[]; // email addresses
  addMeet?: boolean;
  sendUpdates?: "all" | "externalOnly" | "none";
};

export async function createEvent(
  accessToken: string,
  input: CreateEventInput
): Promise<GoogleCalendarEvent> {
  const body: Record<string, unknown> = {
    summary: input.summary,
    description: input.description || undefined,
    location: input.location || undefined,
    start: { dateTime: input.start, timeZone: input.timeZone || "UTC" },
    end: { dateTime: input.end, timeZone: input.timeZone || "UTC" },
  };

  if (input.attendees && input.attendees.length) {
    body.attendees = input.attendees.map((email) => ({ email }));
  }

  if (input.addMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: `aliice-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const url = new URL(`${CALENDAR_API}/calendars/primary/events`);
  url.searchParams.set("conferenceDataVersion", "1");
  url.searchParams.set("sendUpdates", input.sendUpdates || "all");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Calendar create failed (${res.status}): ${err}`);
  }
  return (await res.json()) as GoogleCalendarEvent;
}

export async function updateEvent(
  accessToken: string,
  eventId: string,
  input: Partial<CreateEventInput>
): Promise<GoogleCalendarEvent> {
  const body: Record<string, unknown> = {};
  if (input.summary !== undefined) body.summary = input.summary;
  if (input.description !== undefined) body.description = input.description;
  if (input.location !== undefined) body.location = input.location;
  if (input.start) body.start = { dateTime: input.start, timeZone: input.timeZone || "UTC" };
  if (input.end) body.end = { dateTime: input.end, timeZone: input.timeZone || "UTC" };
  if (input.attendees) body.attendees = input.attendees.map((email) => ({ email }));

  const url = new URL(`${CALENDAR_API}/calendars/primary/events/${eventId}`);
  url.searchParams.set("sendUpdates", input.sendUpdates || "all");

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Calendar update failed (${res.status}): ${err}`);
  }
  return (await res.json()) as GoogleCalendarEvent;
}

export async function deleteEvent(accessToken: string, eventId: string): Promise<void> {
  const url = new URL(`${CALENDAR_API}/calendars/primary/events/${eventId}`);
  url.searchParams.set("sendUpdates", "all");
  const res = await fetch(url.toString(), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 410 = already deleted; treat as success.
  if (!res.ok && res.status !== 410) {
    const err = await res.text().catch(() => "");
    throw new Error(`Calendar delete failed (${res.status}): ${err}`);
  }
}
