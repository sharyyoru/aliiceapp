import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getValidAccessToken, getGmailAccount, hasCalendarScope, isGmailConfigured } from "@/lib/gmail";
import {
  listAggregatedEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/googleCalendar";

/**
 * GET  /api/admin/agenda/events?timeMin=&timeMax=
 *   Aggregated events across every connected admin (calendar scope granted).
 * POST /api/admin/agenda/events
 *   Create an event on the logged-in admin's primary calendar (optional Meet).
 * PATCH  ?id=  — update an event on the logged-in admin's calendar.
 * DELETE ?id=  — delete an event on the logged-in admin's calendar.
 */
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get("timeMin");
  const timeMax = searchParams.get("timeMax");
  if (!timeMin || !timeMax) {
    return NextResponse.json({ error: "timeMin and timeMax are required" }, { status: 400 });
  }

  try {
    const { events, accounts } = await listAggregatedEvents(timeMin, timeMax);

    // Report the current admin's own connection state so the UI can prompt
    // a (re)connect when the calendar scope is missing.
    const myAccount = await getGmailAccount(session.email);
    const me = {
      connected: !!myAccount,
      hasCalendar: hasCalendarScope(myAccount?.scope),
      googleEmail: myAccount?.google_email || null,
    };

    return NextResponse.json({ events, accounts, me, configured: isGmailConfigured() });
  } catch (err) {
    console.error("[agenda events GET] error:", err);
    return NextResponse.json(
      { error: "Failed to load events", details: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getValidAccessToken(session.email);
  if (!token) {
    return NextResponse.json(
      { error: "Google account not connected. Connect it from the Agenda or Emails tab." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { summary, description, location, start, end, timeZone, attendees, addMeet, sendUpdates } = body;
  if (!summary || !start || !end) {
    return NextResponse.json({ error: "summary, start and end are required" }, { status: 400 });
  }

  try {
    const event = await createEvent(token.accessToken, {
      summary,
      description,
      location,
      start,
      end,
      timeZone,
      attendees,
      addMeet,
      sendUpdates,
    });
    return NextResponse.json({ event });
  } catch (err) {
    console.error("[agenda events POST] error:", err);
    return NextResponse.json(
      { error: "Failed to create event", details: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const token = await getValidAccessToken(session.email);
  if (!token) return NextResponse.json({ error: "Google account not connected" }, { status: 400 });

  try {
    const body = await request.json();
    const event = await updateEvent(token.accessToken, id, body);
    return NextResponse.json({ event });
  } catch (err) {
    console.error("[agenda events PATCH] error:", err);
    return NextResponse.json(
      { error: "Failed to update event", details: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const token = await getValidAccessToken(session.email);
  if (!token) return NextResponse.json({ error: "Google account not connected" }, { status: 400 });

  try {
    await deleteEvent(token.accessToken, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[agenda events DELETE] error:", err);
    return NextResponse.json(
      { error: "Failed to delete event", details: (err as Error).message },
      { status: 500 }
    );
  }
}
