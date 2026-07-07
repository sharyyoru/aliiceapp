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

// ─── Types ───────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  category: string;
  description: string;
  detail: string;
  quantity: number;
  unitPrice: number;
  recurring: "once" | "monthly" | "yearly";
}

interface QuoteData {
  quoteNumber: string;
  issueDate: string;
  validUntil: string;
  // Recipient
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientCity: string;
  // Sender
  fromName: string;
  fromAddress: string;
  fromCity: string;
  fromEmail: string;
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
    category: "Subscription",
    description: "Aliice Pro Plan",
    detail: "Full-featured clinic management platform — unlimited appointments, patients, invoices, CRM pipeline, multi-user access, and priority support.",
    quantity: 1,
    unitPrice: 490,
    recurring: "monthly",
  },
  {
    category: "Subscription",
    description: "Onboarding & Setup",
    detail: "Dedicated onboarding session, data migration assistance, and custom workflow configuration by an Aliice specialist.",
    quantity: 1,
    unitPrice: 350,
    recurring: "once",
  },
  {
    category: "Add-on Module",
    description: "AI Document Scanner — Starter Pack",
    detail: "Upload a photo or scanned letter and our AI extracts structured tasks automatically. Includes 500 scans/month.",
    quantity: 1,
    unitPrice: 149,
    recurring: "monthly",
  },
  {
    category: "Add-on Module",
    description: "AI Custom Workflow Engine",
    detail: "Define intelligent automation rules triggered when a specific letter type or image category is detected. Includes unlimited workflow templates and AI-suggested follow-up actions.",
    quantity: 1,
    unitPrice: 99,
    recurring: "monthly",
  },
  {
    category: "Add-on Module",
    description: "Additional Scan Volume — 1,000 scans/month",
    detail: "Extend scanning capacity by 1,000 documents per month beyond the starter pack.",
    quantity: 1,
    unitPrice: 79,
    recurring: "monthly",
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
    const r = await tryLoad("/logos/aliice-logo.png");
    logoBase64 = r.b64; logoW = r.w; logoH = r.h;
  } catch {
    try {
      const r = await tryLoad("https://www.aliice.app/_next/image?url=%2Flogos%2Faliice-logo.png&w=128&q=75");
      logoBase64 = r.b64; logoW = r.w; logoH = r.h;
    } catch { /* no logo */ }
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pW = doc.internal.pageSize.getWidth();
  const pH = doc.internal.pageSize.getHeight();
  const mg = 18;
  const col2 = pW / 2 + 5;
  let y = 0;

  // ── Header bar (violet gradient effect via two rects) ──
  doc.setFillColor(109, 40, 217); // violet-700
  doc.rect(0, 0, pW, 38, "F");
  doc.setFillColor(124, 58, 237); // violet-600 overlay strip
  doc.rect(0, 30, pW, 8, "F");

  // Logo
  if (logoBase64 && logoW && logoH) {
    const maxH = 13;
    const aspect = logoW / logoH;
    doc.addImage(logoBase64, "PNG", mg, (30 - maxH) / 2 + 2, maxH * aspect, maxH);
  }

  // QUOTATION label
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", pW - mg, 21, { align: "right" });
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(221, 214, 254); // violet-200
  doc.text(quote.quoteNumber, pW - mg, 30, { align: "right" });

  y = 48;

  // ── From / Quote To ──
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
  doc.setTextColor(71, 85, 105);

  const fromLines = doc.splitTextToSize(quote.fromAddress, 82);
  doc.text(fromLines, mg, y + 12);
  doc.text(quote.fromCity, mg, y + 12 + fromLines.length * 4.5);
  if (quote.fromEmail) doc.text(quote.fromEmail, mg, y + 12 + fromLines.length * 4.5 + 4.5);

  if (quote.clientEmail) doc.text(quote.clientEmail, col2, y + 12);
  const addrLines = doc.splitTextToSize(quote.clientAddress, 82);
  doc.text(addrLines, col2, y + 17);
  if (quote.clientCity) doc.text(quote.clientCity, col2, y + 17 + addrLines.length * 4.5);

  y += 42;

  // ── Meta bar ──
  doc.setFillColor(245, 243, 255); // violet-50
  doc.roundedRect(mg, y, pW - 2 * mg, 18, 2, 2, "F");
  doc.setDrawColor(196, 181, 253); // violet-300
  doc.setLineWidth(0.3);
  doc.roundedRect(mg, y, pW - 2 * mg, 18, 2, 2, "D");

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
    doc.setTextColor(109, 40, 217);
    doc.text(m.label.toUpperCase(), mx, y + 6);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(m.value, mx, y + 13);
  });

  y += 26;

  // ── Line items table ──
  const tLeft = mg;
  const tRight = pW - mg;
  const tW = tRight - tLeft;

  // Column widths
  const cDesc = tW - 28 - 30 - 32;
  const cQty = 28;
  const cUnit = 30;
  const cAmt = 32;

  // Table header
  doc.setFillColor(109, 40, 217);
  doc.rect(tLeft, y, tW, 8, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);

  let cx = tLeft + 4;
  doc.text("DESCRIPTION", cx, y + 5.5);
  cx += cDesc;
  doc.text("QTY", cx + cQty / 2, y + 5.5, { align: "center" });
  cx += cQty;
  doc.text("UNIT PRICE", cx + cUnit / 2, y + 5.5, { align: "center" });
  cx += cUnit;
  doc.text("AMOUNT", cx + cAmt / 2, y + 5.5, { align: "center" });
  y += 8;

  // Group items by category
  const categories = Array.from(new Set(items.filter(i => i.description.trim()).map(i => i.category)));

  categories.forEach((cat) => {
    const catItems = items.filter(i => i.category === cat && i.description.trim());
    if (!catItems.length) return;

    // Category row
    doc.setFillColor(237, 233, 254); // violet-100
    doc.rect(tLeft, y, tW, 7, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(109, 40, 217);
    doc.text(cat.toUpperCase(), tLeft + 4, y + 5);
    y += 7;

    catItems.forEach((item, idx) => {
      const rowH = item.detail ? 14 : 9;

      // Check if we need a new page
      if (y + rowH > pH - 45) {
        doc.addPage();
        y = 20;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(250, 248, 255);
        doc.rect(tLeft, y, tW, rowH, "F");
      }

      const lineTotal = item.quantity * item.unitPrice;
      let rx = tLeft + 4;

      // Description
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(item.description, rx, y + 5.5);

      // Detail (sub-text)
      if (item.detail) {
        const detailLines = doc.splitTextToSize(item.detail, cDesc - 4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(detailLines[0], rx, y + 10.5);
      }

      rx += cDesc;

      // Qty
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(String(item.quantity), rx + cQty / 2, y + (rowH > 9 ? 8 : 6), { align: "center" });
      rx += cQty;

      // Unit price + recurring label
      const unitStr = formatCHF(item.unitPrice) + recurringLabel(item.recurring);
      doc.text(unitStr, rx + cUnit / 2, y + (rowH > 9 ? 8 : 6), { align: "center" });
      rx += cUnit;

      // Amount
      doc.setFont("helvetica", "bold");
      doc.text(formatCHF(lineTotal), rx + cAmt / 2, y + (rowH > 9 ? 8 : 6), { align: "center" });

      y += rowH;
    });
  });

  // Table bottom line
  doc.setDrawColor(196, 181, 253);
  doc.setLineWidth(0.4);
  doc.line(tLeft, y, tRight, y);
  y += 8;

  // ── Totals ──
  const oneTimeSub = items.filter(i => i.recurring === "once" && i.description.trim()).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const monthlySub = items.filter(i => i.recurring === "monthly" && i.description.trim()).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const subtotal = items.filter(i => i.description.trim()).reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const totX = pW - mg - 80;
  const totValX = pW - mg;

  const drawTotalRow = (label: string, value: string, bold = false) => {
    doc.setFontSize(bold ? 9 : 8.5);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(bold ? 15 : 71, bold ? 23 : 85, bold ? 42 : 105);
    doc.text(label, totX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(value, totValX, y, { align: "right" });
    y += 6;
  };

  if (oneTimeSub > 0) drawTotalRow("One-time fees", formatCHF(oneTimeSub));
  if (monthlySub > 0) drawTotalRow("Monthly recurring", formatCHF(monthlySub) + "/mo");
  y += 2;

  // Total box
  doc.setFillColor(109, 40, 217);
  doc.roundedRect(totX - 4, y - 1, 80, 12, 2.5, 2.5, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", totX, y + 7.5);
  doc.text(formatCHF(subtotal), totValX, y + 7.5, { align: "right" });
  y += 20;

  // ── Notes ──
  if (quote.notes.trim()) {
    if (y > pH - 55) { doc.addPage(); y = 20; }
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(109, 40, 217);
    doc.text("NOTES", mg, y);
    y += 5;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(quote.notes, pW - 2 * mg);
    doc.text(noteLines, mg, y);
    y += noteLines.length * 4.5 + 8;
  }

  // ── Terms ──
  if (quote.terms.trim()) {
    if (y > pH - 55) { doc.addPage(); y = 20; }
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(109, 40, 217);
    doc.text("TERMS & CONDITIONS", mg, y);
    y += 5;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const termLines = doc.splitTextToSize(quote.terms, pW - 2 * mg);
    doc.text(termLines, mg, y);
    y += termLines.length * 4 + 10;
  }

  // ── Acceptance signature block ──
  if (y > pH - 50) { doc.addPage(); y = 20; }

  doc.setFillColor(245, 243, 255);
  doc.setDrawColor(196, 181, 253);
  doc.setLineWidth(0.3);
  doc.roundedRect(mg, y, pW - 2 * mg, 34, 3, 3, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(109, 40, 217);
  doc.text("ACCEPTANCE", mg + 5, y + 7);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("By signing below, the client agrees to the terms and pricing outlined in this quotation.", mg + 5, y + 13);

  // Signature line left
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(mg + 5, y + 28, mg + 75, y + 28);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Client Signature & Date", mg + 5, y + 32);

  // Signature line right
  doc.line(pW - mg - 75, y + 28, pW - mg - 5, y + 28);
  doc.text("Authorised by Aliice", pW - mg - 75, y + 32);

  y += 40;

  // ── Footer ──
  doc.setFillColor(109, 40, 217);
  doc.rect(0, pH - 12, pW, 12, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(221, 214, 254);
  doc.text(
    `${quote.fromName} · hello@aliice.app · aliice.app  |  This quotation is valid for 30 days from issue date.`,
    pW / 2, pH - 4.5, { align: "center" }
  );

  return doc;
}

// ─── Component ───────────────────────────────────────────────────────────────

const DEFAULT_TERMS =
  "1. This quotation is valid for 30 days from the issue date.\n" +
  "2. Prices are quoted in Swiss Francs (CHF) and exclude any applicable taxes.\n" +
  "3. Monthly subscription fees are billed on the 1st of each month.\n" +
  "4. One-time fees are invoiced upon project initiation.\n" +
  "5. Aliice reserves the right to adjust recurring pricing with 30 days written notice.\n" +
  "6. Cancellation requires 30 days written notice before the next billing cycle.";

function seedRappjderm(): { quote: QuoteData; items: LineItem[] } {
  return {
    quote: {
      quoteNumber: "QUO-20260707-001",
      issueDate: "2026-07-07",
      validUntil: "2026-08-06",
      clientName: "Rappjderm",
      clientEmail: "contact@rappjderm.ch",
      clientAddress: "",
      clientCity: "Switzerland",
      fromName: "Aliice Computer Software Trading",
      fromAddress: "Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263",
      fromCity: "Dubai, United Arab Emirates",
      fromEmail: "hello@aliice.app",
      notes:
        "Thank you for your interest in Aliice. This quotation covers the Aliice Pro subscription plan and the AI Document Scanner & Custom Workflow Engine add-on modules. We look forward to partnering with Rappjderm to streamline your clinic operations.",
      terms: DEFAULT_TERMS,
    },
    items: RAPPJDERM_ITEMS.map((i) => ({ ...i, id: crypto.randomUUID() })),
  };
}

const CATEGORIES = ["Subscription", "Add-on Module", "Professional Services", "Other"];

export default function QuotationsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
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
      category: "Subscription",
      description: "",
      detail: "",
      quantity: 1,
      unitPrice: 0,
      recurring: "monthly",
    }]);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateItem = (id: string, field: keyof Omit<LineItem, "id">, value: string | number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const filledItems = items.filter((i) => i.description.trim());
  const oneTime = filledItems.filter(i => i.recurring === "once").reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const monthly = filledItems.filter(i => i.recurring === "monthly").reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = filledItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

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
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={quote.fromEmail} onChange={(e) => updateQuote("fromEmail", e.target.value)} />
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
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={quote.clientEmail} onChange={(e) => updateQuote("clientEmail", e.target.value)} />
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
            <div className="grid grid-cols-[100px_1fr_52px_72px_80px_32px] gap-1.5 mb-2 px-1">
              {["Category", "Description", "Qty", "Unit Price", "Billing", ""].map((h) => (
                <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</span>
              ))}
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const lineTotal = item.quantity * item.unitPrice;
                return (
                  <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                    {/* Row 1: category + description + controls */}
                    <div className="grid grid-cols-[110px_1fr_52px_80px_32px] gap-2 items-start">
                      <select
                        className={inputCls + " text-xs"}
                        value={item.category}
                        onChange={(e) => updateItem(item.id, "category", e.target.value)}
                      >
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
                        placeholder="Optional detail / description line"
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
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />One-time fees</span>
                <span className="font-semibold text-slate-700">{formatCHF(oneTime)}</span>
              </div>
            )}
            {monthly > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Monthly recurring</span>
                <span className="font-semibold text-slate-700">{formatCHF(monthly)}<span className="text-violet-500 text-xs">/mo</span></span>
              </div>
            )}

            <div className="flex justify-between items-center bg-violet-700 text-white rounded-xl px-4 py-3">
              <span className="font-bold text-sm">Total Quoted</span>
              <span className="font-bold text-base">{formatCHF(total)}</span>
            </div>

            {monthly > 0 && oneTime > 0 && (
              <p className="text-xs text-slate-400 flex items-start gap-1.5 mt-1">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-violet-400" />
                Total includes {formatCHF(oneTime)} in one-time fees + {formatCHF(monthly)}/mo recurring.
              </p>
            )}
          </div>

          {/* PDF hint */}
          <div className="rounded-2xl border border-dashed border-violet-300 bg-violet-50 p-6 text-center">
            <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-violet-700">Professional Quotation PDF</p>
            <p className="text-xs text-violet-500 mt-1">
              Exports with Aliice branding, itemized pricing, signature acceptance block, and CHF totals broken down by one-time vs recurring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
