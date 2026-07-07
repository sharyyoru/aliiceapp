/**
 * Gmail integration for the admin area.
 *
 * Each admin connects their own Google account via OAuth2. We store the
 * refresh token server-side (admin_gmail_accounts) and mint short-lived
 * access tokens on demand. Admin emails are then sent through the Gmail API
 * (from the admin's real address) and replies are synced back by reading the
 * Gmail thread.
 *
 * Uses plain fetch — no googleapis dependency required.
 */

import { supabaseAdmin } from "@/lib/supabaseAdmin";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const GOOGLE_OAUTH_REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI || `${APP_URL}/api/admin/gmail/callback`;

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

// Scopes: send mail, read threads (for reply sync), read the account email,
// and manage Google Calendar events (agenda + Google Meet links).
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

// Scope required to read/write calendar events.
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function hasCalendarScope(scope: string | null | undefined): boolean {
  return !!scope && scope.includes(CALENDAR_SCOPE);
}

export function isGmailConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET;
}

// ─── base64url helpers ──────────────────────────────────────────────────────
export function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf-8");
}

// ─── OAuth ──────────────────────────────────────────────────────────────────
export function getAuthUrl(state: string): string {
  const url = new URL(OAUTH_AUTH_URL);
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", GOOGLE_OAUTH_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent"); // always return a refresh_token
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  });
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return (await res.json()) as TokenResponse;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    grant_type: "refresh_token",
  });
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return (await res.json()) as TokenResponse;
}

export async function getGoogleEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}

// ─── Account storage ─────────────────────────────────────────────────────────
export type GmailAccount = {
  admin_email: string;
  google_email: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expiry: string | null;
  scope: string | null;
};

export async function getGmailAccount(adminEmail: string): Promise<GmailAccount | null> {
  const { data } = await supabaseAdmin
    .from("admin_gmail_accounts")
    .select("admin_email, google_email, access_token, refresh_token, token_expiry, scope")
    .eq("admin_email", adminEmail)
    .maybeSingle();
  return (data as GmailAccount) || null;
}

/**
 * Return a valid access token for the admin, refreshing it if it has expired.
 * Returns null when the admin has not connected Gmail.
 */
export async function getValidAccessToken(
  adminEmail: string
): Promise<{ accessToken: string; googleEmail: string } | null> {
  const account = await getGmailAccount(adminEmail);
  if (!account || !account.refresh_token) return null;

  const now = Date.now();
  const expiry = account.token_expiry ? new Date(account.token_expiry).getTime() : 0;

  // 60s safety margin.
  if (account.access_token && expiry - 60_000 > now) {
    return { accessToken: account.access_token, googleEmail: account.google_email };
  }

  const refreshed = await refreshAccessToken(account.refresh_token);
  if (!refreshed.access_token) {
    console.error("[gmail] token refresh failed:", refreshed.error, refreshed.error_description);
    return null;
  }

  const newExpiry = new Date(now + (refreshed.expires_in ?? 3600) * 1000).toISOString();
  await supabaseAdmin
    .from("admin_gmail_accounts")
    .update({ access_token: refreshed.access_token, token_expiry: newExpiry, updated_at: new Date().toISOString() })
    .eq("admin_email", adminEmail);

  return { accessToken: refreshed.access_token, googleEmail: account.google_email };
}

