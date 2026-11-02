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

    const { data: adminUsers, error } = await supabase
      .from("admin_users")
      .select("id, email, full_name, is_active, created_at, last_login_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ adminUsers: [] });
    }

    return NextResponse.json({ adminUsers: adminUsers || [] });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("admin_users")
      .insert({
        email,
        password_hash: password, // In production, use proper hashing
        full_name: full_name || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 });
    }

    return NextResponse.json({ adminUser: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Admin user ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // If password is being updated, rename to password_hash
    if (updates.password) {
      updates.password_hash = updates.password;
      delete updates.password;
    }

    const { data, error } = await supabase
      .from("admin_users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to update admin user" }, { status: 500 });
    }

    return NextResponse.json({ adminUser: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Admin user ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("admin_users")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to delete admin user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
