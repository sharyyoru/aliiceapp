"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle, Calendar, Clock, Video, Loader2, XCircle } from "lucide-react";

type SlotInfo = {
  orgName: string;
  orgEmail: string;
  slotStart: string;
  slotEnd: string;
  status: string;
  meetLink: string | null;
  calendarLink: string | null;
  label: string;
};

type ConfirmResult = {
  ok: boolean;
  already?: boolean;
  meetLink: string | null;
  calendarLink: string | null;
  label: string;
  date: string;
  time: string;
};

const TZ = "Europe/Zurich";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  return (
    new Date(iso).toLocaleTimeString("en-GB", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " CET"
  );
}

export default function BookDemoPage() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [slot, setSlot] = useState<SlotInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmResult | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadErr("Invalid booking link.");
      return;
    }
    fetch(`/api/public/book-demo?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setLoadErr(d.error); return; }
        setSlot(d);
        // If already confirmed, jump straight to success
        if (d.status === "confirmed") {
          setConfirmed({
            ok: true,
            already: true,
            meetLink: d.meetLink,
            calendarLink: d.calendarLink,
            label: d.label,
            date: fmtDate(d.slotStart),
            time: fmtTime(d.slotStart),
          });
        }
      })
      .catch(() => setLoadErr("Failed to load booking details."));
  }, [token]);

  const handleConfirm = async () => {
    if (!token || confirming) return;
    setConfirming(true);
    setConfirmErr(null);
    try {
      const res = await fetch("/api/public/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setConfirmErr(data.error || "Something went wrong. Please try again.");
        return;
      }
      setConfirmed(data);
    } catch {
      setConfirmErr("Network error. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  // ─── States ──────────────────────────────────────────────────────────────────

  if (!token || loadErr) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <XCircle className="h-14 w-14 text-red-400" />
          <h1 className="text-2xl font-bold text-slate-800">Invalid Link</h1>
          <p className="text-slate-500">{loadErr || "This booking link is invalid or has expired."}</p>
        </div>
      </Shell>
    );
  }

  if (!slot && !loadErr) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-slate-500">Loading your booking details…</p>
        </div>
      </Shell>
    );
  }

  if (confirmed) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {confirmed.already ? "Already Confirmed!" : "Demo Booked! 🎉"}
            </h1>
            <p className="mt-2 text-slate-500">
              {confirmed.already
                ? "Your demo was already confirmed. See details below."
                : "We've sent a confirmation to your email."}
            </p>
          </div>

          <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-left">
            <div className="mb-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Date</p>
                <p className="text-lg font-bold text-slate-900">{confirmed.date}</p>
              </div>
            </div>
            <div className="mb-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Time</p>
                <p className="text-lg font-bold text-slate-900">{confirmed.time}</p>
              </div>
            </div>
            {confirmed.meetLink && (
              <div className="flex items-start gap-3">
                <Video className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Google Meet</p>
                  <a
                    href={confirmed.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm font-medium text-emerald-700 underline"
                  >
                    {confirmed.meetLink}
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {confirmed.meetLink && (
              <a
                href={confirmed.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow hover:bg-emerald-600"
              >
                <Video className="h-4 w-4" />
                Join Google Meet
              </a>
            )}
            {confirmed.calendarLink && (
              <a
                href={confirmed.calendarLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 px-6 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
              >
                <Calendar className="h-4 w-4" />
                Add to Google Calendar
              </a>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Questions? Email us at{" "}
            <a href="mailto:hello@aliice.app" className="text-emerald-600 hover:underline">
              hello@aliice.app
            </a>
          </p>
        </div>
      </Shell>
    );
  }

  // ─── Main confirm view ────────────────────────────────────────────────────────
  return (
    <Shell>
      <div className="flex flex-col items-center gap-6 py-6">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Confirm Your Demo</h1>
          <p className="mt-2 text-slate-500">
            You&apos;re booking a 1-hour Aliice product demo for{" "}
            <strong className="text-slate-700">{slot?.orgName}</strong>
          </p>
        </div>

        {/* Slot card */}
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date</p>
              <p className="text-lg font-bold text-slate-900">{slot && fmtDate(slot.slotStart)}</p>
            </div>
          </div>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Clock className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Time</p>
              <p className="text-lg font-bold text-slate-900">
                {slot && fmtTime(slot.slotStart)} — {slot && fmtTime(slot.slotEnd)}{" "}
                <span className="text-sm font-normal text-slate-400">(1 hour)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Video className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Format</p>
              <p className="text-base font-medium text-slate-700">Google Meet (link sent on confirmation)</p>
            </div>
          </div>
        </div>

        {/* What to expect */}
        <div className="w-full max-w-md rounded-2xl bg-slate-50 px-6 py-5">
          <p className="mb-3 text-sm font-semibold text-slate-600">What we&apos;ll cover:</p>
          <ul className="space-y-2">
            {[
              "Full platform walkthrough tailored to your clinic",
              "Live demo of bookings, billing & patient management",
              "Pricing & onboarding options — no surprises",
              "Q&A — ask us anything",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        {confirmErr && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{confirmErr}</p>
        )}
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="inline-flex w-full max-w-md items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-60"
        >
          {confirming ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Confirming…
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              Confirm this slot
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          By confirming, a Google Meet link will be created and sent to{" "}
          <strong>{slot?.orgEmail}</strong>. You can reschedule by replying to the confirmation email.
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <div className="mx-auto max-w-xl px-4 py-10">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <a href="https://www.aliice.app">
            <Image
              src="/logos/aliice-logo.png"
              alt="Aliice"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </a>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          © 2025 Aliice · All-in-one clinic management platform
        </p>
      </div>
    </div>
  );
}
