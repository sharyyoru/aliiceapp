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

    const { data: contacts, error } = await supabase
      .from("organization_contacts")
      .select("*")
      .eq("organization_id", orgId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ contacts: [] });
    }

    return NextResponse.json({ contacts: contacts || [] });
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
    const { organization_id, title, full_name, gender, email, phone, is_primary } = body;

    if (!organization_id || !full_name) {
      return NextResponse.json({ error: "Organization ID and full name are required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // If this contact is primary, unset other primary contacts
    if (is_primary) {
      await supabase
        .from("organization_contacts")
        .update({ is_primary: false })
        .eq("organization_id", organization_id);
    }

    const { data, error } = await supabase
      .from("organization_contacts")
      .insert({
        organization_id,
        title: title || null,
        full_name,
        gender: gender || null,
        email: email || null,
        phone: phone || null,
        is_primary: is_primary || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
    }

    return NextResponse.json({ contact: data });
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
    const { id, title, full_name, gender, email, phone, is_primary, organization_id } = body;

    if (!id) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // If setting as primary, unset other primary contacts
    if (is_primary && organization_id) {
      await supabase
        .from("organization_contacts")
        .update({ is_primary: false })
        .eq("organization_id", organization_id);
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (full_name !== undefined) updates.full_name = full_name;
    if (gender !== undefined) updates.gender = gender;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (is_primary !== undefined) updates.is_primary = is_primary;

    const { data, error } = await supabase
      .from("organization_contacts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
    }

    return NextResponse.json({ contact: data });
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
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("organization_contacts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
