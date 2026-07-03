import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAdminSession } from "@/lib/adminSession";

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabaseAdmin.from("admin_gmail_accounts").delete().eq("admin_email", session.email);
  return NextResponse.json({ ok: true });
}
