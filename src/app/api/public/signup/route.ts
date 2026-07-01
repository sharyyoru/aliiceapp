import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

type SignupPayload = {
  name?: string;
  email?: string;
  mobile?: string;
  company_name?: string;
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

  return `${sanitized}-${Date.now().toString(36)}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupPayload;
    const name = body.name?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";
    const mobile = body.mobile?.trim() || "";
    const companyName = body.company_name?.trim() || "";

    if (!name || !email || !mobile || !companyName) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Avoid creating a duplicate lead if one already exists for this email
    const { data: existing } = await supabase
      .from("organizations")
      .select("id")
      .ilike("email", email)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, duplicate: true, organization_id: existing[0].id });
    }

    const slug = await generateUniqueSlug(supabase, companyName);

    const insertData: Record<string, unknown> = {
      name: companyName,
      slug,
      email,
      phone: mobile,
      deal_value: 0,
      subscription_tier: "free",
      subscription_status: "trialing",
      sales_funnel_stage: "new_signup",
      notes: `Signup contact: ${name}\nMobile: ${mobile}\nSource: /signup form`,
    };

    const { data: org, error } = await supabase
      .from("organizations")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error("Error creating signup lead:", JSON.stringify(error));
      return NextResponse.json({ error: "Failed to create signup." }, { status: 500 });
    }

    // Best-effort: also store the person as a primary contact for the org
    try {
      await supabase.from("organization_contacts").insert({
        organization_id: org.id,
        full_name: name,
        email,
        phone: mobile,
        is_primary: true,
      });
    } catch (contactErr) {
      console.error("Failed to create organization contact (non-fatal):", contactErr);
    }

    return NextResponse.json({ ok: true, organization_id: org.id });
  } catch (error) {
    console.error("Error in signup:", error);
    return NextResponse.json(
      { error: "Failed to sign up.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
