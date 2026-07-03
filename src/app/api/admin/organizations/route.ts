import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runStageAutomations } from "@/lib/pipelineAutomations";

// Sales funnel stages for tracking clients
const FUNNEL_STAGES = [
  { id: "new_signup", label: "New Signup", color: "slate", weight: 0.1 },
  { id: "contacted", label: "Contacted", color: "blue", weight: 0.2 },
  { id: "demo_scheduled", label: "Demo Scheduled", color: "purple", weight: 0.4 },
  { id: "onboarding", label: "Onboarding", color: "amber", weight: 0.7 },
  { id: "active", label: "Active Client", color: "emerald", weight: 1.0 },
  { id: "churned", label: "Churned", color: "red", weight: 0 },
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

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, email, phone, deal_value, subscription_tier } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        email: email || null,
        phone: phone || null,
        deal_value: deal_value || 0,
        subscription_tier: subscription_tier || "free",
        subscription_status: "trialing",
        sales_funnel_stage: "new_signup",
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        return NextResponse.json({ error: "Organization slug already exists" }, { status: 400 });
      }
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    return NextResponse.json({ organization: data });
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
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // If the stage is changing, capture the previous stage first so we can
    // trigger stage-based automations after a successful update.
    const isStageChange = Object.prototype.hasOwnProperty.call(updates, "sales_funnel_stage");
    let previousStage: string | null = null;
    if (isStageChange) {
      const { data: existing } = await supabase
        .from("organizations")
        .select("sales_funnel_stage")
        .eq("id", id)
        .single();
      previousStage = existing?.sales_funnel_stage ?? null;
    }

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

    // Fire stage-based automations (non-blocking failures are swallowed inside)
    if (isStageChange && data && data.sales_funnel_stage !== previousStage) {
      try {
        await runStageAutomations(
          supabase,
          {
            id: data.id,
            name: data.name,
            slug: data.slug,
            email: data.email,
            phone: data.phone,
            city: data.city,
            country: data.country,
            subscription_tier: data.subscription_tier,
            deal_value: data.deal_value,
            preferred_language: data.preferred_language,
          },
          data.sales_funnel_stage,
          previousStage
        );
      } catch (automationErr) {
        console.error("Stage automation error (non-fatal):", automationErr);
      }
    }

    return NextResponse.json({ organization: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Support id via query param (?id=) or JSON body
    let id: string | null = new URL(request.url).searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id ?? null;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Remove dependent contacts first (defensive — FK may already cascade)
    await supabase.from("organization_contacts").delete().eq("organization_id", id);

    const { error } = await supabase.from("organizations").delete().eq("id", id);

    if (error) {
      console.error("Database error deleting organization:", error);
      return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
