import type { SupabaseClient } from "@supabase/supabase-js";

// Doctor-specific capacity: these doctors can have 3 concurrent appointments,
// every other provider has a capacity of 1.
export const MULTI_CAPACITY_DOCTORS = ["xavier-tenorio", "cesar-rodriguez"];

export function getMaxCapacity(doctorSlug: string | null | undefined): number {
  if (!doctorSlug) return 1;
  return MULTI_CAPACITY_DOCTORS.includes(doctorSlug) ? 3 : 1;
}

type AppointmentRow = {
  id: string;
  start_time: string;
  end_time: string;
  status?: string | null;
  reason: string | null;
  no_patient?: boolean | null;
  provider_id: string | null;
};

/**
 * Resolve a provider id for a given doctor display name.
 *
 * IMPORTANT: PostgREST `.or()` filter strings use `*` as the wildcard (NOT `%`).
 * Both the availability check and the booking guard MUST use this exact same
 * resolution so they always operate on the same provider / appointment set.
 */
export async function resolveProviderId(
  supabase: SupabaseClient,
  doctorName: string | null | undefined
): Promise<string | null> {
  if (!doctorName) return null;
  const clean = doctorName.replace(/^Dr\.\s*/i, "").trim();
  if (!clean) return null;
  const firstName = clean.split(" ")[0];

  const { data } = await supabase
    .from("providers")
    .select("id")
    .or(`name.ilike.*${clean}*,name.ilike.*${firstName}*`)
    .limit(1)
    .maybeSingle();

  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Build a predicate that decides whether an appointment belongs to the given
 * doctor. Matches by provider_id first, then falls back to the `[Doctor: Name]`
 * marker embedded in the appointment reason. This is shared so the availability
 * display and the booking guard never disagree on attribution.
 */
export function makeDoctorMatcher(
  providerId: string | null,
  doctorName: string | null | undefined
) {
  const doctorNameLower = doctorName
    ? doctorName.toLowerCase().replace(/^dr\.\s*/i, "").trim()
    : "";

  return (apt: { provider_id: string | null; reason: string | null }): boolean => {
    if (!doctorName) return true;
    if (providerId && apt.provider_id === providerId) return true;
    if (apt.reason) {
      const match = apt.reason.match(/\[Doctor:\s*(.+?)\s*\]/i);
      if (match && match[1].toLowerCase().includes(doctorNameLower)) return true;
    }
    return false;
  };
}

/**
 * Count the maximum number of concurrent patient appointments inside the
 * requested window, evaluated per 30-minute sub-slot. This matches exactly the
 * per-slot model used to render available time slots, so a start time that is
 * shown as available will pass this check (and vice-versa).
 */
function maxConcurrentInWindow(
  patientAppointments: AppointmentRow[],
  windowStartMs: number,
  windowEndMs: number
): number {
  const STEP = 30 * 60 * 1000;
  let maxConcurrent = 0;
  for (let t = windowStartMs; t < windowEndMs; t += STEP) {
    const slotStart = t;
    const slotEnd = t + STEP;
    const concurrent = patientAppointments.filter((apt) => {
      const aptStart = new Date(apt.start_time).getTime();
      const aptEnd = new Date(apt.end_time).getTime();
      return aptStart < slotEnd && aptEnd > slotStart;
    }).length;
    if (concurrent > maxConcurrent) maxConcurrent = concurrent;
  }
  return maxConcurrent;
}

export type BookableResult = {
  ok: boolean;
  capacity: number;
  count: number;
  providerId: string | null;
  blocked: boolean;
};

/**
 * Authoritative check used at booking time. Returns whether a specific start
 * time is bookable for the given doctor/treatment using the SAME provider
 * resolution, doctor matching and per-slot capacity model as the availability
 * endpoint that produced the displayed slots.
 */
export async function checkStartTimeBookable(
  supabase: SupabaseClient,
  args: {
    doctorName: string | null | undefined;
    doctorSlug: string | null | undefined;
    startIso: string;
    durationMinutes: number;
    providerId?: string | null;
  }
): Promise<BookableResult> {
  const { doctorName, doctorSlug, startIso, durationMinutes } = args;
  const capacity = getMaxCapacity(doctorSlug);

  const providerId =
    args.providerId !== undefined
      ? args.providerId
      : await resolveProviderId(supabase, doctorName);

  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, status, reason, no_patient, provider_id")
    .lt("start_time", end.toISOString())
    .gt("end_time", start.toISOString())
    .neq("status", "cancelled");

  const matchesDoctor = makeDoctorMatcher(providerId, doctorName);
  const matched = (appointments || []).filter(matchesDoctor);

  const blocking = matched.filter((apt) => apt.no_patient === true);
  if (blocking.length > 0) {
    return { ok: false, capacity, count: capacity, providerId, blocked: true };
  }

  const patientAppointments = matched.filter((apt) => apt.no_patient !== true);
  const count = maxConcurrentInWindow(
    patientAppointments,
    start.getTime(),
    end.getTime()
  );

  return { ok: count < capacity, capacity, count, providerId, blocked: false };
}
