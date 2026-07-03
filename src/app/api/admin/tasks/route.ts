import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getAdminSession } from "@/lib/adminSession";

// GET /api/admin/tasks?org_id=&assignee=me&status=&q=&sort=
export async function GET(req: NextRequest) {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("org_id");
  const assigneeMe = searchParams.get("assignee") === "me";
  const status = searchParams.get("status");
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "created_at_desc";

  let query = supabase.from("admin_tasks").select("*");

  if (orgId) query = query.eq("organization_id", orgId);
  if (assigneeMe) query = query.eq("assignee_email", s.email);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

  const ascending = sort.endsWith("_asc");
  const fieldMap: Record<string, string> = {
    created_at_desc: "created_at", created_at_asc: "created_at",
    due_date_desc: "due_date", due_date_asc: "due_date",
    priority_desc: "priority", priority_asc: "priority",
    status_desc: "status", status_asc: "status",
    title_asc: "title", title_desc: "title",
  };
  const col = fieldMap[sort] || "created_at";
  query = query.order(col, { ascending });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orgIds = [...new Set((data || []).map((t: any) => t.organization_id).filter(Boolean))];
  const orgMap: Record<string, string> = {};
  if (orgIds.length) {
    const { data: orgs } = await supabase.from("organizations").select("id, name").in("id", orgIds);
    for (const o of orgs || []) orgMap[o.id] = o.name;
  }

  const tasks = (data || []).map((t: any) => ({
    ...t,
    organization_name: t.organization_id ? (orgMap[t.organization_id] || null) : null,
  }));

  return NextResponse.json({ tasks });
}

// POST /api/admin/tasks
export async function POST(req: NextRequest) {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, status, priority, organization_id, assignee_email, assignee_name, due_date, source_type, source_id } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("full_name")
    .eq("email", s.email)
    .maybeSingle();

  const creatorName = adminUser?.full_name || s.email;

  const { data: task, error } = await supabase
    .from("admin_tasks")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      status: status || "todo",
      priority: priority || "medium",
      organization_id: organization_id || null,
      assignee_email: assignee_email || null,
      assignee_name: assignee_name || null,
      created_by_email: s.email,
      created_by_name: creatorName,
      due_date: due_date || null,
      source_type: source_type || "manual",
      source_id: source_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (assignee_email && assignee_email !== s.email) {
    await supabase.from("admin_task_notifications").insert({
      recipient_email: assignee_email,
      type: "assigned",
      task_id: task.id,
      actor_email: s.email,
      actor_name: creatorName,
    });
  }

  return NextResponse.json({ task });
}

// PATCH /api/admin/tasks?id=
export async function PATCH(req: NextRequest) {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const allowed = ["title", "description", "status", "priority", "organization_id", "assignee_email", "assignee_name", "due_date", "completed_at"];
  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }
  if (body.status === "done" && !("completed_at" in body)) {
    update.completed_at = new Date().toISOString();
  }

  const { data: existing } = await supabase.from("admin_tasks").select("assignee_email").eq("id", id).maybeSingle();

  const { data: task, error } = await supabase
    .from("admin_tasks").update(update).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.assignee_email && body.assignee_email !== existing?.assignee_email && body.assignee_email !== s.email) {
    const { data: adminUser } = await supabase.from("admin_users").select("full_name").eq("email", s.email).maybeSingle();
    await supabase.from("admin_task_notifications").insert({
      recipient_email: body.assignee_email,
      type: "assigned",
      task_id: id,
      actor_email: s.email,
      actor_name: adminUser?.full_name || s.email,
    });
  }

  return NextResponse.json({ task });
}

// DELETE /api/admin/tasks?id=
export async function DELETE(req: NextRequest) {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("admin_tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
