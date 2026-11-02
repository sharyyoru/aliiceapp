import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getAdminSession } from "@/lib/adminSession";

// GET /api/admin/tasks/[id]/comments
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabase
    .from("admin_task_comments")
    .select("*")
    .eq("task_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data || [] });
}

// POST /api/admin/tasks/[id]/comments
// Body: { body: string }  — @mentions parsed from body text
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const text: string = (body.body || "").trim();
  if (!text) return NextResponse.json({ error: "Body required" }, { status: 400 });

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("full_name")
    .eq("email", s.email)
    .maybeSingle();
  const authorName = adminUser?.full_name || s.email;

  const { data: comment, error } = await supabase
    .from("admin_task_comments")
    .insert({ task_id: id, author_email: s.email, author_name: authorName, body: text })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Parse @email mentions from comment body: @word@domain.tld
  const mentionRegex = /@([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;
  const mentioned = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = mentionRegex.exec(text)) !== null) {
    if (m[1] !== s.email) mentioned.add(m[1]);
  }

  const { data: task } = await supabase
    .from("admin_tasks")
    .select("assignee_email, created_by_email")
    .eq("id", id)
    .maybeSingle();

  const notifyEmails = new Set<string>(mentioned);
  if (task?.assignee_email && task.assignee_email !== s.email) notifyEmails.add(task.assignee_email);
  if (task?.created_by_email && task.created_by_email !== s.email) notifyEmails.add(task.created_by_email);

  for (const email of notifyEmails) {
    const isMention = mentioned.has(email);
    if (isMention) {
      await supabase.from("admin_task_mentions").insert({
        task_id: id,
        comment_id: comment.id,
        mentioned_email: email,
      });
    }
    await supabase.from("admin_task_notifications").insert({
      recipient_email: email,
      type: isMention ? "mentioned" : "comment",
      task_id: id,
      comment_id: comment.id,
      actor_email: s.email,
      actor_name: authorName,
    });
  }

  return NextResponse.json({ comment });
}
