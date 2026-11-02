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
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sales_pipeline_email_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
  return NextResponse.json({ templates: data || [] });
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const {
    name,
    subject,
    body_html,
    subject_fr,
    body_html_fr,
    design_json,
    design_json_fr,
    description,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sales_pipeline_email_templates")
    .insert({
      name: name.trim(),
      subject: subject || "",
      body_html: body_html || "",
      subject_fr: subject_fr || null,
      body_html_fr: body_html_fr || null,
      design_json: design_json || null,
      design_json_fr: design_json_fr || null,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
  return NextResponse.json({ template: data });
}

export async function PATCH(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sales_pipeline_email_templates")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
  return NextResponse.json({ template: data });
}

export async function DELETE(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("sales_pipeline_email_templates")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id });
}
