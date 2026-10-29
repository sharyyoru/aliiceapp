import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminToken, verifyAdminToken } from "@/lib/adminSession";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const emailClean = (email || "").trim().toLowerCase();
    const passwordClean = (password || "").trim();

    // Try database auth first
    const supabase = getSupabaseAdmin();
    const { data: adminUser, error: dbError } = await supabase
      .from("admin_users")
      .select("id, email, full_name, is_active, password_hash")
      .ilike("email", emailClean)
      .eq("is_active", true)
      .maybeSingle();

    console.log("[auth] emailClean:", emailClean);
    console.log("[auth] dbError:", dbError);
    console.log("[auth] adminUser found:", !!adminUser, adminUser?.email);
    console.log("[auth] password match:", adminUser?.password_hash === passwordClean);

    let isValid = false;

    if (adminUser && adminUser.password_hash === passwordClean) {
      isValid = true;
      // Update last login
      await supabase
        .from("admin_users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", adminUser.id);
    }

    if (isValid) {
      const token = createAdminToken(emailClean);
      
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

    if (verifyAdminToken(token.value)) {
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
