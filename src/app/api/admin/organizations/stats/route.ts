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
    const orgId = searchParams.get("id");

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get patient count
    const { count: patientCount } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId);

    // Get user count (organization members)
    const { count: userCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_active", true);

    // Get appointment count
    const { count: appointmentCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId);

    return NextResponse.json({
      patientCount: patientCount || 0,
      userCount: userCount || 0,
      appointmentCount: appointmentCount || 0,
    });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
