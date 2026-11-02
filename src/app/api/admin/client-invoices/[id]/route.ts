import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPayrexxGateway } from "@/lib/payrexx";

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

// POST → re-sync payment status from Payrexx (manual refresh).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: invoice, error } = await supabase
    .from("client_invoices")
    .select("id, total, status, payrexx_gateway_id")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (!invoice.payrexx_gateway_id) {
    return NextResponse.json(
      { error: "No Payrexx payment link exists for this invoice yet" },
      { status: 400 }
    );
  }

  try {
    const gatewayResponse = await getPayrexxGateway(Number(invoice.payrexx_gateway_id));
    const gd = Array.isArray(gatewayResponse.data)
      ? gatewayResponse.data[0]
      : gatewayResponse.data;
    const gatewayStatus = (gd as unknown as { status?: string })?.status || "waiting";

    const update: Record<string, unknown> = {
      payrexx_payment_status: gatewayStatus,
      updated_at: new Date().toISOString(),
    };

    if (gatewayStatus === "confirmed" && invoice.status !== "PAID") {
      update.status = "PAID";
      update.paid_amount = Number(invoice.total) || 0;
      update.paid_at = new Date().toISOString();
      update.payrexx_paid_at = new Date().toISOString();
    }

    await supabase.from("client_invoices").update(update).eq("id", id);

    const { data: full } = await supabase
      .from("client_invoices")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json({ invoice: full, gatewayStatus });
  } catch (e) {
    console.error("[client-invoices/refresh] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to refresh status" },
      { status: 502 }
    );
  }
}

// PATCH → update invoice status (e.g. cancel / reopen).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { status } = (await request.json()) as { status?: string };
  const allowed = ["OPEN", "PAID", "PARTIAL_LOSS", "CANCELLED"];
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("client_invoices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
  return NextResponse.json({ invoice: data });
}

// DELETE → remove an invoice record.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("client_invoices").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
