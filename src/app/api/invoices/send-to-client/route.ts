import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createPayrexxGateway } from "@/lib/payrexx";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { addPayButtonToPdf, buildInvoiceEmailHtml } from "@/lib/payButton";

/**
 * Emails a patient/medical invoice to the client:
 *  - ensures a Payrexx payment link exists (for cash/online/card invoices),
 *  - embeds a clickable "Pay online" button onto the stored PDF,
 *  - sends the PDF as an attachment with a "Pay now" button in the email body,
 *  - logs the outbound email to the patient's CRM timeline (best effort).
 */
export async function POST(request: NextRequest) {
  try {
    if (!isEmailConfigured()) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
    }

    const { invoiceId, invoiceType, to } = (await request.json()) as {
      invoiceId?: string;
      invoiceType?: "tg" | "tp" | "reminder" | "receipt";
      to?: string;
    };

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const { data: invoice, error: invErr } = await supabaseAdmin
      .from("invoices")
      .select(
        "id, patient_id, invoice_number, total_amount, payment_method, payrexx_payment_link, payrexx_gateway_id, payrexx_payment_status, pdf_path, pdf_path_tg, pdf_path_tp, pdf_path_reminder, pdf_path_receipt"
      )
      .eq("id", invoiceId)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Choose which PDF to send (prefer the patient invoice, then receipt).
    const pdfByType: Record<string, string | null> = {
      tg: invoice.pdf_path_tg,
      tp: invoice.pdf_path_tp,
      reminder: invoice.pdf_path_reminder,
      receipt: invoice.pdf_path_receipt,
    };
    const pdfPath =
      (invoiceType && pdfByType[invoiceType]) ||
      invoice.pdf_path_tg ||
      invoice.pdf_path_receipt ||
      invoice.pdf_path ||
      invoice.pdf_path_tp;

    if (!pdfPath) {
      return NextResponse.json(
        { error: "No PDF has been generated for this invoice yet. Generate it first." },
        { status: 400 }
      );
    }

    // Patient (recipient + name)
    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("first_name, last_name, email, phone, street_address, postal_code, town")
      .eq("id", invoice.patient_id)
      .single();

    const recipient = (to || patient?.email || "").trim();
    if (!recipient) {
      return NextResponse.json({ error: "No email address on file for this patient" }, { status: 400 });
    }

    // Ensure a Payrexx payment link (only for cash/online/card invoices).
    let paymentLink: string | null = invoice.payrexx_payment_link || null;
    const method = (invoice.payment_method || "").toLowerCase();
    const eligible = method.includes("cash") || method.includes("online") || method.includes("card");

    if (!paymentLink && eligible && Number(invoice.total_amount) > 0) {
      try {
        const gatewayResponse = await createPayrexxGateway({
          amount: Math.round(Number(invoice.total_amount) * 100),
          currency: "CHF",
          referenceId: invoice.invoice_number,
          purpose: `Invoice ${invoice.invoice_number} - Medical Services`,
          forename: patient?.first_name || undefined,
          surname: patient?.last_name || undefined,
          email: patient?.email || undefined,
          phone: patient?.phone || undefined,
          street: patient?.street_address || undefined,
          postcode: patient?.postal_code || undefined,
          place: patient?.town || undefined,
          country: "CH",
        });
        if (gatewayResponse.status === "success") {
          const gd = Array.isArray(gatewayResponse.data)
            ? gatewayResponse.data[0]
            : gatewayResponse.data;
          const gateway = gd as unknown as { id: number; hash: string; link: string };
          paymentLink = gateway.link || `https://aesthetics-ge.payrexx.com/?payment=${gateway.hash}`;
          await supabaseAdmin
            .from("invoices")
            .update({
              payrexx_gateway_id: gateway.id,
              payrexx_gateway_hash: gateway.hash,
              payrexx_payment_link: paymentLink,
              payrexx_payment_status: "waiting",
            })
            .eq("id", invoice.id);
        }
      } catch (e) {
        console.error("[send-to-client] Payrexx link creation failed:", e);
        // Continue without a pay button — the PDF (with QR-bill) is still sent.
      }
    }

    // Download the stored PDF.
    const { data: fileData, error: dlErr } = await supabaseAdmin.storage
      .from("invoice-pdfs")
      .download(pdfPath);

    if (dlErr || !fileData) {
      return NextResponse.json({ error: "Failed to load the invoice PDF" }, { status: 500 });
    }

    let pdfBuffer: Uint8Array = new Uint8Array(await fileData.arrayBuffer());

    // Overlay a clickable pay button when we have a link.
    if (paymentLink) {
      try {
        pdfBuffer = await addPayButtonToPdf(pdfBuffer, paymentLink, { label: "Pay online" });
      } catch (e) {
        console.error("[send-to-client] Failed to embed pay button:", e);
      }
    }

    const base64 = Buffer.from(pdfBuffer).toString("base64");
    const patientName = `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim();
    const amountLabel = new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
    }).format(Number(invoice.total_amount) || 0);

    const html = buildInvoiceEmailHtml({
      recipientName: patientName || undefined,
      invoiceNumber: invoice.invoice_number,
      amountLabel,
      payUrl: paymentLink,
      senderName: "Aesthetics Clinic",
    });

    const result = await sendEmail({
      to: recipient,
      subject: `Invoice ${invoice.invoice_number} — ${amountLabel}`,
      html,
      attachments: [
        { filename: `invoice-${invoice.invoice_number}.pdf`, content: base64, contentType: "application/pdf" },
      ],
      tags: [{ name: "type", value: "medical_invoice" }],
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 502 });
    }

    // Best-effort CRM log so the email appears in the patient timeline.
    try {
      await supabaseAdmin.from("emails").insert({
        patient_id: invoice.patient_id,
        to_address: recipient,
        from_address: process.env.EMAIL_FROM_ADDRESS || "info@mail.maisontoa.com",
        subject: `Invoice ${invoice.invoice_number} — ${amountLabel}`,
        body: html,
        direction: "outbound",
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[send-to-client] CRM email log failed:", e);
    }

    return NextResponse.json({ ok: true, messageId: result.messageId, paymentLink });
  } catch (error) {
    console.error("[send-to-client] Fatal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
