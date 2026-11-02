import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    // Get organization_id from query params if provided
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organization_id");

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (error || !data?.users) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to list users" },
        { status: 500 },
      );
    }

    // Get existing users from public.users table (including provider_id and current_organization_id for filtering)
    const { data: existingPublicUsers } = await supabaseAdmin
      .from("users")
      .select("id, provider_id, current_organization_id");
    
    // Build set of user IDs that belong to the requested organization
    const orgUserIds = new Set<string>();
    if (organizationId) {
      // Get users who are members of this organization
      const { data: orgMembers } = await supabaseAdmin
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", organizationId);
      
      for (const member of orgMembers || []) {
        if (member.user_id) orgUserIds.add(member.user_id);
      }
      
      // Also include users whose current_organization_id matches
      for (const u of existingPublicUsers || []) {
        if (u.current_organization_id === organizationId) {
          orgUserIds.add(u.id);
        }
      }
    }
    
    const existingIds = new Set((existingPublicUsers || []).map((u) => u.id));
    const providerIdMap = new Map<string, string | null>();
    for (const u of existingPublicUsers || []) {
      providerIdMap.set(u.id, u.provider_id ?? null);
    }

    // Sync missing users to public.users table to satisfy foreign key constraints
    const usersToSync = data.users.filter((user) => !existingIds.has(user.id));
    
    if (usersToSync.length > 0) {
      const syncRecords = usersToSync.map((user) => {
        const meta = (user.user_metadata || {}) as Record<string, unknown>;
        const firstName = (meta["first_name"] as string) ?? null;
        const lastName = (meta["last_name"] as string) ?? null;
        const fullNameFromMeta = (meta["full_name"] as string) ?? null;
        const fullName = fullNameFromMeta || 
          (firstName && lastName ? `${firstName} ${lastName}` : null) ||
          firstName || lastName;

        return {
          id: user.id,
          email: user.email ?? null,
          full_name: fullName,
          role: (meta["role"] as string) ?? "staff",
          designation: (meta["designation"] as string) ?? null,
        };
      });

      // Insert missing users (ignore conflicts in case of race conditions)
      await supabaseAdmin
        .from("users")
        .upsert(syncRecords, { onConflict: "id", ignoreDuplicates: true });
    }

    // Filter users by organization if organizationId is provided
    const filteredAuthUsers = organizationId 
      ? data.users.filter((user) => orgUserIds.has(user.id))
      : data.users;

    const users = filteredAuthUsers.map((user) => {
      const meta = (user.user_metadata || {}) as Record<string, unknown>;
      const firstName = (meta["first_name"] as string) ?? null;
      const lastName = (meta["last_name"] as string) ?? null;
      const fullNameFromMeta = (meta["full_name"] as string) ?? null;
      
      const fullName = fullNameFromMeta || 
        (firstName && lastName ? `${firstName} ${lastName}` : null) ||
        firstName || lastName;

      return {
        id: user.id,
        email: user.email ?? null,
        full_name: fullName,
        role: (meta["role"] as string) ?? null,
        first_name: firstName,
        last_name: lastName,
        designation: (meta["designation"] as string) ?? null,
        created_at: (user as any).created_at ?? null,
        provider_id: providerIdMap.get(user.id) ?? null,
      };
    });

    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error listing users" },
      { status: 500 },
    );
  }
}
