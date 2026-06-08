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

export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("organization_id");

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get organization members with user details
    const { data: members, error } = await supabase
      .from("organization_members")
      .select(`
        id,
        role,
        is_active,
        created_at,
        user:users (
          id,
          email,
          full_name
        )
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Transform data to flatten user info
    const users = (members || []).map((m: any) => ({
      id: m.id,
      user_id: m.user?.id,
      email: m.user?.email,
      full_name: m.user?.full_name,
      role: m.role,
      is_active: m.is_active,
      created_at: m.created_at,
    }));

    return NextResponse.json({ users });
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
    const { organization_id, email, full_name, password, role } = body;

    if (!organization_id || !email || !password) {
      return NextResponse.json({ error: "Organization ID, email, and password are required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || "",
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      if (authError.message.includes("already") || authError.message.includes("exists")) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    const userId = authData.user.id;

    // Create user profile
    const { error: userError } = await supabase
      .from("users")
      .upsert({
        id: userId,
        email,
        full_name: full_name || null,
        role: role || "staff",
        current_organization_id: organization_id,
      });

    if (userError) {
      console.error("User profile error:", userError);
    }

    // Add user to organization
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        user_id: userId,
        organization_id,
        role: role || "staff",
        is_active: true,
      });

    if (memberError) {
      console.error("Member error:", memberError);
      return NextResponse.json({ error: "Failed to add user to organization" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: userId,
        email,
        full_name,
        role: role || "staff",
      }
    });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Deactivate membership instead of deleting
    const { error } = await supabase
      .from("organization_members")
      .update({ is_active: false })
      .eq("id", memberId);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to remove user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
