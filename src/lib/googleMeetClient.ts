"use client";

import { supabaseClient } from "@/lib/supabaseClient";

export type GoogleMeetStatus = {
  configured: boolean;
  connected: boolean;
  googleEmail?: string | null;
  scope?: "organization" | "user";
  error?: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabaseClient.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchGoogleMeetStatus(organizationId?: string | null): Promise<GoogleMeetStatus> {
  const qs = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : "";
  const res = await fetch(`/api/google-meet/status${qs}`, { headers: await authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { configured: true, connected: false, error: data.error || "Failed to load status" };
  return data as GoogleMeetStatus;
}

export async function startGoogleMeetConnect(organizationId?: string | null, returnTo?: string): Promise<void> {
  const res = await fetch("/api/google-meet/connect", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ organizationId, returnTo }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || "Failed to start Google sign-in");
  window.location.href = data.url as string;
}

export async function disconnectGoogleMeet(organizationId?: string | null): Promise<void> {
  const res = await fetch("/api/google-meet/disconnect", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ organizationId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to disconnect");
  }
}

export async function addAppointmentMeet(
  appointmentId: string,
  invitePatient = true
): Promise<{ meetLink: string | null }> {
  const res = await fetch(`/api/appointments/${appointmentId}/google-meet`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ invitePatient }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to create Google Meet link");
  return { meetLink: data.meetLink ?? null };
}

export async function removeAppointmentMeet(appointmentId: string): Promise<void> {
  const res = await fetch(`/api/appointments/${appointmentId}/google-meet`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to remove Google Meet link");
  }
}

/** Loads Meet links for appointments; tolerates the columns not existing yet. */
export async function fetchAppointmentMeetLinks(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const result: Record<string, string> = {};
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await supabaseClient
      .from("appointments")
      .select("id, meet_link")
      .in("id", ids.slice(i, i + 200))
      .not("meet_link", "is", null);
    if (error) return result;
    for (const row of (data || []) as { id: string; meet_link: string | null }[]) {
      if (row.meet_link) result[row.id] = row.meet_link;
    }
  }
  return result;
}
