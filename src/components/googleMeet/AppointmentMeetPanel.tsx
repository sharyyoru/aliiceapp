"use client";

import { useState } from "react";
import Link from "next/link";
import { Video, Loader2, X, Copy, Check } from "lucide-react";
import { addAppointmentMeet, removeAppointmentMeet } from "@/lib/googleMeetClient";

type Props = {
  appointmentId: string;
  meetLink: string | null;
  onChange: (meetLink: string | null) => void;
};

/** Google Meet controls for an existing appointment (edit modal). */
export default function AppointmentMeetPanel({ appointmentId, meetLink, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConnected, setNotConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleAdd() {
    setBusy(true);
    setError(null);
    setNotConnected(false);
    try {
      const { meetLink: link } = await addAppointmentMeet(appointmentId, true);
      onChange(link);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create Google Meet link";
      if (msg.toLowerCase().includes("not connected")) setNotConnected(true);
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm("Remove the Google Meet link and cancel the calendar invitation?")) return;
    setBusy(true);
    setError(null);
    try {
      await removeAppointmentMeet(appointmentId);
      onChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove Google Meet link");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!meetLink) return;
    await navigator.clipboard.writeText(meetLink).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50/60 p-2.5" data-testid="appointment-meet-panel">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
        <Video className="h-3.5 w-3.5 text-sky-600" /> Google Meet video call
      </div>
      {meetLink ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
          >
            <Video className="h-3.5 w-3.5" /> Join Google Meet
          </a>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleRemove()}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Remove
          </button>
          <p className="w-full truncate text-[10px] text-slate-500">{meetLink}</p>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleAdd()}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
          Add Google Meet link
        </button>
      )}
      {error ? (
        <p className="mt-1.5 text-[11px] text-red-600">
          {error}{" "}
          {notConnected ? (
            <Link href="/settings?tab=google-meet" className="font-medium underline">
              Open settings
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
