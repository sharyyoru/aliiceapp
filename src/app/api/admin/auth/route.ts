import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Fallback admin credentials (used if admin_users table doesn't exist)
const FALLBACK_ADMIN_EMAIL = "sharyyoru@gmail.com";
const FALLBACK_ADMIN_PASSWORD = "wilsontest";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Try database auth first
    const supabase = getSupabaseAdmin();
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("id, email, full_name, is_active, password_hash")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    let isValid = false;

    if (!error && adminUser && adminUser.password_hash === password) {
      isValid = true;
      // Update last login
      await supabase
        .from("admin_users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", adminUser.id);
    } else if (email === FALLBACK_ADMIN_EMAIL && password === FALLBACK_ADMIN_PASSWORD) {
      // Fallback to hardcoded credentials
      isValid = true;
    }

    if (isValid) {
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
