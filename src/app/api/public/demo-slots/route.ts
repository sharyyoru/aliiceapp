/**
 * GET /api/public/demo-slots?orgId=&orgName=&orgEmail=
 *
 * Returns the next 3 available 30-min demo slots between 09:00–17:00 (Europe/Zurich)
 * skipping weekends, past times, and slots already booked in demo_bookings.
 *
 * Each slot includes a pre-generated signed token that can be used directly
 * in the booking URL: /book-demo?token=<token>
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHmac } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TZ = "Europe/Zurich";
const DEMO_START_HOUR = 9;
const DEMO_END_HOUR = 17;
const SLOT_DURATION_MIN = 60;
const SLOTS_TO_RETURN = 3;
const MAX_DAYS_AHEAD = 14;

/** Format a Date as YYYY-MM-DD in Swiss time */
function toSwissDateStr(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ }); // en-CA gives YYYY-MM-DD
}

/** Get hour in Swiss time */
function swissHour(d: Date): number {
  return parseInt(d.toLocaleString("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }), 10);
}

/** Build a Date for a given Swiss date string + hour (midnight Swiss = start of day) */
function swissDateAtHour(dateStr: string, hour: number): Date {
  // dateStr = YYYY-MM-DD
  const [y, m, day] = dateStr.split("-").map(Number);
  // Create in UTC then adjust — easiest is constructing via Intl
  const iso = `${dateStr}T${String(hour).padStart(2, "0")}:00:00`;
  // Parse as Swiss local time by finding UTC offset for that moment
  const approx = new Date(`${iso}Z`); // rough UTC
  const offsetMs = getSwissOffsetMs(approx);
  return new Date(approx.getTime() - offsetMs);
}

/** Returns Swiss UTC offset in ms for a given Date */
function getSwissOffsetMs(d: Date): number {
  const utcStr = d.toLocaleString("en-GB", { timeZone: "UTC" });
  const swissStr = d.toLocaleString("en-GB", { timeZone: TZ });
  const parse = (s: string) => {
    const [datePart, timePart] = s.split(", ");
    const [dd, mm, yyyy] = datePart.split("/").map(Number);
    const [hh, mi, ss] = timePart.split(":").map(Number);
    return Date.UTC(yyyy, mm - 1, dd, hh, mi, ss);
  };
  return parse(swissStr) - parse(utcStr);
}

/** Is a Date a weekend in Swiss time? */
function isWeekend(d: Date): boolean {
  const dow = parseInt(d.toLocaleDateString("en-GB", { timeZone: TZ, weekday: "short" }).slice(0, 1), 10);
  const day = d.toLocaleDateString("en-GB", { timeZone: TZ, weekday: "long" });
  return day === "Saturday" || day === "Sunday";
}

function generateToken(orgId: string, slotISO: string): string {
  const rand = randomBytes(8).toString("hex");
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) || "aliice-demo-secret";
  const payload = `${orgId}:${slotISO}:${rand}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 12);
  return `${rand}${sig}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId    = searchParams.get("orgId")    || "";
  const orgName  = searchParams.get("orgName")  || "Your organisation";
  const orgEmail = searchParams.get("orgEmail") || "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.aliice.app";

  // Fetch already-booked confirmed demo slots so we don't double-book
  const nowISO = new Date().toISOString();
  const { data: bookedRows } = await supabase
    .from("demo_bookings")
    .select("slot_start, slot_end")
    .in("status", ["pending", "confirmed"])
    .gte("slot_end", nowISO);

  const bookedIntervals: { start: Date; end: Date }[] = (bookedRows || []).map((r) => ({
    start: new Date(r.slot_start),
    end:   new Date(r.slot_end),
  }));

  const isBooked = (slotStart: Date, slotEnd: Date) =>
    bookedIntervals.some(
      (b) => slotStart < b.end && slotEnd > b.start
    );

  const slots: { iso: string; label: string; token: string; url: string }[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < MAX_DAYS_AHEAD && slots.length < SLOTS_TO_RETURN; dayOffset++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + dayOffset);

    if (isWeekend(checkDate)) continue;

    const dateStr = toSwissDateStr(checkDate);

    for (let h = DEMO_START_HOUR; h < DEMO_END_HOUR && slots.length < SLOTS_TO_RETURN; h++) {
      const slotStart = swissDateAtHour(dateStr, h);
      const slotEnd   = new Date(slotStart.getTime() + SLOT_DURATION_MIN * 60 * 1000);

      // Must be in the future (at least 30 min from now)
      if (slotStart.getTime() < now.getTime() + 30 * 60 * 1000) continue;
      if (isBooked(slotStart, slotEnd)) continue;

      const token = generateToken(orgId, slotStart.toISOString());

      // Pre-insert as 'pending' so concurrent requests don't double-pick
      const { error: insertErr } = await supabase.from("demo_bookings").insert({
        organization_id: orgId || null,
        org_name:  orgName,
        org_email: orgEmail,
        slot_start: slotStart.toISOString(),
        slot_end:   slotEnd.toISOString(),
        status:     "pending",
        token,
      });

      if (insertErr) continue; // token collision or race — skip this slot

      const label = slotStart.toLocaleString("en-GB", {
        timeZone: TZ,
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) + " CET";

      slots.push({
        iso:   slotStart.toISOString(),
        label,
        token,
        url: `${appUrl}/book-demo?token=${token}`,
      });

      break; // one slot per day
    }
  }

  return NextResponse.json({ slots });
}
