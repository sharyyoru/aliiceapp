import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * TEMPORARY data-export endpoint for migrating to a new Supabase project.
 * Guarded by EXPORT_SECRET env var — DELETE THIS FILE after migration.
 *
 *   GET /api/admin/export-data?secret=...               → list tables + row counts
 *   GET /api/admin/export-data?secret=...&table=patients&offset=0&limit=1000
 *   GET /api/admin/export-data?secret=...&resource=auth_users&offset=0
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const expected = process.env.EXPORT_SECRET;
  if (!expected) return false;
  return req.nextUrl.searchParams.get("secret") === expected;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const sp = req.nextUrl.searchParams;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Table list from the PostgREST OpenAPI spec
  const specRes = await fetch(`${base}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const spec = (await specRes.json()) as { definitions?: Record<string, unknown> };
  const tables = Object.keys(spec.definitions || {}).sort();

  const table = sp.get("table");
  const resource = sp.get("resource");

  if (!table && !resource) {
    return NextResponse.json({ tables });
  }

  if (resource === "auth_users") {
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
    const perPage = Math.min(1000, parseInt(sp.get("limit") || "1000", 10));
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const users = (data.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      user_metadata: u.user_metadata,
      app_metadata: u.app_metadata,
      created_at: u.created_at,
    }));
    return NextResponse.json({ users, page, count: users.length });
  }

  if (resource === "table_counts") {
    const counts: Record<string, number> = {};
    for (const t of tables) {
      const { count, error } = await supabaseAdmin
        .from(t)
        .select("*", { count: "exact", head: true });
      counts[t] = error ? -1 : count ?? 0;
    }
    return NextResponse.json({ counts });
  }

  if (!tables.includes(table!)) {
    return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 });
  }

  const offset = parseInt(sp.get("offset") || "0", 10);
  const limit = Math.min(2000, parseInt(sp.get("limit") || "1000", 10));
  const { data, error, count } = await supabaseAdmin
    .from(table!)
    .select("*", { count: "exact" })
    .range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ table, offset, limit, total: count, rows: data });
}
