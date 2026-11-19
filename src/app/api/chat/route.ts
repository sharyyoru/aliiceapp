import { NextResponse } from "next/server";
import { aiErrorMessage, generateAiText, isAiConfigured } from "@/lib/aiText";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function POST(request: Request) {
  try {
    if (!isAiConfigured()) {
      return NextResponse.json(
        { error: "AI is not configured: set GEMINI_API_KEY (or OPENAI_API_KEY)" },
        { status: 500 },
      );
    }

    const { messages, patientId } = (await request.json()) as {
      messages?: ChatMessage[];
      patientId?: string | null;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing messages array" },
        { status: 400 },
      );
    }

    const trimmed = messages
      .map((message) => ({
        role: message.role,
        content: message.content?.toString().slice(0, 8000) ?? "",
      }))
      .filter((message) => message.content.trim().length > 0);

    if (trimmed.length === 0) {
      return NextResponse.json(
        { error: "Messages must contain non-empty content" },
        { status: 400 },
      );
    }

    let systemInstruction =
      "You are Aliice, an AI assistant embedded inside a medical CRM. You help staff with bookings, post-op documentation, deals/pipelines, workflows, and patient or insurance communication. Always behave as an internal staff-facing tool: be concise, precise, and never invent real patient data. When you draft content that will be sent to or shown to a patient (emails, SMS, WhatsApp messages, document templates, etc.), you MUST use the clinic's CRM template variables instead of hard-coding patient or deal details. Use variables like {{patient.first_name}}, {{patient.last_name}}, {{patient.email}}, {{patient.phone}}, {{deal.title}}, {{deal.pipeline}}, and {{deal.notes}} where appropriate. Do not invent new variable names that are not part of the CRM; if you need a field that does not exist, describe it in natural language instead of creating a fake variable.";

    if (patientId) {
      systemInstruction +=
        "\n\nThis chat has been linked to a specific patient in the clinic's CRM. When staff refer to 'this patient' or 'the patient', assume they mean that linked patient. However, you still must never insert real patient details directly; always refer to them using the CRM template variables like {{patient.first_name}} and {{patient.last_name}} rather than concrete values.";
    }

    const text = await generateAiText({
      system: systemInstruction,
      messages: trimmed
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({
          role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: msg.content,
        })),
      temperature: 0.6,
    });

    if (!text) {
      return NextResponse.json(
        { error: "No response from Gemini" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: {
        role: "assistant",
        content: text,
      },
    });
  } catch (error) {
    console.error("Error in /api/chat", error);
    return NextResponse.json(
      { error: aiErrorMessage(error, "Failed to generate chat response") },
      { status: 500 },
    );
  }
}
