import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

type RegisterLeadPayload = {
  full_name?: string;
  email: string;
  phone?: string;
  user_id?: string;
};

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function generateUniqueSlug(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  base: string
): Promise<string> {
  const sanitized =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "lead";

  let slug = sanitized;
  let attempt = 0;

  // Ensure uniqueness against existing organizations
  while (attempt < 10) {
    const { data } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .limit(1);

    if (!data || data.length === 0) {
      return slug;
    }

    attempt += 1;
    slug = `${sanitized}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // Fallback: append timestamp
  return `${sanitized}-${Date.now().toString(36)}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterLeadPayload;
    const { full_name, email, phone, user_id } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Avoid creating a duplicate lead if one already exists for this email
    const { data: existing } = await supabase
      .from("organizations")
      .select("id")
      .ilike("email", email.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, duplicate: true, organization_id: existing[0].id });
    }

    const displayName = full_name?.trim() || email.trim().split("@")[0];
    const slug = await generateUniqueSlug(supabase, full_name?.trim() || email.trim().split("@")[0]);

    const insertData: Record<string, unknown> = {
      name: displayName,
      slug,
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      deal_value: 0,
      subscription_tier: "free",
      subscription_status: "trialing",
      sales_funnel_stage: "new_signup",
      notes: "Auto-created lead from /register signup",
    };

    if (user_id) {
      insertData.owner_user_id = user_id;
    }

    const { data, error } = await supabase
      .from("organizations")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error("Error creating lead:", JSON.stringify(error));
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, organization_id: data.id });
  } catch (error) {
    console.error("Error registering lead:", error);
    return NextResponse.json(
      { error: "Failed to register lead", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
