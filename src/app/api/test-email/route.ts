import { NextRequest, NextResponse } from "next/server";
import { requireStaff, requireRole, authErrorResponse } from "@/lib/serverAuth";
import { headers } from "next/headers";

// Quick test to verify Resend is working
// DELETE THIS FILE AFTER TESTING
export async function POST(request: NextRequest) {
    try {
      await requireStaff(request);
    } catch (err) {
      return authErrorResponse(err);
    }
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json({ error: "Email address required" }, { status: 400 });
    }

    // Test sending via Resend SMTP directly
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Aliice <aliice@mail.aliice.app>",
        to: [to],
        subject: "Test Email from Aliice",
        html: "<p>If you received this, Resend is working correctly!</p>",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);
      return NextResponse.json({ error: "Resend failed", details: data }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
    try {
      await requireStaff((await headers()));
    } catch (err) {
      return authErrorResponse(err);
    }
  return NextResponse.json({
    message: "POST to this endpoint with { to: 'your-email@example.com' } to test",
    hasApiKey: !!process.env.RESEND_API_KEY,
  });
}
