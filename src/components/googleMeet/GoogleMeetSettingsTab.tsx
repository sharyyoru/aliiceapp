"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Video, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  disconnectGoogleMeet,
  fetchGoogleMeetStatus,
  startGoogleMeetConnect,
  type GoogleMeetStatus,
} from "@/lib/googleMeetClient";

const ERROR_LABELS: Record<string, string> = {
  access_denied: "Google sign-in was cancelled.",
  calendar_permission_not_granted: "Calendar permission was not granted. Please tick the Google Calendar checkbox on the consent screen.",
  storage_failed: "Could not save the connection. Make sure the Google Meet database migration has been applied.",
};

export default function GoogleMeetSettingsTab() {
  const { organizationId } = useOrganization();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GoogleMeetStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setStatus(await fetchGoogleMeetStatus(organizationId));
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const result = searchParams.get("meet");
    if (result === "connected") setMessage({ type: "ok", text: "Google account connected. Video calls are enabled." });
    if (result === "error") {
      const reason = searchParams.get("reason") || "";
      setMessage({ type: "error", text: ERROR_LABELS[reason] || `Google connection failed (${reason || "unknown error"}).` });
    }
  }, [searchParams]);

  async function handleConnect() {
    setBusy(true);
    setMessage(null);
    try {
      await startGoogleMeetConnect(organizationId, "/settings?tab=google-meet");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to connect" });
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    if (!window.confirm("Disconnect Google Meet? Existing Meet links keep working, but no new ones can be created.")) return;
    setBusy(true);
    setMessage(null);
    try {
      await disconnectGoogleMeet(organizationId);
      await load();
      setMessage({ type: "ok", text: "Google account disconnected." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to disconnect" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Video className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-800">Google Meet video calls</h2>
            <p className="mt-1 text-sm text-slate-500">
              Connect a Google account to schedule video consultations. Each video appointment gets a Google Meet
              link, a Google Calendar event, and an email invitation to the patient. Everyone in your clinic can
              then add Meet links to appointments from the calendar.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          {!status ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking connection…
            </div>
          ) : !status.configured ? (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Google is not configured on this server (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing).
            </div>
          ) : status.connected ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>
                  Connected as <strong>{status.googleEmail}</strong>
                  {status.scope === "organization" ? " for your clinic" : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleConnect()}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Change account
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDisconnect()}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">Not connected.</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleConnect()}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                Connect Google account
              </button>
            </div>
          )}
          {status?.error ? <p className="mt-3 text-xs text-red-600">{status.error}</p> : null}
          {message ? (
            <p className={`mt-3 text-sm ${message.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