// ─── Sending ──────────────────────────────────────────────────────────────────
function encodeHeaderValue(value: string): string {
  // RFC 2047 encode when non-ASCII characters are present (e.g. accents).
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

export function buildRawEmail(opts: {
  from: string;
  to: string;
  subject: string;
  html: string;
  inReplyTo?: string | null;
  references?: string | null;
}): string {
  const headers = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${encodeHeaderValue(opts.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ];
  if (opts.inReplyTo) {
    headers.push(`In-Reply-To: ${opts.inReplyTo}`);
    headers.push(`References: ${opts.references || opts.inReplyTo}`);
  }
  // Body base64 (not url-safe) per MIME, wrapped for safety.
  const bodyB64 = Buffer.from(opts.html, "utf-8").toString("base64").replace(/(.{76})/g, "$1\r\n");
  const raw = `${headers.join("\r\n")}\r\n\r\n${bodyB64}`;
  return base64UrlEncode(raw);
}

export type GmailSendResult = {
  ok: boolean;
  messageId?: string;
  threadId?: string;
  rfc822MessageId?: string;
  error?: string;
};

export async function sendGmailMessage(
  accessToken: string,
  opts: {
    from: string;
    to: string;
    subject: string;
    html: string;
    threadId?: string | null;
    inReplyTo?: string | null;
    references?: string | null;
  }
): Promise<GmailSendResult> {
  const raw = buildRawEmail(opts);
  const payload: Record<string, unknown> = { raw };
  if (opts.threadId) payload.threadId = opts.threadId;

  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as { id?: string; threadId?: string; error?: { message?: string } };
  if (!res.ok || !data.id) {
    return { ok: false, error: data.error?.message || `Gmail send failed (${res.status})` };
  }

  // Fetch the sent message's RFC822 Message-ID for clean threading on replies.
  let rfc822MessageId: string | undefined;
  try {
    const meta = await getMessage(accessToken, data.id, ["Message-ID"]);
    rfc822MessageId = meta?.headers["message-id"];
  } catch {
    // best-effort
  }

  return { ok: true, messageId: data.id, threadId: data.threadId, rfc822MessageId };
}

// ─── Reading ──────────────────────────────────────────────────────────────────
export type ParsedMessage = {
  id: string;
  threadId: string;
  headers: Record<string, string>;
  from: string;
  to: string;
  subject: string;
  date: string | null;
  html: string;
  rfc822MessageId: string | null;
};

function decodeBody(payload: GmailPayload): string {
  // Prefer text/html, fall back to text/plain, recursing into multiparts.
  const walk = (part: GmailPayload): { html?: string; text?: string } => {
    const mime = part.mimeType || "";
    const dataStr = part.body?.data ? base64UrlDecode(part.body.data) : "";
    if (mime === "text/html" && dataStr) return { html: dataStr };
    if (mime === "text/plain" && dataStr) return { text: dataStr };
    let html: string | undefined;
    let text: string | undefined;
    for (const child of part.parts || []) {
      const r = walk(child);
      html = html || r.html;
      text = text || r.text;
    }
    return { html, text };
  };
  const { html, text } = walk(payload);
  if (html) return html;
  if (text) {
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped.split(/\r?\n/).map((l) => (l.length === 0 ? "<br />" : l)).join("<br />");
  }
  return "<p>(no content)</p>";
}

type GmailPayload = {
  mimeType?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string };
  parts?: GmailPayload[];
};

type GmailMessageRaw = {
  id: string;
  threadId: string;
  internalDate?: string;
  payload?: GmailPayload;
};

function headerMap(payload?: GmailPayload): Record<string, string> {
  const map: Record<string, string> = {};
  for (const h of payload?.headers || []) map[h.name.toLowerCase()] = h.value;
  return map;
}

export async function getMessage(
  accessToken: string,
  id: string,
  metadataHeaders?: string[]
): Promise<{ headers: Record<string, string>; raw: GmailMessageRaw } | null> {
  const url = new URL(`${GMAIL_API}/messages/${id}`);
  if (metadataHeaders && metadataHeaders.length) {
    url.searchParams.set("format", "metadata");
    for (const h of metadataHeaders) url.searchParams.append("metadataHeaders", h);
  } else {
    url.searchParams.set("format", "full");
  }
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const raw = (await res.json()) as GmailMessageRaw;
  return { headers: headerMap(raw.payload), raw };
}

export async function getThreadMessages(accessToken: string, threadId: string): Promise<ParsedMessage[]> {
  const res = await fetch(`${GMAIL_API}/threads/${threadId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { messages?: GmailMessageRaw[] };
  const messages = data.messages || [];
  return messages.map((m) => {
    const headers = headerMap(m.payload);
    const dateIso = m.internalDate ? new Date(Number(m.internalDate)).toISOString() : null;
    return {
      id: m.id,
      threadId: m.threadId,
      headers,
      from: headers["from"] || "",
      to: headers["to"] || "",
      subject: headers["subject"] || "(no subject)",
      date: dateIso,
      html: m.payload ? decodeBody(m.payload) : "<p>(no content)</p>",
      rfc822MessageId: headers["message-id"] || null,
    };
  });
}

// ─── Multipart MIME with attachment ──────────────────────────────────────────
function buildRawEmailWithAttachments(opts: {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string; encoding: "base64"; contentType: string }>;
}): string {
  const boundary = `boundary_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${encodeHeaderValue(opts.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ];
  if (opts.replyTo) headers.push(`Reply-To: ${opts.replyTo}`);

  const htmlPart = [
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(opts.html, "utf-8").toString("base64").replace(/(.{76})/g, "$1\r\n"),
  ].join("\r\n");

  const attachParts = (opts.attachments || []).map((att) => [
    `--${boundary}`,
    `Content-Type: ${att.contentType}; name="${att.filename}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${att.filename}"`,
    "",
    att.content.replace(/(.{76})/g, "$1\r\n"),
  ].join("\r\n"));

  const raw = [
    headers.join("\r\n"),
    "",
    htmlPart,
    ...attachParts,
    `--${boundary}--`,
  ].join("\r\n");

  return base64UrlEncode(raw);
}

// ─── System Email Sending ─────────────────────────────────────────────────────
/**
 * Send a system email (contact form, signup automation, etc.) via Gmail.
 * Uses a default admin Gmail account specified by SYSTEM_GMAIL_ADMIN_EMAIL env var.
 * Falls back to the first connected admin account if not specified.
 */
export async function sendSystemEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string; encoding: "base64"; contentType: string }>;
}): Promise<GmailSendResult> {
  const systemAdminEmail = process.env.SYSTEM_GMAIL_ADMIN_EMAIL || "info@aliice.app";

  const tokenData = await getValidAccessToken(systemAdminEmail);
  if (!tokenData) {
    console.error("[Gmail] No valid access token for system admin:", systemAdminEmail);
    return { ok: false, error: "Gmail not configured for system emails" };
  }

  const from = tokenData.googleEmail;

  if (opts.attachments && opts.attachments.length > 0) {
    const raw = buildRawEmailWithAttachments({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
      attachments: opts.attachments,
    });
    const res = await fetch(`${GMAIL_API}/messages/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenData.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
    const data = (await res.json()) as { id?: string; threadId?: string; error?: { message?: string } };
    if (!res.ok || !data.id) return { ok: false, error: data.error?.message || `Gmail send failed (${res.status})` };
    return { ok: true, messageId: data.id, threadId: data.threadId };
  }

  return sendGmailMessage(tokenData.accessToken, {
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
