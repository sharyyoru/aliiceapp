import {
  GoogleGenerativeAI,
  GenerationConfig,
  Part,
  Content,
  GenerateContentResult,
} from "@google/generative-ai";

/**
 * Model chain, most capable first.
 *
 * Google has now retired every model this app originally pinned: 1.5-flash,
 * gemini-pro, and 2.0-flash all answer
 *   404 "This model models/… is no longer available"
 * so each AI feature silently failed on every call. models.list cannot be
 * trusted as an availability signal either — it still advertises models that
 * 404 for a key on a new project — so every entry below was verified with a
 * real generateContent call on the current key.
 *
 * gemini-3.8-flash is Google's own recommendation in that 404. The two
 * "-latest" aliases follow whatever Google currently ships, so when the
 * pinned model is eventually retired the chain degrades to a working model
 * instead of taking every AI feature down: isModelNotFoundError treats a 404
 * as "try the next one".
 */
export const MODEL_FALLBACK_CHAIN = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
];

/**
 * Billing/credit exhaustion, as opposed to per-minute rate limiting.
 *
 * Google answers this with HTTP 402 and `RESOURCE_EXHAUSTED`, which reads
 * like a 429 but is account-wide: every model fails identically, so trying
 * the next one in the chain only delays the error. It is also not something
 * staff can fix by retrying, so it must be reported as itself rather than
 * collapsed into "Failed to generate email".
 */
export class GeminiBillingError extends Error {
  readonly code = "GEMINI_BILLING_EXHAUSTED";
  constructor(message: string) {
    super(message);
    this.name = "GeminiBillingError";
  }
}

function isBillingError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("402") ||
    message.toLowerCase().includes("prepayment credits are depleted") ||
    message.toLowerCase().includes("billing")
  );
}

/** Errors that indicate the model itself doesn't exist / isn't usable. */
function isModelNotFoundError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("404") ||
    message.toLowerCase().includes("no longer available") ||
    message.toLowerCase().includes("not found") ||
    message.toLowerCase().includes("is not supported")
  );
}

function isRateLimitError(err: unknown): boolean {
  if (!err) return false;
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("429") ||
    message.toLowerCase().includes("too many requests") ||
    message.toLowerCase().includes("resource exhausted") ||
    message.toLowerCase().includes("quota")
  );
}

function isRetryableError(err: unknown): boolean {
  if (isRateLimitError(err)) return true;
  const message = err instanceof Error ? err.message : String(err);
  // 5xx and network errors are retryable
  return (
    /\b(500|502|503|504)\b/.test(message) ||
    message.toLowerCase().includes("fetch failed")
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type GenerateArgs = {
  apiKey: string;
  systemInstruction?: string;
  generationConfig?: GenerationConfig;
  contents: Content[];
  /** If true, log every attempt */
  verbose?: boolean;
};

/**
 * Call Gemini's generateContent with:
 *  - Automatic retry with exponential backoff on transient errors
 *  - Automatic fallback to alternative Gemini models on 404 (retired) or 429
 */
export async function generateContentWithFallback(
  args: GenerateArgs,
): Promise<GenerateContentResult & { modelUsed: string }> {
  const { apiKey, systemInstruction, generationConfig, contents, verbose } = args;
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError: unknown = null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      generationConfig,
    });

    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (verbose) {
          console.log(`[gemini] Trying model=${modelName} attempt=${attempt}`);
        }
        const result = await model.generateContent({ contents });
        // Which model actually answered is attached so callers can log it.
        return Object.assign(result, { modelUsed: modelName });
      } catch (err) {
        lastError = err;

        // Account-wide: every model will fail the same way, so stop here and
        // say what is actually wrong.
        if (isBillingError(err)) {
          throw new GeminiBillingError(
            "The Gemini API account has no remaining credits, so AI text generation is unavailable. " +
              "Top up the Google AI Studio billing account to restore it.",
          );
        }

        const rateLimited = isRateLimitError(err);
        const retryable = isRetryableError(err);

        if (verbose) {
          console.warn(
            `[gemini] model=${modelName} attempt=${attempt} failed (rateLimited=${rateLimited}, retryable=${retryable}):`,
            err instanceof Error ? err.message : err,
          );
        }

        // 429: skip remaining retries for this model and move to next fallback
        if (rateLimited) break;

        // Model doesn't exist (retired / not enabled): skip to next fallback
        if (isModelNotFoundError(err)) {
          if (verbose) {
            console.warn(
              `[gemini] model=${modelName} unavailable, moving to next fallback`,
            );
          }
          break;
        }

        if (!retryable || attempt === maxAttempts) throw err;

        // Exponential backoff: 500ms, 1500ms
        await delay(500 * Math.pow(3, attempt - 1));
      }
    }
  }

  throw lastError ?? new Error("All Gemini model fallbacks failed");
}

export type { Part, Content };
