import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getAdminSession } from "@/lib/adminSession";

// GET /api/admin/notifications — returns unread count + recent notifications for the current admin
export async function GET(_req: NextRequest) {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("admin_task_notifications")
    .select("*, admin_tasks(id, title)")
    .eq("recipient_email", s.email)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const notifications = (data || []).map((n: any) => ({
    ...n,
    task_title: n.admin_tasks?.title || null,
  }));

  const unread = notifications.filter((n: any) => !n.read_at).length;

  return NextResponse.json({ notifications, unread });
}

// POST /api/admin/notifications/read — mark all or specific as read
export async function POST(req: NextRequest) {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = body.ids;

  let query = supabase
    .from("admin_task_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_email", s.email)
    .is("read_at", null);

  if (ids?.length) query = query.in("id", ids);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
