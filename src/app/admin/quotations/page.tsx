"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  Loader2,
  FileText,
  User,
  Building2,
  Search,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
  Send,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import jsPDF from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  convertInchesToTwip,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  VerticalAlign,
  ShadingType,
} from "docx";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  section: "onboarding" | "subscription" | "addons" | "other";
  description: string;
  detail: string;
  includeBullets: string[];
  quantity: number;
  unitPrice: number;
  recurring: "once" | "monthly" | "yearly";
  optional?: boolean;
}

interface QuoteData {
  quoteNumber: string;
  issueDate: string;
  validUntil: string;
  // Recipient
  clientName: string;
  clientContactName: string;
  clientEmail: string;
  clientContactEmail: string;
  clientAddress: string;
  clientCity: string;
  clientPhone: string;
  // Sender
  fromName: string;
  fromAddress: string;
  fromCity: string;
  fromEmail: string;
  fromPhone: string;
  fromWebsite: string;
  // Terms
  notes: string;
  terms: string;
}

interface OrgClient {
  id: string;
  name: string;
  email: string | null;
  street_address: string | null;
  city: string | null;
  country: string | null;
}

// ─── Seed data for Rappjderm ─────────────────────────────────────────────────

const RAPPJDERM_ITEMS: Omit<LineItem, "id">[] = [
  {
    section: "onboarding",
    description: "Onboarding & Setup",
    detail:
      "Fixed one-time fee for the complete implementation of Aliice at Rappjderm. " +
      "Includes project scoping, data migration, platform configuration, workflow adaptation, and staff training to ensure a smooth go-live.",
    includeBullets: [
      "24/7 support",
      "Team training",
      "Ongoing customer support & maintenance",
      "Data migration",
      "Initial platform setup",
      "User configuration",
      "Automation configuration",
      "Adaptation of existing workflows",
    ],
    quantity: 1,
    unitPrice: 2800,
    recurring: "once",
  },
  {
    section: "subscription",
    description: "Aliice Professional Plan — Annual commitment (billed monthly)",
    detail:
      "12-month subscription commitment, billed monthly in advance. " +
      "A monthly option without annual commitment is also available at CHF 1,790/month.",
    includeBullets: [
      "Patient management",
      "Appointment booking",
      "Basic calendar / agenda",
      "Lead management",
      "Tasks & reminders",
      "Email notifications",
      "Deal pipeline",
      "Invoicing (TARMED/TARDOC)",
      "Workflow automation",
      "Marketing campaigns",
      "Advanced analytics",
    ],
    quantity: 1,
    unitPrice: 1610,
    recurring: "monthly",
  },
  {
    section: "addons",
    description: "3.a AI Custom Workflow Engine",
    detail:
      "Define intelligent, rule-based automation sequences triggered when a specific document type or image category is scanned. " +
      "Includes unlimited workflow templates, AI-suggested follow-up actions, conditional branching, multi-step sequences with delays, and a visual builder.",
    includeBullets: [],
    quantity: 1,
    unitPrice: 99,
    recurring: "monthly",
  },
  {
    section: "addons",
    description: "3.b AI Document Scanner — Starter Pack (500 scans/month)",
    detail:
      "Upload photographs, scanned letters, or digital documents and let Aliice AI extract structured tasks automatically. " +
      "Supports referral letters, insurance pre-authorisations, lab results, intake forms, and handwritten notes. Includes 500 scans per calendar month.",
    includeBullets: [],
    quantity: 1,
    unitPrice: 149,
    recurring: "monthly",
  },
  {
    section: "addons",
    description: "3.c Additional Scan Volume — 1,000 extra scans/month",
    detail:
      "Optional add-on that extends scanning capacity by an additional 1,000 documents per month beyond the Starter Pack. " +
      "Activated only if needed; multiple units can be added for larger volumes.",
    includeBullets: [],
    quantity: 1,
    unitPrice: 79,
    recurring: "monthly",
    optional: true,
  },
  {
    section: "addons",
    description: "Optional Cloud Storage",
    detail:
      "Additional secure cloud storage for documents, images, and backups beyond the allowance included in the Professional Plan.",
    includeBullets: [],
    quantity: 1,
    unitPrice: 49,
    recurring: "monthly",
    optional: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateQuoteNumber() {
  const d = new Date();
  return `QUO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 900 + 100)}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function validUntilDefault() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatCHF(amount: number) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF", minimumFractionDigits: 2 }).format(amount);
}

function recurringLabel(r: LineItem["recurring"]) {
  if (r === "monthly") return "/mo";
  if (r === "yearly") return "/yr";
  return "";
}

// ─── PDF builder ─────────────────────────────────────────────────────────────

async function buildQuoteDoc(quote: QuoteData, items: LineItem[]): Promise<jsPDF> {
  // Load logo
  let logoBase64: string | null = null;
  let logoW = 0;
  let logoH = 0;

  const tryLoad = (src: string) =>
    new Promise<{ b64: string; w: number; h: number }>((res, rej) => {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d")!.drawImage(img, 0, 0);
        res({ b64: c.toDataURL("image/png"), w, h });
      };
      img.onerror = rej;
      img.src = src;
    });

  try {
    const r = await tryLoad("/logos/logo-aliice-vector.bleu.png");
    logoBase64 = r.b64; logoW = r.w; logoH = r.h;
  } catch {
    try {
      const r = await tryLoad("/logos/aliice-logo.png");
      logoBase64 = r.b64; logoW = r.w; logoH = r.h;
    } catch { /* no logo */ }
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pW = doc.internal.pageSize.getWidth();
  const pH = doc.internal.pageSize.getHeight();
  const mg = 18;
  const footerH = 14;
  const safeBottom = pH - footerH - 6;
  let y = 0;
  let pageNum = 1;

  // ── helpers ─────────────────────────────────────────────────────────────
  const drawLogo = (x: number, yPos: number, maxH: number) => {
    if (!logoBase64 || !logoW || !logoH) return;
    const aspect = logoW / logoH;
    doc.addImage(logoBase64, "PNG", x, yPos, maxH * aspect, maxH);
  };

  const addFooter = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pH - footerH, pW, footerH, "F");
    drawLogo(mg, pH - footerH + 2.5, 9);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${quote.fromName}  ·  ${quote.fromEmail}  ·  ${quote.fromWebsite}`,
      mg + 28, pH - 5
    );
    doc.text(`Page ${pageNum}`, pW - mg, pH - 5, { align: "right" });
  };

  const newPage = () => {
    addFooter();
    doc.addPage();
    pageNum++;
    y = mg;
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pW, 10, "F");
    drawLogo(mg, 1.5, 7);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`${quote.quoteNumber}  —  continued`, mg + 28, 6.5);
    doc.text("QUOTATION", pW - mg, 6.5, { align: "right" });
    y = 15;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > safeBottom) newPage();
  };

  const splitAndHeight = (text: string, width: number, fontSize: number, lineHeight: number) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, width);
    return { lines, h: lines.length * lineHeight };
  };

  // ── Page 1 header — black background ────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pW, 42, "F");
  drawLogo(mg, (42 - 14) / 2, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", pW - mg, 24, { align: "right" });
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(quote.quoteNumber, pW - mg, 33, { align: "right" });

  y = 50;

  // ── From / Quote To — same layout, facing each other ───────────────────
  const col2 = pW / 2 + 5;
  const colW = pW / 2 - mg - 5;

  const blockH = Math.max(
    36,
    8 + splitAndHeight(quote.fromAddress, colW, 8.5, 4.5).h + splitAndHeight(quote.fromCity, colW, 8.5, 4.5).h,
    8 + splitAndHeight(quote.clientAddress || "", colW, 8.5, 4.5).h + splitAndHeight(quote.clientCity, colW, 8.5, 4.5).h
  );
  ensureSpace(blockH + 14);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("FROM", mg, y);
  doc.text("QUOTE TO", col2, y);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(quote.fromName, mg, y + 6);
  doc.text(quote.clientName || "—", col2, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);

  const fromAddrLines = doc.splitTextToSize(quote.fromAddress, colW);
  doc.text(fromAddrLines, mg, y + 12);
  doc.text(quote.fromCity, mg, y + 12 + fromAddrLines.length * 4.5);
  doc.text(`Email: ${quote.fromEmail}`, mg, y + 12 + fromAddrLines.length * 4.5 + 4.5);
  if (quote.fromPhone) doc.text(`Phone: ${quote.fromPhone}`, mg, y + 12 + fromAddrLines.length * 4.5 + 9);

  const clientAddrLines = doc.splitTextToSize(quote.clientAddress || "", colW);
  let cy = y + 12;
  if (clientAddrLines.length) { doc.text(clientAddrLines, col2, cy); cy += clientAddrLines.length * 4.5; }
  if (quote.clientCity) { doc.text(quote.clientCity, col2, cy); cy += 4.5; }
  if (quote.clientEmail) { doc.text(`Email: ${quote.clientEmail}`, col2, cy); cy += 4.5; }
  if (quote.clientPhone) { doc.text(`Phone: ${quote.clientPhone}`, col2, cy); cy += 4.5; }
  if (quote.clientContactName) { doc.text(`Contact: ${quote.clientContactName}`, col2, cy); cy += 4.5; }
  if (quote.clientContactEmail) { doc.text(`Mgr email: ${quote.clientContactEmail}`, col2, cy); }

  y += blockH + 10;

  // ── Meta bar ────────────────────────────────────────────────────────────
  ensureSpace(24);
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(mg, y, pW - 2 * mg, 18, 2, 2, "FD");

  const meta = [
    { label: "Quote No.", value: quote.quoteNumber },
    { label: "Issue Date", value: formatDate(quote.issueDate) },
    { label: "Valid Until", value: formatDate(quote.validUntil) },
    { label: "Currency", value: "CHF" },
  ];
  const metaW = (pW - 2 * mg) / meta.length;
  meta.forEach((m, i) => {
    const mx = mg + i * metaW + 5;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(m.label.toUpperCase(), mx, y + 6);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(m.value, mx, y + 13);
  });
  y += 24;

  // ── Line items by section ───────────────────────────────────────────────
  const tLeft = mg;
  const tRight = pW - mg;
  const tW = tRight - tLeft;
  const cQty = 22;
  const cUnit = 36;
  const cAmt = 34;
  const cDesc = tW - cQty - cUnit - cAmt;
  const detailLineH = 4.3;
  const bulletLineH = 4.0;

  const sectionOrder: LineItem["section"][] = ["onboarding", "subscription", "addons", "other"];
  const sectionTitle: Record<LineItem["section"], string> = {
    onboarding: "1. Onboarding & Setup (One-time fee)",
    subscription: "2. Subscription — Aliice Professional Plan",
    addons: "3. Add-on Modules",
    other: "Additional Items",
  };

  sectionOrder.forEach((section) => {
    const sectionItems = items.filter(i => i.section === section && i.description.trim());
    if (!sectionItems.length) return;

    const sectionHeaderH = 10;
    ensureSpace(sectionHeaderH + 10);

    // Section header — dark grey band so it never looks orphaned
    doc.setFillColor(60, 60, 60);
    doc.rect(tLeft, y, tW, sectionHeaderH, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(sectionTitle[section], tLeft + 4, y + 6.5);
    y += sectionHeaderH + 3;

    // Item-level header row (first item only, reused style)
    doc.setFillColor(15, 23, 42);
    doc.rect(tLeft, y, tW, 8, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("DESCRIPTION", tLeft + 4, y + 5.5);
    doc.text("QTY", tLeft + cDesc + cQty / 2, y + 5.5, { align: "center" });
    doc.text("UNIT PRICE", tLeft + cDesc + cQty + cUnit / 2, y + 5.5, { align: "center" });
    doc.text("AMOUNT", tRight - cAmt / 2, y + 5.5, { align: "center" });
    y += 8;

    sectionItems.forEach((item, idx) => {
      const detailLines = item.detail.trim() ? doc.splitTextToSize(item.detail, cDesc - 6) : [];
      const bullets = item.includeBullets || [];
      const bulletLines = bullets.length
        ? doc.splitTextToSize("• " + bullets.join("  • "), cDesc - 10)
        : [];
      const rowH = 9 + detailLines.length * detailLineH + bulletLines.length * bulletLineH + (bullets.length ? 2 : 0);

      ensureSpace(rowH);

      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(tLeft, y, tW, rowH, "F");
      }

      const lineTotal = item.quantity * item.unitPrice;

      // Title
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(item.description + (item.optional ? " (optional)" : ""), tLeft + 4, y + 5.5);

      // Detail
      let ly = y + 10;
      if (detailLines.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(80, 80, 80);
        doc.text(detailLines, tLeft + 4, ly, { lineHeightFactor: 1.4 });
        ly += detailLines.length * detailLineH + 1.5;
      }

      // Includes bullets
      if (bulletLines.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(60, 60, 60);
        doc.text(bulletLines, tLeft + 6, ly, { lineHeightFactor: 1.35 });
      }

      // Numeric columns centred vertically
      const numY = y + rowH / 2 + 1.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(String(item.quantity), tLeft + cDesc + cQty / 2, numY, { align: "center" });

      const unitStr = formatCHF(item.unitPrice) + recurringLabel(item.recurring);
      doc.text(unitStr, tLeft + cDesc + cQty + cUnit / 2, numY, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.text(formatCHF(lineTotal), tRight - 4, numY, { align: "right" });

      y += rowH;

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(tLeft, y, tRight, y);
    });

    // Section bottom border
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(tLeft, y, tRight, y);
    y += 8;
  });

  // ── Payment Summary ─────────────────────────────────────────────────────
  const oneTimeSub = items.filter(i => i.recurring === "once" && i.description.trim()).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const monthlySub = items.filter(i => i.recurring === "monthly" && i.description.trim() && !i.optional).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const optionalMonthly = items.filter(i => i.recurring === "monthly" && i.description.trim() && i.optional).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const grandTotalWithOptional = items.filter(i => i.description.trim()).reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const summaryNeeded = 56 + (optionalMonthly > 0 ? 8 : 0);
  ensureSpace(summaryNeeded + 10);

  const sumBoxW = 96;
  const sumX = pW - mg - sumBoxW;
  const sumValX = pW - mg;

  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(sumX - 4, y, sumBoxW + 4, 10, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("PAYMENT SUMMARY", sumX, y + 6.5);
  y += 14;

  const drawSummaryRow = (label: string, value: string, bold = false) => {
    doc.setFontSize(bold ? 9 : 8.5);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(bold ? 15 : 71, bold ? 23 : 85, bold ? 42 : 105);
    doc.text(label, sumX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(bold ? 15 : 30, bold ? 23 : 41, bold ? 42 : 59);
    doc.text(value, sumValX, y, { align: "right" });
    y += 7;
  };

  drawSummaryRow("One-time onboarding payment", formatCHF(oneTimeSub));
  drawSummaryRow("Monthly subscription payment", formatCHF(monthlySub) + "/mo");
  if (optionalMonthly > 0) drawSummaryRow("Optional add-ons (monthly)", formatCHF(optionalMonthly) + "/mo");
  y += 2;

  // Monthly committed total line (not mixed with one-time)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(sumX - 4, y, sumBoxW + 4, 14, 2.5, 2.5, "F");
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("MONTHLY TOTAL", sumX, y + 9.5);
  doc.text(formatCHF(monthlySub) + "/mo", sumValX, y + 9.5, { align: "right" });
  y += 18;

  if (optionalMonthly > 0) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      `With optional add-ons activated: ${formatCHF(grandTotalWithOptional)}/mo`,
      sumValX, y, { align: "right" }
    );
    y += 6;
  }
  y += 10;

  // ── Notes ───────────────────────────────────────────────────────────────
  if (quote.notes.trim()) {
    const noteLines = doc.splitTextToSize(quote.notes, pW - 2 * mg);
    ensureSpace(10 + noteLines.length * 4.5);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("NOTES", mg, y);
    y += 5;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(noteLines, mg, y);
    y += noteLines.length * 4.5 + 10;
  }

  // ── Terms ───────────────────────────────────────────────────────────────
  if (quote.terms.trim()) {
    const termLines = doc.splitTextToSize(quote.terms, pW - 2 * mg);
    ensureSpace(10 + termLines.length * 4.2);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("TERMS & CONDITIONS", mg, y);
    y += 5;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(termLines, mg, y);
    y += termLines.length * 4.2 + 10;
  }

  // ── Acceptance signature block ───────────────────────────────────────────
  ensureSpace(38);
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.roundedRect(mg, y, pW - 2 * mg, 34, 3, 3, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("ACCEPTANCE", mg + 5, y + 7);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("By signing below, the client agrees to the terms and pricing outlined in this quotation.", mg + 5, y + 13);

  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.4);
  doc.line(mg + 5, y + 28, mg + 75, y + 28);
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("Client Signature & Date", mg + 5, y + 32);

  doc.line(pW - mg - 75, y + 28, pW - mg - 5, y + 28);
  doc.text("Authorised by Aliice", pW - mg - 75, y + 32);

  y += 38;

  // ── Footer on last page ──────────────────────────────────────────────────
  addFooter();

  return doc;
}

// ─── Word (.docx) export builder ─────────────────────────────────────────────

async function loadLogoBuffer(src: string): Promise<{ buffer: Uint8Array; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const base64 = dataUrl.split(",")[1] || "";
        const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        resolve({ buffer, width: img.width, height: img.height });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function buildQuoteDocx(quote: QuoteData, items: LineItem[]): Promise<Blob> {
  const logo = await loadLogoBuffer("/logos/logo-aliice-vector.bleu.png");

  const EMU_PER_MM = 36000;
  const headerLogoH = 14 * EMU_PER_MM;
  const footerLogoH = 9 * EMU_PER_MM;

  const logoImage =
    logo && logo.width && logo.height
      ? new ImageRun({
          data: logo.buffer,
          transformation: {
            width: Math.round(headerLogoH * (logo.width / logo.height)),
            height: headerLogoH,
          },
          type: "png",
        })
      : new TextRun({ text: "Aliice", bold: true, color: "FFFFFF", size: 28 });

  const footerLogo =
    logo && logo.width && logo.height
      ? new ImageRun({
          data: logo.buffer,
          transformation: {
            width: Math.round(footerLogoH * (logo.width / logo.height)),
            height: footerLogoH,
          },
          type: "png",
        })
      : new TextRun({ text: "Aliice", color: "FFFFFF", size: 18 });

  const sectionTitle: Record<LineItem["section"], string> = {
    onboarding: "1. Onboarding & Setup (One-time fee)",
    subscription: "2. Subscription — Aliice Professional Plan",
    addons: "3. Add-on Modules",
    other: "Additional Items",
  };

  const sectionOrder: LineItem["section"][] = ["onboarding", "subscription", "addons", "other"];

  const darkCell = {
    shading: { fill: "0F172A", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
  };

  const greyCell = {
    shading: { fill: "3C3C3C", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
  };

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            ...darkCell,
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [logoImage] })],
          }),
          new TableCell({
            ...darkCell,
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "QUOTATION", bold: true, size: 32, color: "FFFFFF" })],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `Quote #: ${quote.quoteNumber}`, size: 18, color: "E2E8F0" })],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `Issue Date: ${quote.issueDate}`, size: 18, color: "E2E8F0" })],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `Valid Until: ${quote.validUntil}`, size: 18, color: "E2E8F0" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const fromCell = new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    children: [
      new Paragraph({ children: [new TextRun({ text: "FROM", bold: true, color: "0F172A", size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: quote.fromName, bold: true, size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: quote.fromAddress, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: quote.fromCity, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: `Email: ${quote.fromEmail}`, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: `Phone: ${quote.fromPhone || "—"}`, size: 20 })] }),
    ],
  });

  const toCell = new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    children: [
      new Paragraph({ children: [new TextRun({ text: "QUOTE TO", bold: true, color: "0F172A", size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: quote.clientName || "—", bold: true, size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: quote.clientContactName, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: quote.clientAddress, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: quote.clientCity, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: `Email: ${quote.clientEmail}`, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: `Phone: ${quote.clientPhone || "—"}`, size: 20 })] }),
    ],
  });

  const addressTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [fromCell, toCell] })],
  });

  const notesPara = quote.notes.trim()
    ? new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: quote.notes, size: 20 })],
      })
    : null;

  const bodyContent: (Paragraph | Table)[] = [];

  sectionOrder.forEach((section) => {
    const sectionItems = items.filter((i) => i.section === section && i.description.trim());
    if (!sectionItems.length) return;

    bodyContent.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                ...greyCell,
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: sectionTitle[section], bold: true, color: "FFFFFF", size: 22 })],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    sectionItems.forEach((item) => {
      const descChildren: Paragraph[] = [
        new Paragraph({ children: [new TextRun({ text: item.description, bold: true, size: 21 })] }),
      ];
      if (item.detail.trim()) {
        descChildren.push(new Paragraph({ children: [new TextRun({ text: item.detail, size: 20, color: "475569" })] }));
      }
      if (item.includeBullets?.length) {
        item.includeBullets.forEach((b) => {
          descChildren.push(
            new Paragraph({
              indent: { left: 360 },
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: `• ${b}`, size: 20 })],
            })
          );
        });
      }
      if (item.optional) {
        descChildren.push(
          new Paragraph({
            spacing: { before: 60 },
            children: [new TextRun({ text: "Optional add-on", italics: true, color: "B45309", size: 20 })],
          })
        );
      }

      const lineTotal = item.quantity * item.unitPrice;
      const priceCell = new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `Qty: ${item.quantity}`, size: 20 })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: formatCHF(item.unitPrice), size: 20 })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: formatCHF(lineTotal), bold: true, size: 21 })],
          }),
          item.recurring !== "once"
            ? new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: item.recurring, size: 18, color: "64748B" })],
              })
            : new Paragraph({ text: "" }),
        ],
      });

      bodyContent.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  margins: { top: 80, bottom: 80, left: 80, right: 80 },
                  children: descChildren,
                }),
                priceCell,
              ],
            }),
          ],
        })
      );
    });
  });

  const oneTimeSub = items
    .filter((i) => i.recurring === "once" && i.description.trim())
    .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const monthlySub = items
    .filter((i) => i.recurring === "monthly" && i.description.trim() && !i.optional)
    .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const optionalMonthly = items
    .filter((i) => i.recurring === "monthly" && i.description.trim() && i.optional)
    .reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const summaryRows: { label: string; value: string }[] = [
    { label: "One-time onboarding payment", value: formatCHF(oneTimeSub) },
    { label: "Monthly subscription payment", value: `${formatCHF(monthlySub)}/mo` },
  ];
  if (optionalMonthly > 0) {
    summaryRows.push({ label: "Optional add-ons (monthly)", value: `${formatCHF(optionalMonthly)}/mo` });
  }

  const summaryTable = new Table({
    width: { size: 70, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.RIGHT,
    rows: [
      ...summaryRows.map(
        (row) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [new Paragraph({ children: [new TextRun({ text: row.label, size: 20 })] })],
              }),
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: row.value, bold: true, size: 21 })],
                  }),
                ],
              }),
            ],
          })
      ),
      new TableRow({
        children: [
          new TableCell({
            ...darkCell,
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "MONTHLY TOTAL", bold: true, color: "FFFFFF", size: 22 })],
              }),
            ],
          }),
          new TableCell({
            ...darkCell,
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: `${formatCHF(monthlySub)}/mo`, bold: true, color: "FFFFFF", size: 22 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const termParas = quote.terms
    .split("\n")
    .filter(Boolean)
    .map((line) => new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: line, size: 19 })] }));

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: "Client Signature & Date", bold: true, size: 20 })] }),
              new Paragraph({
                spacing: { before: 240 },
                children: [new TextRun({ text: "_____________________________", color: "94A3B8" })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "Authorised by Aliice", bold: true, size: 20 })],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 240 },
                children: [new TextRun({ text: "_____________________________", color: "94A3B8" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.27),
              height: convertInchesToTwip(11.69),
            },
            margin: {
              top: convertInchesToTwip(0.79),
              right: convertInchesToTwip(0.79),
              bottom: convertInchesToTwip(0.79),
              left: convertInchesToTwip(0.79),
            },
          },
        },
        headers: {
          default: new Header({
            children: [headerTable],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        ...darkCell,
                        width: { size: 12, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [footerLogo] })],
                      }),
                      new TableCell({
                        ...darkCell,
                        width: { size: 58, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            children: [new TextRun({ text: "Aliice Computer Software Trading", color: "FFFFFF", size: 16 })],
                          }),
                          new Paragraph({
                            children: [new TextRun({ text: "hello@aliice.app · www.aliice.app", color: "CBD5E1", size: 16 })],
                          }),
                        ],
                      }),
                      new TableCell({
                        ...darkCell,
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({ text: "Page ", color: "FFFFFF", size: 16 }),
                              new TextRun({ children: [PageNumber.CURRENT], color: "FFFFFF", size: 16 }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({ spacing: { before: 220 } }),
          addressTable,
          ...(notesPara ? [notesPara] : []),
          ...bodyContent,
          new Paragraph({ spacing: { before: 240 } }),
          summaryTable,
          new Paragraph({
            spacing: { before: 280, after: 120 },
            children: [new TextRun({ text: "Terms & Conditions", bold: true, size: 24, color: "0F172A" })],
          }),
          ...termParas,
          new Paragraph({ spacing: { before: 280 } }),
          signatureTable,
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

// ─── Component ───────────────────────────────────────────────────────────────

const DEFAULT_TERMS =
  "1. This quotation is valid for 30 days from the issue date.\n" +
  "2. The subscription is based on a 12-month commitment and is billed monthly in advance on the 1st of each month.\n" +
  "3. Cancellation of the annual subscription must be submitted at least one month before the end of the current annual term.\n" +
  "4. If a monthly cancellation option is available, it will be explicitly stated in the signed agreement.\n" +
  "5. One-time onboarding fees are invoiced upon project initiation and are non-refundable once work has begun.\n" +
  "6. Prices are quoted in Swiss Francs (CHF) and exclude any applicable taxes.\n" +
  "7. Aliice reserves the right to adjust recurring pricing with 30 days written notice.";

function seedRappjderm(): { quote: QuoteData; items: LineItem[] } {
  return {
    quote: {
      quoteNumber: "QUO-20260707-001",
      issueDate: "2026-07-07",
      validUntil: "2026-08-06",
      clientName: "Rappjderm",
      clientContactName: "Practice Manager",
      clientEmail: "contact@rappjderm.ch",
      clientContactEmail: "manager@rappjderm.ch",
      clientAddress: "",
      clientCity: "Switzerland",
      clientPhone: "",
      fromName: "Aliice Computer Software Trading",
      fromAddress: "Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263",
      fromCity: "Dubai, United Arab Emirates",
      fromEmail: "hello@aliice.app",
      fromPhone: "+971 4 XXX XXXX",
      fromWebsite: "www.aliice.app",
      notes:
        "Thank you for your interest in Aliice. This quotation covers the Aliice Professional Plan, onboarding services, and the AI Document Scanner & Custom Workflow Engine add-on modules. We look forward to partnering with Rappjderm.",
      terms: DEFAULT_TERMS,
    },
    items: RAPPJDERM_ITEMS.map((i) => ({ ...i, id: crypto.randomUUID() })),
  };
}

const SECTIONS: { value: LineItem["section"]; label: string }[] = [
  { value: "onboarding", label: "Onboarding & Setup" },
  { value: "subscription", label: "Subscription" },
  { value: "addons", label: "Add-on Modules" },
  { value: "other", label: "Other" },
];

export default function QuotationsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Org search
  const [orgClients, setOrgClients] = useState<OrgClient[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropOpen, setClientDropOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const clientDropRef = useRef<HTMLDivElement>(null);

  // Load with Rappjderm seed
  const seeded = seedRappjderm();
  const [quote, setQuote] = useState<QuoteData>(seeded.quote);
  const [items, setItems] = useState<LineItem[]>(seeded.items);

  useEffect(() => {
    setLoadingClients(true);
    fetch("/api/admin/organizations")
      .then((r) => r.json())
      .then((d) => {
        const orgs: OrgClient[] = (d.organizations || []).map((o: {
          id: string; name: string; email: string | null;
          street_address?: string | null; city?: string | null; country?: string | null;
        }) => ({
          id: o.id, name: o.name, email: o.email,
          street_address: o.street_address ?? null,
          city: o.city ?? null, country: o.country ?? null,
        }));
        setOrgClients(orgs);
      })
      .catch(() => {})
      .finally(() => setLoadingClients(false));
  }, []);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (clientDropRef.current && !clientDropRef.current.contains(e.target as Node))
        setClientDropOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const filteredClients = orgClients.filter((o) => {
    const q = clientSearch.toLowerCase();
    return !q || o.name.toLowerCase().includes(q) || (o.email || "").toLowerCase().includes(q);
  });

  function selectClient(org: OrgClient) {
    setSelectedOrgId(org.id);
    setQuote((prev) => ({
      ...prev,
      clientName: org.name,
      clientEmail: org.email || "",
      clientAddress: org.street_address || "",
      clientCity: [org.city, org.country].filter(Boolean).join(", "),
    }));
    setClientDropOpen(false);
    setClientSearch("");
  }

  const updateQuote = useCallback((field: keyof QuoteData, value: string) => {
    setQuote((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, {
      id: crypto.randomUUID(),
      section: "addons",
      description: "",
      detail: "",
      includeBullets: [],
      quantity: 1,
      unitPrice: 0,
      recurring: "monthly",
    }]);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateItem = (id: string, field: keyof Omit<LineItem, "id">, value: string | number | boolean | string[]) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const filledItems = items.filter((i) => i.description.trim());
  const oneTime = filledItems.filter(i => i.recurring === "once" && !i.optional).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const monthly = filledItems.filter(i => i.recurring === "monthly" && !i.optional).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const optionalMonthly = filledItems.filter(i => i.recurring === "monthly" && i.optional).reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const validate = () => {
    if (!quote.clientName) { alert("Please enter a client name."); return false; }
    if (filledItems.length === 0) { alert("Please add at least one line item."); return false; }
    return true;
  };

  const exportPDF = async () => {
    if (!validate()) return;
    setIsGenerating(true);
    setActionError(null);
    try {
      const doc = await buildQuoteDoc(quote, items);
      doc.save(`${quote.quoteNumber}.pdf`);
      setActionMsg("PDF exported successfully.");
    } catch {
      setActionError("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportWord = async () => {
    if (!validate()) return;
    setIsGeneratingDocx(true);
    setActionError(null);
    try {
      const blob = await buildQuoteDocx(quote, items);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quote.quoteNumber}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setActionMsg("Word document exported successfully.");
    } catch {
      setActionError("Failed to generate Word document. Please try again.");
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const sendToClient = async () => {
    if (!validate()) return;
    if (!quote.clientEmail.trim()) { alert("Please enter the client email first."); return; }
    setSending(true);
    setActionMsg(null);
    setActionError(null);
    try {
      const doc = await buildQuoteDoc(quote, items);
      const base64 = (doc.output("datauristring") as string).split(",").pop() || "";
      const res = await fetch("/api/admin/quotations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: quote.clientEmail,
          quoteNumber: quote.quoteNumber,
          clientName: quote.clientName,
          pdfBase64: base64,
          fileName: `${quote.quoteNumber}.pdf`,
          organizationId: selectedOrgId || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to send");
      setActionMsg(`Quotation sent to ${quote.clientEmail}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  // ─── UI ──────────────────────────────────────────────────────────────────

  const inputCls =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all placeholder:text-slate-400 bg-white";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-violet-600" />
            <h1 className="font-semibold text-slate-900 text-lg">Quotation Generator</h1>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
            {quote.quoteNumber}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sendToClient}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending…" : "Send to Client"}
          </button>
          <button
            onClick={exportWord}
            disabled={isGeneratingDocx}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50"
          >
            {isGeneratingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {isGeneratingDocx ? "Generating…" : "Export Word"}
          </button>
          <button
            onClick={exportPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isGenerating ? "Generating…" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* ── Status bar ── */}
      {(actionMsg || actionError) && (
        <div className={`border-b px-6 py-2 text-xs flex items-center gap-2 ${actionError ? "bg-red-50 border-red-200 text-red-700" : "bg-violet-50 border-violet-100 text-violet-700"}`}>
          {actionError ? actionError : <><CheckCircle2 className="w-3.5 h-3.5" />{actionMsg}</>}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">

          {/* Quote meta */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-violet-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Quotation Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Quote Number</label>
                <input className={inputCls} value={quote.quoteNumber} onChange={(e) => updateQuote("quoteNumber", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <input className={inputCls} value="CHF" readOnly />
              </div>
              <div>
                <label className={labelCls}>Issue Date</label>
                <input type="date" className={inputCls} value={quote.issueDate} onChange={(e) => updateQuote("issueDate", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Valid Until</label>
                <input type="date" className={inputCls} value={quote.validUntil} onChange={(e) => updateQuote("validUntil", e.target.value)} />
              </div>
            </div>
          </div>

          {/* From */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-violet-600" />
              <h2 className="font-semibold text-slate-800 text-sm">From (Aliice)</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Company Name</label>
                <input className={inputCls} value={quote.fromName} onChange={(e) => updateQuote("fromName", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Address</label>
                  <input className={inputCls} value={quote.fromAddress} onChange={(e) => updateQuote("fromAddress", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>City / Country</label>
                  <input className={inputCls} value={quote.fromCity} onChange={(e) => updateQuote("fromCity", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" className={inputCls} value={quote.fromEmail} onChange={(e) => updateQuote("fromEmail", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} value={quote.fromPhone} onChange={(e) => updateQuote("fromPhone", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input className={inputCls} value={quote.fromWebsite} onChange={(e) => updateQuote("fromWebsite", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Quote To */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-violet-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Quote To (Recipient)</h2>
            </div>
            <div className="space-y-3">
              {/* Org search */}
              <div ref={clientDropRef} className="relative">
                <label className={labelCls}>Search Organization</label>
                <button
                  type="button"
                  onClick={() => setClientDropOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white hover:border-violet-400 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {loadingClients ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" /> : <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <span className={`truncate ${quote.clientName ? "text-slate-800" : "text-slate-400"}`}>
                      {quote.clientName || "Select an organization…"}
                    </span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${clientDropOpen ? "rotate-180" : ""}`} />
                </button>
                {clientDropOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input autoFocus type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search by name or email…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                      {filteredClients.length === 0 && <p className="px-4 py-3 text-sm text-slate-400 text-center">No organizations found</p>}
                      {filteredClients.map((org) => (
                        <button key={org.id} type="button" onClick={() => selectClient(org)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-violet-50 transition group ${selectedOrgId === org.id ? "bg-violet-50" : ""}`}>
                          <span className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
                            {org.name[0].toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-violet-700">{org.name}</p>
                            {org.email && <p className="text-xs text-slate-500 truncate">{org.email}</p>}
                          </div>
                          {selectedOrgId === org.id && <CheckCircle2 className="w-4 h-4 text-violet-500 ml-auto shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Client / Company Name *</label>
                <input className={inputCls} value={quote.clientName} onChange={(e) => updateQuote("clientName", e.target.value)} placeholder="e.g. Rappjderm" />
              </div>
              <div>
                <label className={labelCls}>Contact Name</label>
                <input className={inputCls} value={quote.clientContactName} onChange={(e) => updateQuote("clientContactName", e.target.value)} placeholder="e.g. Practice Manager" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" className={inputCls} value={quote.clientEmail} onChange={(e) => updateQuote("clientEmail", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Practice Manager Email</label>
                  <input type="email" className={inputCls} value={quote.clientContactEmail} onChange={(e) => updateQuote("clientContactEmail", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Address</label>
                  <input className={inputCls} value={quote.clientAddress} onChange={(e) => updateQuote("clientAddress", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>City / Country</label>
                  <input className={inputCls} value={quote.clientCity} onChange={(e) => updateQuote("clientCity", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={quote.clientPhone} onChange={(e) => updateQuote("clientPhone", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <label className={labelCls}>Cover Note (shown in PDF)</label>
            <textarea className={`${inputCls} resize-none`} rows={4} value={quote.notes} onChange={(e) => updateQuote("notes", e.target.value)} />
          </div>

          {/* Terms */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <label className={labelCls}>Terms & Conditions</label>
            <textarea className={`${inputCls} resize-none font-mono text-xs`} rows={6} value={quote.terms} onChange={(e) => updateQuote("terms", e.target.value)} />
          </div>
        </div>

        {/* ── RIGHT COLUMN: Line items ── */}
        <div className="space-y-6">

          {/* Line items */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 text-sm">Line Items</h2>
              <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition">
                <Plus className="w-3.5 h-3.5" />Add Item
              </button>
            </div>

            {/* Headers */}
            <div className="grid grid-cols-[120px_1fr_52px_72px_80px_32px] gap-1.5 mb-2 px-1">
              {["Section", "Description", "Qty", "Unit Price", "Billing", ""].map((h) => (
                <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</span>
              ))}
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const lineTotal = item.quantity * item.unitPrice;
                return (
                  <div key={item.id} className={`rounded-xl border border-slate-100 p-3 space-y-2 ${item.optional ? "bg-amber-50/50" : "bg-slate-50"}`}>
                    {/* Row 1: section + description + controls */}
                    <div className="grid grid-cols-[130px_1fr_52px_80px_32px] gap-2 items-start">
                      <select
                        className={inputCls + " text-xs"}
                        value={item.section}
                        onChange={(e) => updateItem(item.id, "section", e.target.value as LineItem["section"])}
                      >
                        {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <input
                        className={inputCls}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Item or service name"
                      />
                      <input
                        type="number" min={1}
                        className={inputCls}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", Math.max(1, Number(e.target.value)))}
                      />
                      <select
                        className={inputCls + " text-xs"}
                        value={item.recurring}
                        onChange={(e) => updateItem(item.id, "recurring", e.target.value as LineItem["recurring"])}
                      >
                        <option value="once">One-time</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                        className="flex items-center justify-center w-8 h-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Row 2: detail + unit price */}
                    <div className="grid grid-cols-[1fr_90px] gap-2">
                      <input
                        className={inputCls + " text-xs text-slate-500"}
                        value={item.detail}
                        onChange={(e) => updateItem(item.id, "detail", e.target.value)}
                        placeholder="Detail / description line"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">CHF</span>
                        <input
                          type="number" min={0} step="0.01"
                          className={inputCls + " pl-10"}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                        />
                      </div>
                    </div>
                    {/* Row 3: includes bullets + optional flag */}
                    <div className="grid grid-cols-[1fr_90px] gap-2 items-start">
                      <input
                        className={inputCls + " text-xs text-slate-500"}
                        value={item.includeBullets.join(" | ")}
                        onChange={(e) => updateItem(item.id, "includeBullets", e.target.value.split("|").map((b) => b.trim()).filter(Boolean))}
                        placeholder="Includes: bullet 1 | bullet 2 | bullet 3"
                      />
                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!item.optional}
                          onChange={(e) => updateItem(item.id, "optional", e.target.checked)}
                          className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                        Optional
                      </label>
                    </div>
                    {/* Line total */}
                    <div className="flex justify-end">
                      <span className="text-xs text-slate-500 font-medium">
                        Line total: <span className="text-slate-900 font-bold">{formatCHF(lineTotal)}</span>
                        {item.recurring !== "once" && <span className="text-violet-500"> {recurringLabel(item.recurring)}</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-slate-800 text-sm">Summary</h2>

            {oneTime > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />One-time onboarding</span>
                <span className="font-semibold text-slate-700">{formatCHF(oneTime)}</span>
              </div>
            )}
            {monthly > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Monthly subscription</span>
                <span className="font-semibold text-slate-700">{formatCHF(monthly)}<span className="text-violet-500 text-xs">/mo</span></span>
              </div>
            )}
            {optionalMonthly > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-amber-500" />Optional add-ons</span>
                <span className="font-semibold text-slate-700">{formatCHF(optionalMonthly)}<span className="text-violet-500 text-xs">/mo</span></span>
              </div>
            )}

            <div className="flex justify-between items-center bg-violet-700 text-white rounded-xl px-4 py-3">
              <span className="font-bold text-sm">Quoted Payments</span>
              <span className="font-bold text-base">{formatCHF(oneTime)} + {formatCHF(monthly)}/mo</span>
            </div>

            {monthly > 0 && oneTime > 0 && (
              <p className="text-xs text-slate-400 flex items-start gap-1.5 mt-1">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-violet-400" />
                One-time onboarding and monthly subscription are billed separately. Optional add-ons are shown separately.
              </p>
            )}
          </div>

          {/* PDF hint */}
          <div className="rounded-2xl border border-dashed border-violet-300 bg-violet-50 p-6 text-center">
            <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-violet-700">Professional Quotation PDF</p>
            <p className="text-xs text-violet-500 mt-1">
              Exports with the Aliice logo, three numbered sections, detailed include lists, clear payment summary, and black/white layout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
