import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import OpenAI from "openai";

const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

const PLACEHOLDER_KEYS = new Set(["your-gemini-api-key", "your-openai-api-key"]);

export type AiMessage = { role: "user" | "assistant"; content: string };

type GenerateOptions = {
  system?: string;
  messages: AiMessage[] | string;
  temperature?: number;
  maxOutputTokens?: number;
};

export class AiGenerationError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

function envKey(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && !PLACEHOLDER_KEYS.has(value) ? value : null;
}

export function isAiConfigured(): boolean {
  return Boolean(envKey("GEMINI_API_KEY") || envKey("OPENAI_API_KEY"));
}

function geminiModels(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  return preferred
    ? [preferred, ...DEFAULT_GEMINI_MODELS.filter((m) => m !== preferred)]
    : DEFAULT_GEMINI_MODELS;
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function errorStatus(err: unknown): number | undefined {
  const status = (err as { status?: unknown })?.status;
  return typeof status === "number" ? status : undefined;
}

function isModelUnavailable(err: unknown): boolean {
  const msg = errorText(err).toLowerCase();
  return (
    errorStatus(err) === 404 ||
    msg.includes("[404") ||
    msg.includes("not found") ||
    msg.includes("is not supported") ||
    msg.includes("no longer available") ||
    msg.includes("deprecated")
  );
}

function friendlyError(provider: string, err: unknown): string {
  const msg = errorText(err);
  const lower = msg.toLowerCase();
  const status = errorStatus(err);
  if (lower.includes("api key not valid") || lower.includes("api_key_invalid") || status === 401 || lower.includes("incorrect api key")) {
    return `${provider} API key is invalid or expired`;
  }
  if (status === 403 || lower.includes("permission") || lower.includes("[403")) {
    return `${provider} API key is not allowed to use this model`;
  }
  if (status === 429 || lower.includes("quota") || lower.includes("[429") || lower.includes("rate limit")) {
    return `${provider} quota or rate limit exceeded, please try again later`;
  }
  return `${provider} request failed: ${msg.slice(0, 200)}`;
}

function toMessages(messages: AiMessage[] | string): AiMessage[] {
  return typeof messages === "string" ? [{ role: "user", content: messages }] : messages;
}

async function generateWithGemini(apiKey: string, opts: GenerateOptions): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const contents: Content[] = toMessages(opts.messages).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let lastError: unknown = null;
  for (const modelName of geminiModels()) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        ...(opts.system ? { systemInstruction: opts.system } : {}),
      });
      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: opts.temperature,
          maxOutputTokens: opts.maxOutputTokens,
        },
      });
      const text = result.response.text();
      if (text) return text;
      lastError = new Error(`Empty response from ${modelName}`);
    } catch (err) {
      lastError = err;
      if (!isModelUnavailable(err)) break;
      console.warn(`Gemini model ${modelName} unavailable, trying next`, errorText(err));
    }
  }
  throw new AiGenerationError(friendlyError("Gemini", lastError));
}

async function generateWithOpenAI(apiKey: string, opts: GenerateOptions): Promise<string> {
  const client = new OpenAI({ apiKey });
  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      temperature: opts.temperature,
      max_tokens: opts.maxOutputTokens,
      messages: [
        ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
        ...toMessages(opts.messages),
      ],
    });
    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from OpenAI");
    return text;
  } catch (err) {
    throw new AiGenerationError(friendlyError("OpenAI", err));
  }
}

/**
 * Generate text with Gemini (falling back across current models), then OpenAI
 * if Gemini is unavailable and OPENAI_API_KEY is set.
 */
export async function generateAiText(opts: GenerateOptions): Promise<string> {
  const geminiKey = envKey("GEMINI_API_KEY");
  const openaiKey = envKey("OPENAI_API_KEY");

  if (!geminiKey && !openaiKey) {
    throw new AiGenerationError(
      "AI is not configured: set GEMINI_API_KEY (or OPENAI_API_KEY)",
      500,
    );
  }

  const errors: string[] = [];
  if (geminiKey) {
    try {
      return await generateWithGemini(geminiKey, opts);
    } catch (err) {
      console.error("Gemini generation failed", err);
      errors.push(errorText(err));
    }
  }
  if (openaiKey) {
    try {
      return await generateWithOpenAI(openaiKey, opts);
    } catch (err) {
      console.error("OpenAI generation failed", err);
      errors.push(errorText(err));
    }
  }
  throw new AiGenerationError(errors.join("; "));
}

export function aiErrorMessage(err: unknown, fallback: string): string {
  return err instanceof AiGenerationError ? err.message : fallback;
}
