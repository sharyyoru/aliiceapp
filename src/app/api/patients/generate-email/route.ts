import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  generateContentWithFallback,
  GeminiBillingError,
} from "@/lib/geminiWithFallback";

export const runtime = "nodejs";
export const maxDuration = 60;

type GeneratePatientEmailRequestBody = {
  patientId?: string;
  description?: string;
  tone?: string;
  appointmentId?: string;
};

/**
 * Format an appointment start time in the clinic's local timezone so the AI
 * references the real date/time instead of inventing one.
 */
function formatAppointmentDateTime(startTime: string): string {
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return startTime;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Zurich",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey || apiKey === "your-gemini-api-key") {
      return NextResponse.json(
        {
          error:
            "AI email generation is not configured: GEMINI_API_KEY is missing or empty on the server.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as GeneratePatientEmailRequestBody;
    const patientId = body.patientId?.trim();
    const description = (body.description || "").trim();
    const tone = (body.tone || "professional and reassuring").trim();
    const appointmentId = body.appointmentId?.trim();

    if (!patientId || !description) {
      return NextResponse.json(
        { error: "patientId and description are required" },
        { status: 400 },
      );
    }

    const { data: patient, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("id, first_name, last_name, email, phone")
      .eq("id", patientId)
      .maybeSingle();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: patientError?.message ?? "Patient not found" },
        { status: 404 },
      );
    }

    const firstName = (patient.first_name as string | null) ?? "";
    const lastName = (patient.last_name as string | null) ?? "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const email = (patient.email as string | null) ?? null;
    const phone = (patient.phone as string | null) ?? null;

    const patientSummaryLines: string[] = [];
    if (fullName) patientSummaryLines.push(`Name: ${fullName}`);
    if (email) patientSummaryLines.push(`Email: ${email}`);
    if (phone) patientSummaryLines.push(`Phone: ${phone}`);

    const patientSummary =
      patientSummaryLines.length > 0
        ? patientSummaryLines.join("\n")
        : "Basic identity and contact details are not available.";

    // Ground the model with the patient's real appointment (if any) so it does
    // not invent dates/times. Use the requested appointment, otherwise the next
    // upcoming one, otherwise the most recent past one.
    let appointmentContext = "No appointment data is available for this patient.";
    try {
      const nowIso = new Date().toISOString();
      let appointmentRow: {
        start_time: string | null;
        end_time: string | null;
        status: string | null;
        reason: string | null;
        location: string | null;
      } | null = null;

      if (appointmentId) {
        const { data } = await supabaseAdmin
          .from("appointments")
          .select("start_time, end_time, status, reason, location")
          .eq("id", appointmentId)
          .maybeSingle();
        appointmentRow = data ?? null;
      }

      if (!appointmentRow) {
        const { data: upcoming } = await supabaseAdmin
          .from("appointments")
          .select("start_time, end_time, status, reason, location")
          .eq("patient_id", patientId)
          .gte("start_time", nowIso)
          .order("start_time", { ascending: true })
          .limit(1)
          .maybeSingle();
        appointmentRow = upcoming ?? null;
      }

      if (!appointmentRow) {
        const { data: past } = await supabaseAdmin
          .from("appointments")
          .select("start_time, end_time, status, reason, location")
          .eq("patient_id", patientId)
          .lt("start_time", nowIso)
          .order("start_time", { ascending: false })
          .limit(1)
          .maybeSingle();
        appointmentRow = past ?? null;
      }

      if (appointmentRow?.start_time) {
        const lines = [`Date & time: ${formatAppointmentDateTime(appointmentRow.start_time)}`];
        if (appointmentRow.reason) lines.push(`Reason: ${appointmentRow.reason}`);
        if (appointmentRow.location) lines.push(`Location: ${appointmentRow.location}`);
        if (appointmentRow.status) lines.push(`Status: ${appointmentRow.status}`);
        appointmentContext = lines.join("\n");
      }
    } catch (apptError) {
      console.error("Failed to load appointment context for email generation", apptError);
    }

    const systemPrompt =
      "You are an email assistant for Aesthetics Clinic. You write concise, empathetic, medically appropriate emails to a single patient. Always output strict JSON with keys 'subject' and 'body' (plain text, no HTML). You never invent factual details.";

    const userPrompt = `
We are composing a one-off email to this specific patient.

Patient details:
${patientSummary}

Known appointment details (the ONLY appointment facts you may use):
${appointmentContext}

Goal / context for the email:
${description}

Tone: ${tone}.

Requirements:
- Output STRICT JSON only, no markdown, with shape: {"subject": string, "body": string}.
- 'body' must be plain text suitable for pasting into an email textarea; use paragraphs separated by blank lines.
- Start with a natural greeting to the patient (for example, "Dear ${firstName || "patient"},").
- Do NOT include an email signature or clinic contact information; that will be appended separately.

CRITICAL - do not fabricate:
- NEVER invent or guess specific dates, times, appointment details, prices, meeting/video links, phone numbers, physical addresses, or email addresses.
- Only state a concrete date/time if it appears in the "Known appointment details" above; otherwise use a clearly-marked placeholder such as [date], [time], or [meeting link] that the staff can fill in.
- Do NOT write any email address or URL that was not explicitly provided.
- If the goal requires information you do not have, leave a bracketed placeholder instead of making something up.
`;

    const result = await generateContentWithFallback({
      apiKey,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      verbose: true,
    });

    const rawContent = (result.response.text() || "").trim();

    if (!rawContent) {
      return NextResponse.json(
        { error: "The AI returned an empty response. Please try again." },
        { status: 502 },
      );
    }

    let subject = "";
    let bodyText = "";

    try {
      // Remove markdown code blocks if present
      const cleanedContent = rawContent.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedContent) as {
        subject?: string;
        body?: string;
      };

      subject = (parsed.subject || "").trim();
      bodyText = (parsed.body || "").trim();
    } catch {
      // Model ignored the JSON instruction: fall back to using its raw text as
      // the body rather than silently returning a placeholder email.
      bodyText = rawContent;
    }

    if (!bodyText) {
      return NextResponse.json(
        { error: "The AI did not return any email content. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ subject: subject || "Clinic update", body: bodyText });
  } catch (error) {
    console.error("Error generating patient email via Gemini", error);
    // Report a depleted AI account as itself. Collapsing it into a generic
    // 500 is why "AI email generation is broken" with no visible cause.
    if (error instanceof GeminiBillingError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 503 },
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to generate email: ${message}` },
      { status: 500 },
    );
  }
}
