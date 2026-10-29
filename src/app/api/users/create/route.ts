import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole, authErrorResponse } from "@/lib/serverAuth";

// POST /api/users/create — owner/admin creates a staff user in THEIR org.
// Role is written to organization_members.role, never to user_metadata.
export async function POST(request: Request) {
  let caller;
  try {
    caller = await requireRole(request, ["owner", "admin"]);
  } catch (err) {
    return authErrorResponse(err);
  }

  try {
    const { email, password, role, firstName, lastName, designation } =
      await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }

    const allowedRoles = [
      "owner",
      "admin",
      "doctor",
      "staff",
      "receptionist",
      "billing",
    ];
    if (!allowedRoles.includes(String(role).toLowerCase())) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const newRole = String(role).toLowerCase();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        designation,
      },
    });

    if (error || !data?.user) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create user" },
        { status: 400 }
      );
    }

    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    const { error: insertError } = await supabaseAdmin.from("users").insert({
      id: data.user.id,
      role: newRole,
      full_name: fullName || null,
      email,
      designation,
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create user record" },
        { status: 500 }
      );
    }

    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: caller.membership.organization_id,
        user_id: data.user.id,
        role: newRole,
        is_active: true,
      });

    if (memberError) {
      return NextResponse.json(
        { error: "Failed to assign organization membership" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
      role: newRole,
    });
  } catch {
    return NextResponse.json(
      { error: "Unexpected error creating user" },
      { status: 500 }
    );
  }
}
