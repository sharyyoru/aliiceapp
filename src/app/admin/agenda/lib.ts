// Shared helpers for the Agenda (Google-Calendar-like) UI.

export type AgendaEvent = {
  id: string;
  ownerEmail: string;
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

export type ConnectedAdmin = {
  adminEmail: string;
  googleEmail: string;
  hasCalendar: boolean;
};

export type CalendarView = "month" | "week" | "day";

// ─── Color palette (per calendar owner) ──────────────────────────────────────
const PALETTE = [
  { bg: "#1a73e8", soft: "#e8f0fe", text: "#1a73e8" }, // blue
  { bg: "#d93025", soft: "#fce8e6", text: "#d93025" }, // red
  { bg: "#188038", soft: "#e6f4ea", text: "#188038" }, // green
  { bg: "#e37400", soft: "#fef7e0", text: "#b06000" }, // amber
  { bg: "#9334e6", soft: "#f3e8fd", text: "#9334e6" }, // purple
  { bg: "#0b8043", soft: "#e6f4ea", text: "#0b8043" }, // dark green
  { bg: "#c5221f", soft: "#fce8e6", text: "#c5221f" }, // crimson
  { bg: "#3c78d8", soft: "#e8f0fe", text: "#3c78d8" }, // steel
  { bg: "#8e24aa", soft: "#f3e5f5", text: "#8e24aa" }, // magenta
  { bg: "#00838f", soft: "#e0f7fa", text: "#00838f" }, // teal
];

export function colorForEmail(email: string): { bg: string; soft: string; text: string } {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

// ─── Date helpers (native, no deps) ───────────────────────────────────────────
export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export function startOfWeek(d: Date): Date {
  // Week starts on Sunday (getDay() === 0), matching Google Calendar default.
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export function endOfMonth(d: Date): Date {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1);
  x.setDate(0);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

// Visible range [min, max) for the current view.
export function visibleRange(view: CalendarView, cursor: Date): { start: Date; end: Date } {
  if (view === "day") {
    const start = startOfDay(cursor);
    return { start, end: addDays(start, 1) };
  }
  if (view === "week") {
    const start = startOfWeek(cursor);
    return { start, end: addDays(start, 7) };
  }
  // month grid: 6 weeks starting on the Sunday on/before the 1st
  const start = startOfWeek(startOfMonth(cursor));
  return { start, end: addDays(start, 42) };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function headerTitle(view: CalendarView, cursor: Date): string {
  if (view === "day") {
    return `${WEEKDAYS_SHORT[cursor.getDay()]}, ${MONTHS[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
  }
  if (view === "week") {
    const s = startOfWeek(cursor);
    const e = addDays(s, 6);
    if (s.getMonth() === e.getMonth()) {
      return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
    }
    return `${MONTHS[s.getMonth()].slice(0, 3)} ${s.getDate()} – ${MONTHS[e.getMonth()].slice(0, 3)} ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, "0")}${ampm}`;
}

// minutes from midnight for a given ISO in local time
export function minutesFromMidnight(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

// Build a datetime-local string (YYYY-MM-DDTHH:mm) from a Date in local time.
export function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Parse a datetime-local string into an ISO string (keeps local wall time).
export function datetimeLocalToISO(local: string): string {
  return new Date(local).toISOString();
}

export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
