"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  RefreshCw,
  Loader2,
  CalendarDays,
  X,
} from "lucide-react";
import {
  AgendaEvent,
  ConnectedAdmin,
  CalendarView,
  addDays,
  addMonths,
  colorForEmail,
  headerTitle,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  visibleRange,
  formatTime,
  minutesFromMidnight,
  toDatetimeLocal,
  WEEKDAYS_SHORT,
} from "./lib";
import EventModal, { EventDraft } from "./EventModal";

const HOUR_HEIGHT = 48; // px per hour in week/day time grid

export default function AgendaPage() {
  const [view, setView] = useState<CalendarView>("week");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAdmin[]>([]);
  const [me, setMe] = useState<{ connected: boolean; hasCalendar: boolean; googleEmail: string | null }>({
    connected: false,
    hasCalendar: false,
    googleEmail: null,
  });
  const [configured, setConfigured] = useState(true);
  const [hiddenOwners, setHiddenOwners] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [initialDraft, setInitialDraft] = useState<Partial<EventDraft> | undefined>();

  const range = useMemo(() => visibleRange(view, cursor), [view, cursor]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        timeMin: range.start.toISOString(),
        timeMax: range.end.toISOString(),
      });
      const res = await fetch(`/api/admin/agenda/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setAccounts(data.accounts || []);
        setMe(data.me || { connected: false, hasCalendar: false, googleEmail: null });
        setConfigured(data.configured ?? true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const visibleEvents = useMemo(
    () => events.filter((e) => !hiddenOwners.has(e.ownerEmail)),
    [events, hiddenOwners]
  );

  const goToday = () => setCursor(new Date());
  const goPrev = () =>
    setCursor((c) => (view === "month" ? addMonths(c, -1) : addDays(c, view === "week" ? -7 : -1)));
  const goNext = () =>
    setCursor((c) => (view === "month" ? addMonths(c, 1) : addDays(c, view === "week" ? 7 : 1)));

  const toggleOwner = (email: string) => {
    setHiddenOwners((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const openCreate = (draft?: Partial<EventDraft>) => {
    setEditingEvent(null);
    setInitialDraft(draft);
    setModalOpen(true);
  };

  const openEvent = (ev: AgendaEvent) => {
    setEditingEvent(ev);
    setInitialDraft(undefined);
    setModalOpen(true);
  };

  const onSlotClick = (day: Date, hour?: number) => {
    const start = new Date(day);
    if (hour !== undefined) start.setHours(hour, 0, 0, 0);
    else {
      const now = new Date();
      start.setHours(now.getHours(), now.getMinutes() < 30 ? 0 : 30, 0, 0);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    openCreate({ startLocal: toDatetimeLocal(start), endLocal: toDatetimeLocal(end) });
  };

  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const disconnectCalendar = async (adminEmail: string) => {
    if (!confirm(`Disconnect Google Calendar for ${adminEmail}?`)) return;
    setDisconnecting(adminEmail);
    try {
      await fetch("/api/admin/gmail/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_email: adminEmail }),
      });
      await fetchEvents();
    } finally {
      setDisconnecting(null);
    }
  };

  const connectHref = `/api/admin/gmail/connect?returnTo=${encodeURIComponent("/admin/agenda")}`;
  const needsConnect = configured && (!me.connected || !me.hasCalendar);

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Top bar */}
      <header className="flex items-center gap-4 border-b px-4 py-2.5">
        <Link href="/admin" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-sky-600" />
          <span className="text-lg font-semibold text-slate-800">Agenda</span>
        </div>

        <button
          onClick={goToday}
          className="ml-2 rounded-lg border border-slate-300 px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Today
        </button>
        <div className="flex items-center">
          <button onClick={goPrev} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={goNext} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <h1 className="text-lg font-semibold text-slate-800">{headerTitle(view, cursor)}</h1>

        <div className="ml-auto flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <button
            onClick={fetchEvents}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="flex rounded-lg border border-slate-300 p-0.5">
            {(["day", "week", "month"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                  view === v ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => openCreate()}
            disabled={needsConnect}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        </div>
      </header>

      {needsConnect && (
        <div className="flex items-center justify-between gap-3 border-b bg-amber-50 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Video className="h-4 w-4" />
            {me.connected
              ? "Grant calendar access to view and create events (Google Meet included)."
              : "Connect your Google account to use the Agenda and Google Meet."}
          </div>
          <a
            href={connectHref}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {me.connected ? "Grant calendar access" : "Connect Google"}
          </a>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col gap-4 border-r p-4 md:flex">
          <button
            onClick={() => openCreate()}
            disabled={needsConnect}
            className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>

          <MiniMonth cursor={cursor} onPick={(d) => { setCursor(d); if (view === "month") setView("day"); }} />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Team calendars
            </p>
            <div className="space-y-1.5">
              {accounts.length === 0 && (
                <p className="text-xs text-slate-400">No connected calendars yet.</p>
              )}
              {accounts.map((acc) => {
                const c = colorForEmail(acc.adminEmail);
                const hidden = hiddenOwners.has(acc.adminEmail);
                const isDisconnecting = disconnecting === acc.adminEmail;
                return (
                  <div key={acc.adminEmail} className="group flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-slate-50">
                    <button
                      onClick={() => acc.hasCalendar && toggleOwner(acc.adminEmail)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      title={acc.hasCalendar ? acc.googleEmail : "Calendar access not granted"}
                    >
                      <span
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border"
                        style={{
                          backgroundColor: hidden ? "transparent" : c.bg,
                          borderColor: c.bg,
                        }}
                      />
                      <span className={`min-w-0 flex-1 truncate text-sm ${acc.hasCalendar ? "text-slate-700" : "text-slate-400"}`}>
                        {acc.googleEmail}
                      </span>
                      {!acc.hasCalendar && <span className="shrink-0 text-[10px] text-amber-500">no access</span>}
                    </button>
                    <button
                      onClick={() => disconnectCalendar(acc.adminEmail)}
                      disabled={isDisconnecting}
                      title={`Disconnect ${acc.adminEmail}`}
                      className="shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-50"
                    >
                      {isDisconnecting
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <X className="h-3 w-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main view */}
        <main className="min-w-0 flex-1 overflow-auto">
          {view === "month" ? (
            <MonthView
              cursor={cursor}
              events={visibleEvents}
              onDayClick={(d) => onSlotClick(d)}
              onEventClick={openEvent}
            />
          ) : (
            <TimeGridView
              view={view}
              cursor={cursor}
              events={visibleEvents}
              onSlotClick={onSlotClick}
              onEventClick={openEvent}
            />
          )}
        </main>
      </div>

      {modalOpen && (
        <EventModal
          initialDraft={initialDraft}
          editingEvent={editingEvent}
          canEdit={!editingEvent || editingEvent.ownerGoogleEmail === me.googleEmail}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchEvents();
          }}
          onDeleted={() => {
            setModalOpen(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

// ─── Month view ───────────────────────────────────────────────────────────────
function MonthView({
  cursor,
  events,
  onDayClick,
  onEventClick,
}: {
  cursor: Date;
  events: AgendaEvent[];
  onDayClick: (d: Date) => void;
  onEventClick: (e: AgendaEvent) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(cursor));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const month = cursor.getMonth();

  const eventsByDay = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const ev of events) {
      const key = startOfDay(new Date(ev.start)).toDateString();
      const arr = map.get(key) || [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((day, i) => {
          const inMonth = day.getMonth() === month;
          const dayEvents = eventsByDay.get(day.toDateString()) || [];
          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={`min-h-0 cursor-pointer border-b border-r p-1 ${
                inMonth ? "bg-white" : "bg-slate-50"
              } hover:bg-sky-50/40`}
            >
              <div className="flex justify-center">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday(day)
                      ? "bg-sky-600 text-white"
                      : inMonth
                      ? "text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => {
                  const c = colorForEmail(ev.ownerEmail);
                  return (
                    <button
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                      className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] hover:opacity-90"
                      style={{ backgroundColor: c.soft, color: c.text }}
                    >
                      {!ev.allDay && <span className="font-medium">{formatTime(ev.start)}</span>}
                      {ev.meetLink && <Video className="h-2.5 w-2.5 shrink-0" />}
                      <span className="truncate">{ev.title}</span>
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-[11px] font-medium text-slate-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week / Day time grid ──────────────────────────────────────────────────────
function TimeGridView({
  view,
  cursor,
  events,
  onSlotClick,
  onEventClick,
}: {
  view: CalendarView;
  cursor: Date;
  events: AgendaEvent[];
  onSlotClick: (d: Date, hour: number) => void;
  onEventClick: (e: AgendaEvent) => void;
}) {
  const dayCount = view === "week" ? 7 : 1;
  const firstDay = view === "week" ? startOfWeek(cursor) : startOfDay(cursor);
  const days = Array.from({ length: dayCount }, (_, i) => addDays(firstDay, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const timed = events.filter((e) => !e.allDay);
  const allDay = events.filter((e) => e.allDay);

  const colTemplate = `56px repeat(${dayCount}, minmax(0, 1fr))`;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Scrollable container — header lives INSIDE so columns always align */}
      <div className="flex-1 overflow-auto">
        {/* Day headers — sticky inside the scroll container */}
        <div className="sticky top-0 z-10 bg-white border-b" style={{ display: "grid", gridTemplateColumns: colTemplate }}>
          {/* gutter cell — matches time-label width */}
          <div className="border-r" />
          {days.map((day, i) => (
            <div key={i} className="border-r py-2 text-center last:border-r-0">
              <div className="text-xs font-medium uppercase text-slate-500">{WEEKDAYS_SHORT[day.getDay()]}</div>
              <div
                className={`mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-lg font-medium ${
                  isToday(day) ? "bg-sky-600 text-white" : "text-slate-800"
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* All-day row */}
        {allDay.length > 0 && (
          <div className="sticky top-[72px] z-10 border-b bg-white" style={{ display: "grid", gridTemplateColumns: colTemplate }}>
            <div className="border-r py-1 pr-2 text-right text-[10px] uppercase text-slate-400">All day</div>
            {days.map((day, i) => (
              <div key={i} className="min-h-[28px] space-y-0.5 border-r p-0.5 last:border-r-0">
                {allDay
                  .filter((e) => isSameDay(new Date(e.start), day))
                  .map((ev) => {
                    const c = colorForEmail(ev.ownerEmail);
                    return (
                      <button
                        key={ev.id}
                        onClick={() => onEventClick(ev)}
                        className="w-full truncate rounded px-1.5 py-0.5 text-left text-[11px]"
                        style={{ backgroundColor: c.bg, color: "#fff" }}
                      >
                        {ev.title}
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        )}

        {/* Time grid */}
        <div style={{ display: "grid", gridTemplateColumns: colTemplate }}>
          {/* Hour labels */}
          <div className="relative border-r">
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
                <span className="absolute -top-2 right-2 text-[10px] text-slate-400">
                  {h === 0 ? "" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, di) => {
            const dayTimed = timed.filter((e) => isSameDay(new Date(e.start), day));
            return (
              <div key={di} className="relative border-r last:border-r-0">
                {hours.map((h) => (
                  <div
                    key={h}
                    onClick={() => onSlotClick(day, h)}
                    style={{ height: HOUR_HEIGHT }}
                    className="border-b border-slate-100 hover:bg-sky-50/40"
                  />
                ))}
                {isToday(day) && <NowLine />}
                {layoutDayEvents(dayTimed).map(({ ev, col, cols }) => {
                  const c = colorForEmail(ev.ownerEmail);
                  const top = (minutesFromMidnight(ev.start) / 60) * HOUR_HEIGHT;
                  const endMin = minutesFromMidnight(ev.end) || minutesFromMidnight(ev.start) + 30;
                  const height = Math.max(((endMin - minutesFromMidnight(ev.start)) / 60) * HOUR_HEIGHT, 18);
                  const widthPct = 100 / cols;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => onEventClick(ev)}
                      className="absolute overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[11px] leading-tight shadow-sm"
                      style={{
                        top,
                        height,
                        left: `calc(${col * widthPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                        backgroundColor: c.soft,
                        color: c.text,
                        borderLeft: `3px solid ${c.bg}`,
                      }}
                    >
                      <div className="flex items-center gap-1 font-semibold">
                        {ev.meetLink && <Video className="h-2.5 w-2.5 shrink-0" />}
                        <span className="truncate">{ev.title}</span>
                      </div>
                      <div className="truncate opacity-80">{formatTime(ev.start)}</div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NowLine() {
  const [top, setTop] = useState(() => (minutesFromMidnight(new Date().toISOString()) / 60) * HOUR_HEIGHT);
  useEffect(() => {
    const id = setInterval(
      () => setTop((minutesFromMidnight(new Date().toISOString()) / 60) * HOUR_HEIGHT),
      60_000
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div className="pointer-events-none absolute left-0 right-0 z-10" style={{ top }}>
      <div className="relative">
        <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
        <div className="h-0.5 bg-red-500" />
      </div>
    </div>
  );
}

// Simple overlap layout: assign columns to overlapping events.
function layoutDayEvents(dayEvents: AgendaEvent[]): { ev: AgendaEvent; col: number; cols: number }[] {
  const sorted = [...dayEvents].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  const result: { ev: AgendaEvent; col: number; cols: number }[] = [];
  let cluster: AgendaEvent[] = [];
  let clusterEnd = 0;

  const flush = () => {
    const columns: number[] = []; // end time per column
    const placements = cluster.map((ev) => {
      const s = new Date(ev.start).getTime();
      const e = new Date(ev.end).getTime() || s + 30 * 60 * 1000;
      let col = columns.findIndex((end) => end <= s);
      if (col === -1) {
        col = columns.length;
        columns.push(e);
      } else {
        columns[col] = e;
      }
      return { ev, col };
    });
    const cols = columns.length || 1;
    for (const p of placements) result.push({ ...p, cols });
    cluster = [];
    clusterEnd = 0;
  };

  for (const ev of sorted) {
    const s = new Date(ev.start).getTime();
    const e = new Date(ev.end).getTime() || s + 30 * 60 * 1000;
    if (cluster.length && s >= clusterEnd) flush();
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, e);
  }
  if (cluster.length) flush();
  return result;
}

// ─── Mini month (sidebar) ──────────────────────────────────────────────────────
function MiniMonth({ cursor, onPick }: { cursor: Date; onPick: (d: Date) => void }) {
  const [refDate, setRefDate] = useState(startOfMonth(cursor));
  useEffect(() => setRefDate(startOfMonth(cursor)), [cursor]);
  const gridStart = startOfWeek(startOfMonth(refDate));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const month = refDate.getMonth();
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="select-none">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          {MONTHS[month]} {refDate.getFullYear()}
        </span>
        <div className="flex">
          <button onClick={() => setRefDate(addMonths(refDate, -1))} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setRefDate(addMonths(refDate, 1))} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-slate-400">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => (
          <button
            key={i}
            onClick={() => onPick(day)}
            className={`flex h-6 items-center justify-center rounded-full text-[11px] ${
              isToday(day)
                ? "bg-sky-600 text-white"
                : isSameDay(day, cursor)
                ? "bg-sky-100 text-sky-700"
                : day.getMonth() === month
                ? "text-slate-700 hover:bg-slate-100"
                : "text-slate-300 hover:bg-slate-50"
            }`}
          >
            {day.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}
