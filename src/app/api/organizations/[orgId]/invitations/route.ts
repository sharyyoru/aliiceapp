import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
);

// GET /api/organizations/[orgId]/invitations - List invitations
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

    // Verify user and check permissions
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

    // Fetch invitations
    const { data, error } = await supabaseAdmin
      .from("organization_invitations")
      .select(`
        *,
        users!organization_invitations_invited_by_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invitations: data });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[orgId]/invitations - Send invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const body = await request.json();
    const { email, role, personal_message } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);

    // Verify user and check permissions
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

    // Check if user is already a member
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      const { data: existingMember } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("organization_id", orgId)
        .eq("user_id", existingUser.id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this organization" },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabaseAdmin
      .from("organization_invitations")
      .select("id")
      .eq("organization_id", orgId)
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invitation is already pending for this email" },
        { status: 400 }
      );
    }

    // Get organization name for email
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();

    // Create invitation
    const { data: invitation, error: createError } = await supabaseAdmin
      .from("organization_invitations")
      .insert({
        organization_id: orgId,
        invited_by_user_id: user.id,
        email: email.toLowerCase(),
        role: role || "staff",
        personal_message,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // TODO: Send invitation email using Resend
    // For now, just return the invitation with the token
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${invitation.token}`;

    return NextResponse.json({
      invitation,
      inviteUrl,
      message: `Invitation created. Share this link: ${inviteUrl}`,
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
