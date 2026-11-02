import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session");

  if (!token) return false;

  try {
    const decoded = Buffer.from(token.value, "base64").toString();
    return decoded.startsWith("admin:");
  } catch {
    return false;
  }
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch users with their organizations
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id,
        email,
        full_name,
        role,
        created_at,
        current_organization_id,
        organization:organizations!users_current_organization_id_fkey (
          id,
          name,
          slug
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      // Try simpler query if join fails
      const { data: simpleUsers, error: simpleError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (simpleError) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
      }

      return NextResponse.json({ users: simpleUsers || [] });
    }

    return NextResponse.json({ users: users || [] });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
