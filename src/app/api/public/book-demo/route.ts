/**
 * GET /api/public/book-demo?token=<token>
 *   Returns slot info for preview on the landing page.
 *
 * POST /api/public/book-demo  { token }
 *   Confirms the booking:
 *   1. Marks demo_booking as confirmed
 *   2. Creates Google Calendar event + Meet link
 *   3. Returns confirmed slot + meet details
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createDemoCalendarEvent } from "@/lib/googleCalendar";
import { sendEmail, isEmailConfigured } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TZ = "Europe/Zurich";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " CET";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const { data: booking } = await supabase
    .from("demo_bookings")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!booking) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  return NextResponse.json({
    orgName:   booking.org_name,
    orgEmail:  booking.org_email,
    slotStart: booking.slot_start,
    slotEnd:   booking.slot_end,
    status:    booking.status,
    meetLink:  booking.meet_link,
    calendarLink: booking.calendar_link,
    label: fmt(booking.slot_start),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token: string = body.token || new URL(req.url).searchParams.get("token") || "";

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  // Load booking
  const { data: booking, error: fetchErr } = await supabase
    .from("demo_bookings")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (fetchErr || !booking) {
    return NextResponse.json({ error: "Invalid or expired booking link" }, { status: 404 });
  }

  if (booking.status === "confirmed") {
    return NextResponse.json({
      ok: true,
      already: true,
      meetLink: booking.meet_link,
      calendarLink: booking.calendar_link,
      label: fmt(booking.slot_start),
    });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "This slot has been cancelled" }, { status: 410 });
  }

  // Create Google Calendar event
  let meetLink: string | null = null;
  let calendarLink: string | null = null;
  let googleEventId: string | null = null;

  try {
    const calEvent = await createDemoCalendarEvent(
      booking.org_name,
      booking.org_email,
      booking.slot_start,
    );
    if (calEvent) {
      meetLink      = calEvent.meetLink;
      calendarLink  = calEvent.htmlLink;
      googleEventId = calEvent.eventId;
    }
  } catch (calErr) {
    console.error("[book-demo] Calendar creation failed (non-fatal):", calErr);
  }

  // Confirm booking in DB
  const { error: updateErr } = await supabase
    .from("demo_bookings")
    .update({
      status:          "confirmed",
      meet_link:       meetLink,
      calendar_link:   calendarLink,
      google_event_id: googleEventId,
      updated_at:      new Date().toISOString(),
    })
    .eq("token", token);

  if (updateErr) {
    console.error("[book-demo] Failed to confirm booking:", updateErr);
    return NextResponse.json({ error: "Failed to confirm booking" }, { status: 500 });
  }

  // Cancel other pending slots for same org (optional, prevents double-booking)
  if (booking.organization_id) {
    await supabase
      .from("demo_bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("organization_id", booking.organization_id)
      .eq("status", "pending")
      .neq("token", token);
  }

  // Send confirmation email to prospect
  if (isEmailConfigured() && booking.org_email) {
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || "hello@aliice.app";
    const fromName = process.env.EMAIL_FROM_NAME || "Aliice";

    const confirmHtml = buildConfirmationEmail({
      orgName:     booking.org_name,
      date:        fmtDate(booking.slot_start),
      time:        fmtTime(booking.slot_start),
      meetLink:    meetLink,
      calendarLink: calendarLink,
    });

    await sendEmail({
      to:       booking.org_email,
      subject:  `Your Aliice demo is confirmed – ${fmtDate(booking.slot_start)}`,
      html:     confirmHtml,
      from:     fromAddress,
      fromName: fromName,
    }).catch((e) => console.error("[book-demo] Email send failed:", e));
  }

  return NextResponse.json({
    ok: true,
    meetLink,
    calendarLink,
    label: fmt(booking.slot_start),
    date:  fmtDate(booking.slot_start),
    time:  fmtTime(booking.slot_start),
  });
}

function buildConfirmationEmail({
  orgName, date, time, meetLink, calendarLink,
}: {
  orgName: string;
  date: string;
  time: string;
  meetLink: string | null;
  calendarLink: string | null;
}) {
  const meetBtn = meetLink
    ? `<table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;"><tr><td style="background:#10b981;border-radius:10px;"><a href="${meetLink}" style="display:block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">Join Google Meet →</a></td></tr></table>`
    : "";
  const calBtn = calendarLink
    ? `<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="border:1px solid #d1fae5;border-radius:10px;"><a href="${calendarLink}" style="display:block;padding:12px 28px;color:#10b981;font-size:14px;font-weight:600;text-decoration:none;">Add to Google Calendar →</a></td></tr></table>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:#10b981;height:5px;font-size:0;">&nbsp;</td></tr>
      <tr><td style="padding:36px 40px 24px;text-align:center;">
        <img src="https://www.aliice.app/logos/aliice-logo.png" alt="Aliice" width="110" style="display:block;margin:0 auto 20px;"/>
        <h1 style="margin:0;color:#10b981;font-size:26px;font-weight:700;">Your demo is confirmed! 🎉</h1>
        <p style="margin:10px 0 0;color:#64748b;font-size:15px;">See you soon, ${orgName}</p>
      </td></tr>
      <tr><td style="padding:8px 40px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:24px;margin:0 0 28px;">
          <tr><td>
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;color:#059669;">📅 Date</p>
            <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">${date}</p>
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;color:#059669;">🕐 Time</p>
            <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">${time}</p>
            ${meetLink ? `<p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;color:#059669;">🎥 Google Meet</p><a href="${meetLink}" style="font-size:14px;color:#10b981;word-break:break-all;">${meetLink}</a>` : ""}
          </td></tr>
        </table>
        ${meetBtn}
        ${calBtn}
        <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;">Need to reschedule? Reply to this email.</p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2025 Aliice · <a href="mailto:hello@aliice.app" style="color:#10b981;text-decoration:none;">hello@aliice.app</a></p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}
