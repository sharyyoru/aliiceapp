import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Admin credentials - separate from platform users
const ADMIN_EMAIL = "sharyyoru@gmail.com";
const ADMIN_PASSWORD = "wilsontest";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = Buffer.from(`admin:${email}:${Date.now()}`).toString("base64");
      
      const cookieStore = await cookies();
      cookieStore.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session");

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = Buffer.from(token.value, "base64").toString();
    if (decoded.startsWith("admin:")) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return NextResponse.json({ success: true });
}
