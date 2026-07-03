import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createPayrexxGateway } from "@/lib/payrexx";

// Reference prefix so the shared Payrexx webhook can distinguish client-billing
// invoices from patient/medical invoices. Kept in sync with payrexx-webhook.
const CLIENT_INVOICE_REF_PREFIX = "CLIENT-";

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

type LineItem = { description: string; quantity: number; unitPrice: number };

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("client_invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
  return NextResponse.json({ invoices: data || [] });
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    invoice_number,
    issue_date,
    due_date,
    client_name,
    client_email,
    client_address,
    client_city,
    from_name,
    from_address,
    from_city,
    currency,
    line_items,
    notes,
    createPaymentLink,
  } = body as {
    invoice_number?: string;
    issue_date?: string;
    due_date?: string;
    client_name?: string;
    client_email?: string;
    client_address?: string;
    client_city?: string;
    from_name?: string;
    from_address?: string;
    from_city?: string;
    currency?: string;
    line_items?: LineItem[];
    notes?: string;
    createPaymentLink?: boolean;
  };

  if (!invoice_number?.trim()) {
    return NextResponse.json({ error: "Invoice number is required" }, { status: 400 });
  }
  if (!client_name?.trim()) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  const items = Array.isArray(line_items) ? line_items : [];
  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0
  );
  const tax = 0;
  const total = subtotal + tax;

  const supabase = getSupabaseAdmin();

  // Upsert by invoice_number so re-saving the same invoice updates it.
  const { data: existing } = await supabase
    .from("client_invoices")
    .select("id, payrexx_payment_link, payrexx_gateway_id, status")
    .eq("invoice_number", invoice_number.trim())
    .maybeSingle();

  const record: Record<string, unknown> = {
    invoice_number: invoice_number.trim(),
    issue_date: issue_date || new Date().toISOString().split("T")[0],
    due_date: due_date || null,
    client_name: client_name.trim(),
    client_email: client_email || null,
    client_address: client_address || null,
    client_city: client_city || null,
    from_name: from_name || null,
    from_address: from_address || null,
    from_city: from_city || null,
    currency: currency || "USD",
    line_items: items,
    subtotal,
    tax,
    total,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };

  let invoiceId = existing?.id as string | undefined;

  if (existing?.id) {
    const { error } = await supabase
      .from("client_invoices")
      .update(record)
      .eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }
  } else {
    const { data: inserted, error } = await supabase
      .from("client_invoices")
      .insert(record)
      .select("id")
      .single();
    if (error || !inserted) {
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
    invoiceId = inserted.id;
  }

  let paymentLink: string | null = existing?.payrexx_payment_link || null;

  // Create a Payrexx payment link if requested and not already present.
  if (createPaymentLink && !paymentLink) {
    if (total <= 0) {
      return NextResponse.json(
        { error: "Invoice total must be greater than 0 to create a payment link" },
        { status: 400 }
      );
    }
    try {
      const amountCents = Math.round(total * 100);
      const [forename, ...rest] = (client_name || "").trim().split(" ");
      const gatewayResponse = await createPayrexxGateway({
        amount: amountCents,
        currency: currency || "CHF",
        referenceId: `${CLIENT_INVOICE_REF_PREFIX}${invoice_number.trim()}`,
        purpose: `Invoice ${invoice_number.trim()}`,
        forename: forename || client_name,
        surname: rest.join(" ") || undefined,
        email: client_email || undefined,
      });

      if (gatewayResponse.status !== "success") {
        return NextResponse.json(
          { error: "Failed to create Payrexx payment link", invoiceId },
          { status: 502 }
        );
      }

      const gatewayData = Array.isArray(gatewayResponse.data)
        ? gatewayResponse.data[0]
        : gatewayResponse.data;
      const gateway = gatewayData as unknown as { id: number; hash: string; link: string };
      paymentLink =
        gateway.link || `https://aesthetics-ge.payrexx.com/?payment=${gateway.hash}`;

      await supabase
        .from("client_invoices")
        .update({
          payrexx_gateway_id: gateway.id,
          payrexx_gateway_hash: gateway.hash,
          payrexx_payment_link: paymentLink,
          payrexx_payment_status: "waiting",
        })
        .eq("id", invoiceId);
    } catch (err) {
      console.error("[client-invoices] Payrexx error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Payrexx error", invoiceId },
        { status: 502 }
      );
    }
  }

  const { data: full } = await supabase
    .from("client_invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  return NextResponse.json({ invoice: full, paymentLink });
}
