import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendSystemEmailUnified, isEmailConfigured } from "@/lib/email";
import { buildInvoiceEmailHtml } from "@/lib/payButton";

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

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  const { id, pdfBase64, fileName, to } = (await request.json()) as {
    id?: string;
    pdfBase64?: string; // base64 (no data URI prefix)
    fileName?: string;
    to?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "Invoice id is required" }, { status: 400 });
  }
  if (!pdfBase64) {
    return NextResponse.json({ error: "Invoice PDF is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: invoice, error } = await supabase
    .from("client_invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const recipient = (to || invoice.client_email || "").trim();
  if (!recipient) {
    return NextResponse.json(
      { error: "No client email address on file" },
      { status: 400 }
    );
  }

  const amountLabel = formatMoney(Number(invoice.total) || 0, invoice.currency || "USD");
  const dueDateLabel = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("en-GB")
    : null;

  const html = buildInvoiceEmailHtml({
    recipientName: invoice.client_name,
    invoiceNumber: invoice.invoice_number,
    amountLabel,
    payUrl: invoice.payrexx_payment_link,
    dueDateLabel,
    senderName: invoice.from_name || "Aliice",
  });

  // Strip a data-URI prefix if the client accidentally sent one.
  const cleanBase64 = pdfBase64.includes(",") ? pdfBase64.split(",").pop()! : pdfBase64;

  const result = await sendSystemEmailUnified({
    to: recipient,
    subject: `Invoice ${invoice.invoice_number} — ${amountLabel}`,
    html,
    attachments: [
      {
        filename: fileName || `${invoice.invoice_number}.pdf`,
        content: cleanBase64,
        contentType: "application/pdf",
      },
    ],
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to send email" },
      { status: 502 }
    );
  }

  await supabase
    .from("client_invoices")
    .update({ last_sent_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
