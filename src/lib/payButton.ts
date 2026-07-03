/**
 * Shared helpers for adding a Payrexx "Pay online" call-to-action to
 * (1) an existing PDF invoice and (2) the HTML email that carries it.
 *
 * Used by both the patient/medical invoicing flow and the admin
 * client-billing (Aliice SaaS) invoicing flow.
 */

import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from "pdf-lib";

export type PayButtonPdfOptions = {
  label?: string;
  /** Where to place the pill on the first page. */
  position?: "top" | "bottom";
};

/**
 * Overlay a clickable "Pay online" pill onto the first page of an existing
 * PDF and return the new PDF bytes. Placed in the top/bottom margin to avoid
 * colliding with dense content such as a Swiss QR-bill.
 */
export async function addPayButtonToPdf(
  pdfBytes: Uint8Array | ArrayBuffer,
  payUrl: string,
  options: PayButtonPdfOptions = {}
): Promise<Uint8Array> {
  const bytes = pdfBytes instanceof ArrayBuffer ? new Uint8Array(pdfBytes) : pdfBytes;
  const pdf = await PDFDocument.load(bytes);
  const page = pdf.getPages()[0];
  if (!page) return await pdf.save();

  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  const label = options.label || "Pay online";
  const fontSize = 11;
  const padX = 14;
  const textWidth = font.widthOfTextAtSize(label, fontSize);
  const bw = textWidth + padX * 2;
  const bh = 22;
  const x = width - bw - 24; // right margin
  const y = options.position === "bottom" ? 24 : height - bh - 18; // default top-right

  // Pill background (Payrexx/brand blue).
  page.drawRectangle({
    x,
    y,
    width: bw,
    height: bh,
    color: rgb(0.02, 0.52, 0.78),
  });
  page.drawText(label, {
    x: x + padX,
    y: y + (bh - fontSize) / 2 + 1,
    size: fontSize,
    font,
    color: rgb(1, 1, 1),
  });

  // Clickable link annotation over the pill.
  const linkAnnotation = pdf.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [x, y, x + bw, y + bh],
    Border: [0, 0, 0],
    A: {
      Type: "Action",
      S: "URI",
      URI: PDFString.of(payUrl),
    },
  });
  const linkRef = pdf.context.register(linkAnnotation);
  const existing = page.node.Annots();
  if (existing) {
    existing.push(linkRef);
  } else {
    page.node.set(PDFName.of("Annots"), pdf.context.obj([linkRef]));
  }

  return await pdf.save();
}

export type PayEmailOptions = {
  recipientName?: string;
  invoiceNumber: string;
  amountLabel: string; // e.g. "CHF 150.00"
  payUrl?: string | null;
  dueDateLabel?: string | null;
  senderName?: string;
  intro?: string;
  logoUrl?: string;
};

/**
 * Build a clean, email-client-safe HTML body with an optional "Pay now"
 * button. The PDF invoice is expected to be attached alongside.
 */
export function buildInvoiceEmailHtml(opts: PayEmailOptions): string {
  const {
    recipientName,
    invoiceNumber,
    amountLabel,
    payUrl,
    dueDateLabel,
    senderName = "Aliice",
    intro,
    logoUrl = "https://www.aliice.app/logos/aliice-logo.png",
  } = opts;

  const greeting = recipientName ? `Hello ${escapeHtml(recipientName)},` : "Hello,";
  const introLine =
    intro ||
    `Please find attached invoice <strong>${escapeHtml(invoiceNumber)}</strong> for <strong>${escapeHtml(amountLabel)}</strong>.`;

  const payBlock = payUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
         <tr><td style="border-radius:999px;background:linear-gradient(90deg,#0284c7,#7c3aed);">
           <a href="${escapeAttr(payUrl)}" target="_blank" style="display:inline-block;padding:14px 34px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">Pay ${escapeHtml(amountLabel)} online &rarr;</a>
         </td></tr>
       </table>
       <p style="margin:0 0 16px 0;font-size:13px;color:#94a3b8;">Or copy this secure link: <a href="${escapeAttr(payUrl)}" style="color:#0284c7;">${escapeHtml(payUrl)}</a></p>`
    : "";

  const dueLine = dueDateLabel
    ? `<p style="margin:0 0 16px 0;font-size:14px;color:#475569;">Payment due by <strong>${escapeHtml(dueDateLabel)}</strong>.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
      <tr><td style="padding:28px 36px 4px 36px;"><img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(senderName)}" width="112" style="display:block;width:112px;max-width:112px;height:auto;border:0;"/></td></tr>
      <tr><td style="padding:12px 36px 28px 36px;">
        <h1 style="margin:8px 0 16px 0;font-size:22px;font-weight:800;color:#0f172a;">Invoice ${escapeHtml(invoiceNumber)}</h1>
        <p style="margin:0 0 16px 0;font-size:15px;color:#475569;">${greeting}</p>
        <p style="margin:0 0 16px 0;font-size:15px;line-height:23px;color:#475569;">${introLine}</p>
        ${dueLine}
        ${payBlock}
        <p style="margin:0 0 4px 0;font-size:15px;color:#475569;">The invoice PDF is attached to this email.</p>
        <p style="margin:20px 0 0 0;font-size:15px;color:#475569;">Kind regards,<br/><strong style="color:#0f172a;">${escapeHtml(senderName)}</strong></p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
