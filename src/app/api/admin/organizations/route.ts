import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Sales funnel stages for tracking clients
const FUNNEL_STAGES = [
  { id: "new_signup", label: "New Signup", color: "slate" },
  { id: "contacted", label: "Contacted", color: "blue" },
  { id: "demo_scheduled", label: "Demo Scheduled", color: "purple" },
  { id: "onboarding", label: "Onboarding", color: "amber" },
  { id: "active", label: "Active Client", color: "emerald" },
  { id: "churned", label: "Churned", color: "red" },
];

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

    // Fetch organizations with owner info
    const { data: organizations, error } = await supabase
      .from("organizations")
      .select(`
        *,
        owner:users!organizations_owner_user_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      // Try simpler query if join fails
      const { data: orgs, error: simpleError } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (simpleError) {
        return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
      }

      return NextResponse.json({ organizations: orgs || [], stages: FUNNEL_STAGES });
    }

    return NextResponse.json({ organizations: organizations || [], stages: FUNNEL_STAGES });
  } catch (err) {
    console.error("Server error:", err);
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
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("organizations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
    }

    return NextResponse.json({ organization: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
