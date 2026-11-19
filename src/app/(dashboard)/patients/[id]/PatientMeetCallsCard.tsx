"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { formatSwissDate, formatSwissTime } from "@/lib/swissTimezone";

type MeetAppointment = {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string | null;
  reason: string | null;
  title: string | null;
  meet_link: string | null;
  provider: { id: string; name: string | null } | null;
};

export default function PatientMeetCallsCard({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<MeetAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabaseClient
      .from("appointments")
      .select(
        "id, start_time, end_time, status, reason, title, meet_link, provider:providers(id, name)"
      )
      .eq("patient_id", patientId)
      .not("meet_link", "is", null)
      .order("start_time", { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data) setAppointments(data as unknown as MeetAppointment[]);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [patientId]);

  if (loading) return null;
  if (appointments.length === 0) return null;

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.start_time) >= now);
  const past = appointments.filter((a) => new Date(a.start_time) < now);

  const Row = ({ appt, isPast }: { appt: MeetAppointment; isPast: boolean }) => (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isPast ? "bg-slate-200 text-slate-500" : "bg-emerald-100 text-emerald-600"
        }`}
        aria-hidden
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 8-6 4 6 4V8Z" />
          <rect x="2" y="6" width="14" height="12" rx="2" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {appt.title || appt.reason || "Video consultation"}
        </p>
        <p className="text-xs text-slate-500">
          {formatSwissDate(appt.start_time)} · {formatSwissTime(appt.start_time)}
          {appt.end_time ? `–${formatSwissTime(appt.end_time)}` : ""}
          {appt.provider?.name ? ` · ${appt.provider.name}` : ""}
        </p>
      </div>
      {appt.status ? (
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
          {appt.status}
        </span>
      ) : null}
      {appt.meet_link ? (
        <a
          href={appt.meet_link}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            isPast
              ? "text-slate-500 underline-offset-2 hover:underline"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {isPast ? "Link" : "Join"}
        </a>
      ) : null}
    </li>
  );

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 text-sm shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Video consultations
        </p>
        <span className="text-xs text-slate-400">
          {upcoming.length} upcoming · {past.length} past
        </span>
      </div>
      {upcoming.length ? (
        <>
          <p className="mb-1.5 text-[11px] font-semibold text-slate-400">Upcoming</p>
          <ul className="mb-3 space-y-1.5">
            {upcoming.map((a) => (
              <Row key={a.id} appt={a} isPast={false} />
            ))}
          </ul>
        </>
      ) : null}
      {past.length ? (
        <>
          <p className="mb-1.5 text-[11px] font-semibold text-slate-400">Past</p>
          <ul className="space-y-1.5">
            {past.map((a) => (
              <Row key={a.id} appt={a} isPast />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
