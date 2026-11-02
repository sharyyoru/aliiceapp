import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET || "aliice-cron-2025";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aliice.app";

export async function GET() {
  try {
    const res = await fetch(`${APP_URL}/api/chat/session`, {
      method: "PATCH",
      headers: {
        "x-cron-secret": CRON_SECRET,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    console.log("[cron/close-stale-chats]", data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[cron/close-stale-chats]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
