import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/organizations/[orgId]/members - List members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);

    // Verify user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is member of this org
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch members with user details
    const { data, error } = await supabaseAdmin
      .from("organization_members")
      .select(`
        *,
        users (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("joined_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: data });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/organizations/[orgId]/members - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const body = await request.json();
    const { member_id, role } = body;

    if (!member_id || !role) {
      return NextResponse.json(
        { error: "member_id and role are required" },
        { status: 400 }
      );
    }

    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);

    // Verify user and check admin permissions
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin of this org
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the target member
    const { data: targetMember } = await supabaseAdmin
      .from("organization_members")
      .select("role, user_id")
      .eq("id", member_id)
      .eq("organization_id", orgId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't change owner's role
    if (targetMember.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change owner's role" },
        { status: 400 }
      );
    }

    // Can't promote to owner
    if (role === "owner") {
      return NextResponse.json(
        { error: "Cannot promote to owner" },
        { status: 400 }
      );
    }

    // Update role
    const { data, error } = await supabaseAdmin
      .from("organization_members")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", member_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[orgId]/members - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("member_id");

    if (!memberId) {
      return NextResponse.json(
        { error: "member_id is required" },
        { status: 400 }
      );
    }

    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);

    // Verify user and check admin permissions
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin of this org
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the target member
    const { data: targetMember } = await supabaseAdmin
      .from("organization_members")
      .select("role, user_id")
      .eq("id", memberId)
      .eq("organization_id", orgId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't remove owner
    if (targetMember.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove owner" },
        { status: 400 }
      );
    }

    // Soft delete (deactivate) member
    const { error } = await supabaseAdmin
      .from("organization_members")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
