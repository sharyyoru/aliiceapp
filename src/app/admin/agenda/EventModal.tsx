"use client";

import { useEffect, useState } from "react";
import { X, Video, MapPin, AlignLeft, Users, Loader2, Trash2 } from "lucide-react";
import { AgendaEvent, toDatetimeLocal, datetimeLocalToISO, localTimeZone } from "./lib";

export type EventDraft = {
  id?: string;
  title: string;
  startLocal: string; // datetime-local
  endLocal: string;
  location: string;
  description: string;
  attendees: string;
  addMeet: boolean;
  meetLink?: string | null;
  ownerEmail?: string;
};

function eventToDraft(ev: AgendaEvent): EventDraft {
  return {
    id: ev.id,
    title: ev.title === "(no title)" ? "" : ev.title,
    startLocal: toDatetimeLocal(new Date(ev.start)),
    endLocal: toDatetimeLocal(new Date(ev.end)),
    location: ev.location || "",
    description: ev.description || "",
    attendees: ev.attendees.map((a) => a.email).join(", "),
    addMeet: !!ev.meetLink,
    meetLink: ev.meetLink,
    ownerEmail: ev.ownerEmail,
  };
}

export default function EventModal({
  initialDraft,
  editingEvent,
  canEdit,
  onClose,
  onSaved,
  onDeleted,
}: {
  initialDraft?: Partial<EventDraft>;
  editingEvent?: AgendaEvent | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [draft, setDraft] = useState<EventDraft>(() => {
    if (editingEvent) return eventToDraft(editingEvent);
    const now = new Date();
    now.setMinutes(now.getMinutes() < 30 ? 0 : 30, 0, 0);
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    return {
      title: "",
      startLocal: toDatetimeLocal(now),
      endLocal: toDatetimeLocal(end),
      location: "",
      description: "",
      attendees: "",
      addMeet: false,
      ...initialDraft,
    };
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editingEvent;
  const readOnly = isEditing && !canEdit;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    setError(null);
    if (!draft.title.trim()) {
      setError("Please add a title.");
      return;
    }
    if (new Date(draft.endLocal) <= new Date(draft.startLocal)) {
      setError("End time must be after the start time.");
      return;
    }
    setSaving(true);
    try {
      const attendees = draft.attendees
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.includes("@"));
      const payload = {
        summary: draft.title.trim(),
        description: draft.description.trim() || undefined,
        location: draft.location.trim() || undefined,
        start: datetimeLocalToISO(draft.startLocal),
        end: datetimeLocalToISO(draft.endLocal),
        timeZone: localTimeZone(),
        attendees,
        addMeet: draft.addMeet,
      };
      const url = isEditing
        ? `/api/admin/agenda/events?id=${encodeURIComponent(draft.id!)}`
        : "/api/admin/agenda/events";
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.details || data.error || "Failed to save event.");
        return;
      }
      onSaved();
    } catch {
      setError("Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/agenda/events?id=${encodeURIComponent(draft.id)}`, {
        method: "DELETE",
      });
      if (res.ok) onDeleted();
      else {
        const data = await res.json();
        setError(data.details || data.error || "Failed to delete event.");
      }
    } catch {
      setError("Failed to delete event.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="text-base font-semibold text-slate-900">
            {isEditing ? (readOnly ? "Event details" : "Edit event") : "New event"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <input
            autoFocus={!readOnly}
            disabled={readOnly}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Add title"
            className="w-full border-b-2 border-slate-200 pb-2 text-lg font-medium text-slate-900 outline-none focus:border-sky-500 disabled:bg-transparent"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Starts</label>
              <input
                type="datetime-local"
                disabled={readOnly}
                value={draft.startLocal}
                onChange={(e) => {
                  const startLocal = e.target.value;
                  // keep duration when moving the start
                  const prevStart = new Date(draft.startLocal).getTime();
                  const prevEnd = new Date(draft.endLocal).getTime();
                  const dur = Math.max(prevEnd - prevStart, 30 * 60 * 1000);
                  const newEnd = new Date(new Date(startLocal).getTime() + dur);
                  setDraft({ ...draft, startLocal, endLocal: toDatetimeLocal(newEnd) });
                }}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Ends</label>
              <input
                type="datetime-local"
                disabled={readOnly}
                value={draft.endLocal}
                onChange={(e) => setDraft({ ...draft, endLocal: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {!readOnly && (
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5">
              <input
                type="checkbox"
                checked={draft.addMeet}
                onChange={(e) => setDraft({ ...draft, addMeet: e.target.checked })}
                className="h-4 w-4 accent-sky-600"
              />
              <Video className="h-4 w-4 text-sky-600" />
              <span className="text-sm font-medium text-slate-700">Add Google Meet video conferencing</span>
            </label>
          )}

          {draft.meetLink && (
            <a
              href={draft.meetLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-lg bg-sky-50 px-3 py-2.5 text-sm font-medium text-sky-700 hover:bg-sky-100"
            >
              <Video className="h-4 w-4" />
              Join Google Meet
            </a>
          )}

          <div className="flex items-start gap-2.5">
            <Users className="mt-2 h-4 w-4 text-slate-400" />
            <input
              disabled={readOnly}
              value={draft.attendees}
              onChange={(e) => setDraft({ ...draft, attendees: e.target.value })}
              placeholder="Add guests (comma-separated emails)"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="mt-2 h-4 w-4 text-slate-400" />
            <input
              disabled={readOnly}
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="Add location"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-start gap-2.5">
            <AlignLeft className="mt-2 h-4 w-4 text-slate-400" />
            <textarea
              disabled={readOnly}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Add description"
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-between border-t px-5 py-3">
          <div>
            {isEditing && canEdit && (
              <button
                onClick={remove}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              {readOnly ? "Close" : "Cancel"}
            </button>
            {!readOnly && (
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Save" : "Create"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
