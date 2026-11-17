import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exchangeCodeForTokens, getGoogleEmail } from "@/lib/gmail";
import { handleMeetCallback, MEET_NONCE_COOKIE, parseMeetState } from "@/lib/googleMeet";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state") || "";
  const oauthError = url.searchParams.get("error");

  // Clinic Google Meet connections share this registered redirect URI.
  const meetState = parseMeetState(stateRaw);
  if (meetState) {
    const nonce = request.cookies.get(MEET_NONCE_COOKIE)?.value ?? null;
    const response = NextResponse.redirect(await handleMeetCallback(url.origin, meetState, code, oauthError, nonce));
    response.cookies.delete(MEET_NONCE_COOKIE);
    return response;
  }

  let adminEmail = "";
  let returnTo = "/admin/organizations";
  try {
    const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
    adminEmail = parsed.e || "";
    returnTo = parsed.r || returnTo;
  } catch {
    // ignore malformed state
  }

  const redirectBack = (params: Record<string, string>) => {
    const target = new URL(returnTo, url.origin);
    for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
    return NextResponse.redirect(target);
  };

  if (oauthError || !code) {
    return redirectBack({ gmail: "error", reason: oauthError || "missing_code" });
  }
  if (!adminEmail) {
    return redirectBack({ gmail: "error", reason: "missing_admin" });
  }

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens.access_token) {
    return redirectBack({ gmail: "error", reason: tokens.error || "token_exchange_failed" });
  }

  const googleEmail = await getGoogleEmail(tokens.access_token);
  if (!googleEmail) {
    return redirectBack({ gmail: "error", reason: "no_email" });
  }

  const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

  // Upsert. Keep the existing refresh_token if Google didn't return a new one.
  const record: Record<string, unknown> = {
    admin_email: adminEmail,
    google_email: googleEmail,
    access_token: tokens.access_token,
    token_expiry: expiry,
    scope: tokens.scope ?? null,
    updated_at: new Date().toISOString(),
  };
  if (tokens.refresh_token) record.refresh_token = tokens.refresh_token;

  await supabaseAdmin.from("admin_gmail_accounts").upsert(record, { onConflict: "admin_email" });

  return redirectBack({ gmail: "connected", account: googleEmail });
}
