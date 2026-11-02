import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createPayrexxGateway } from "@/lib/payrexx";

// Subscription payments are unified into client_invoices with
// invoice_type='subscription'. The shared Payrexx webhook resolves
// them via the CLIENT- reference prefix, same as manual invoices.
const CLIENT_INVOICE_REF_PREFIX = "CLIENT-";

type ClientInvoiceRow = {
  id: string;
  organization_id: string | null;
  period_start: string | null;
  period_end: string | null;
  total: number | null;
  status: string | null;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  payrexx_payment_link: string | null;
};

// Map the client_invoices status model onto the subscription UI's
// pending | paid | overdue vocabulary.
function toUiStatus(inv: ClientInvoiceRow): "pending" | "paid" | "overdue" {
  if (inv.status === "PAID" || inv.status === "OVERPAID") return "paid";
  const today = new Date().toISOString().split("T")[0];
  if (inv.due_date && inv.due_date < today) return "overdue";
  return "pending";
}

function toClientPayment(inv: ClientInvoiceRow) {
  return {
    id: inv.id,
    organization_id: inv.organization_id,
    period_start: inv.period_start || inv.created_at.split("T")[0],
    period_end: inv.period_end || inv.due_date || inv.created_at.split("T")[0],
    amount: Number(inv.total) || 0,
    status: toUiStatus(inv),
    paid_at: inv.paid_at,
    notes: inv.notes,
    created_at: inv.created_at,
    payrexx_payment_link: inv.payrexx_payment_link,
  };
}

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

export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("organization_id");

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: rows, error } = await supabase
      .from("client_invoices")
      .select("id, organization_id, period_start, period_end, total, status, due_date, paid_at, notes, created_at, payrexx_payment_link")
      .eq("organization_id", orgId)
      .eq("invoice_type", "subscription")
      .order("period_start", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ payments: [] });
    }

    const payments = (rows || []).map((r) => toClientPayment(r as ClientInvoiceRow));
    return NextResponse.json({ payments });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      organization_id,
      period_start,
      period_end,
      amount,
      status,
      notes,
      createPaymentLink = true,
    } = body as {
      organization_id?: string;
      period_start?: string;
      period_end?: string;
      amount?: number;
      status?: string;
      notes?: string;
      createPaymentLink?: boolean;
    };

    if (!organization_id || !period_start || !period_end || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Load the organization for billing details + a readable invoice number.
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, slug, email")
      .eq("id", organization_id)
      .single();

    const period = String(period_start).slice(0, 7).replace("-", ""); // YYYYMM
    const slug = (org?.slug || organization_id).toString().toUpperCase();
    const invoiceNumber = `SUB-${slug}-${period}`;
    const total = Number(amount) || 0;
    const uiStatus = status || "pending";
    const dbStatus = uiStatus === "paid" ? "PAID" : "OPEN";

    const record: Record<string, unknown> = {
      invoice_number: invoiceNumber,
      invoice_type: "subscription",
      organization_id,
      period_start,
      period_end,
      issue_date: period_start,
      due_date: period_end,
      client_name: org?.name || "Subscription",
      client_email: org?.email || null,
      currency: "CHF",
      line_items: [
        {
          description: `Aliice subscription ${period_start} - ${period_end}`,
          quantity: 1,
          unitPrice: total,
        },
      ],
      subtotal: total,
      tax: 0,
      total,
      status: dbStatus,
      paid_at: uiStatus === "paid" ? new Date().toISOString() : null,
      paid_amount: uiStatus === "paid" ? total : null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    // Upsert by invoice_number so re-generating the same period updates it.
    const { data: existing } = await supabase
      .from("client_invoices")
      .select("id, payrexx_payment_link")
      .eq("invoice_number", invoiceNumber)
      .maybeSingle();

    let invoiceId = existing?.id as string | undefined;
    let paymentLink: string | null = existing?.payrexx_payment_link || null;

    if (existing?.id) {
      const { error } = await supabase.from("client_invoices").update(record).eq("id", existing.id);
      if (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
      }
    } else {
      const { data: inserted, error } = await supabase
        .from("client_invoices")
        .insert(record)
        .select("id")
        .single();
      if (error || !inserted) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
      }
      invoiceId = inserted.id;
    }

    // Create a Payrexx pay link so the subscription can be paid online.
    if (createPaymentLink && !paymentLink && total > 0 && dbStatus !== "PAID") {
      try {
        const [forename, ...rest] = (org?.name || "Subscription").trim().split(" ");
        const gatewayResponse = await createPayrexxGateway({
          amount: Math.round(total * 100),
          currency: "CHF",
          referenceId: `${CLIENT_INVOICE_REF_PREFIX}${invoiceNumber}`,
          purpose: `Aliice subscription ${period_start} - ${period_end}`,
          forename: forename || org?.name || "Subscription",
          surname: rest.join(" ") || undefined,
          email: org?.email || undefined,
        });

        if (gatewayResponse.status === "success") {
          const gatewayData = Array.isArray(gatewayResponse.data)
            ? gatewayResponse.data[0]
            : gatewayResponse.data;
          const gateway = gatewayData as unknown as { id: number; hash: string; link: string };
          paymentLink = gateway.link || `https://aesthetics-ge.payrexx.com/?payment=${gateway.hash}`;
          await supabase
            .from("client_invoices")
            .update({
              payrexx_gateway_id: gateway.id,
              payrexx_gateway_hash: gateway.hash,
              payrexx_payment_link: paymentLink,
              payrexx_payment_status: "waiting",
            })
            .eq("id", invoiceId);
        }
      } catch (err) {
        // Non-fatal: the invoice is saved even if Payrexx is unavailable/unconfigured.
        console.error("[subscription] Payrexx error:", err);
      }
    }

    const { data: full } = await supabase
      .from("client_invoices")
      .select("id, organization_id, period_start, period_end, total, status, due_date, paid_at, notes, created_at, payrexx_payment_link")
      .eq("id", invoiceId)
      .single();

    return NextResponse.json({
      payment: full ? toClientPayment(full as ClientInvoiceRow) : null,
      paymentLink,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, paid_at, notes } = body as {
      id?: string;
      status?: "pending" | "paid" | "overdue";
      paid_at?: string;
      notes?: string;
    };

    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: inv } = await supabase
      .from("client_invoices")
      .select("total")
      .eq("id", id)
      .single();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (notes !== undefined) updates.notes = notes;

    if (status === "paid") {
      updates.status = "PAID";
      updates.paid_at = paid_at || new Date().toISOString();
      updates.paid_amount = Number(inv?.total) || 0;
    } else if (status === "pending" || status === "overdue") {
      // 'overdue' is derived from due_date in the UI; store as OPEN.
      updates.status = "OPEN";
      updates.paid_at = null;
      updates.paid_amount = null;
    }

    const { data, error } = await supabase
      .from("client_invoices")
      .update(updates)
      .eq("id", id)
      .select("id, organization_id, period_start, period_end, total, status, due_date, paid_at, notes, created_at, payrexx_payment_link")
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
    }

    return NextResponse.json({ payment: toClientPayment(data as ClientInvoiceRow) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("client_invoices")
      .delete()
      .eq("id", id)
      .eq("invoice_type", "subscription");

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
