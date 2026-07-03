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
  CreditCard,
  Receipt,
  Send,
  Link2,
  CheckCircle2,
  Search,
  ChevronDown,
  Banknote,
  X,
} from "lucide-react";
import jsPDF from "jspdf";

// ─── Types ─────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  // Recipient
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientCity: string;
  // Sender / From
  fromName: string;
  fromAddress: string;
  fromCity: string;
  // Bank transfer
  bankName: string;
  accountHolder: string;
  iban: string;
  swift: string;
  currency: string;
  // Notes
  notes: string;
}

interface OrgClient {
  id: string;
  name: string;
  email: string | null;
  street_address: string | null;
  city: string | null;
  country: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateInvoiceNumber() {
  const d = new Date();
  return `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 900 + 100)}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function dueDateDefault() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Canvas context unavailable"));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoicePaymentLink, setInvoicePaymentLink] = useState<string>("");
  const [invoiceStatus, setInvoiceStatus] = useState<string>("");
  const [creatingLink, setCreatingLink] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"payrexx" | "bank">("payrexx");

  // Organization/client search
  const [orgClients, setOrgClients] = useState<OrgClient[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropOpen, setClientDropOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const clientDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadingClients(true);
    fetch("/api/admin/organizations")
      .then((r) => r.json())
      .then((d) => {
        const orgs: OrgClient[] = (d.organizations || []).map((o: {
          id: string; name: string; email: string | null;
          street_address?: string | null; city?: string | null; country?: string | null;
        }) => ({
          id: o.id,
          name: o.name,
          email: o.email,
          street_address: o.street_address ?? null,
          city: o.city ?? null,
          country: o.country ?? null,
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
    setInvoice((prev) => ({
      ...prev,
      clientName: org.name,
      clientEmail: org.email || "",
      clientAddress: org.street_address || "",
      clientCity: [org.city, org.country].filter(Boolean).join(", "),
    }));
    setClientDropOpen(false);
    setClientSearch("");
  }

  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: generateInvoiceNumber(),
    issueDate: today(),
    dueDate: dueDateDefault(),
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    clientCity: "",
    fromName: "Aliice Computer Software Trading",
    fromAddress: "Arabian Sky Business Center, Um Hurrair Second, Plot 38-0 Office OF09-263",
    fromCity: "Dubai, United Arab Emirates",
    bankName: "",
    accountHolder: "Aliice Computer Software Trading",
    iban: "",
    swift: "",
    currency: "USD",
    notes: "",
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
  ]);

  const updateInvoice = useCallback((field: keyof InvoiceData, value: string) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof Omit<LineItem, "id">, value: string | number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const tax = 0; // VAT optional — kept at 0 by default
  const total = subtotal + tax;

  // ── PDF Generation ──────────────────────────────────────────────────────

  const validateInvoice = (): boolean => {
    if (!invoice.clientName) {
      alert("Please enter the client name.");
      return false;
    }
    if (items.every((i) => !i.description)) {
      alert("Please add at least one line item.");
      return false;
    }
    return true;
  };

  const buildInvoiceDoc = async (payLinkOverride?: string): Promise<jsPDF> => {
    const payLink = payLinkOverride ?? invoicePaymentLink;
    try {
      // Load the Aliice logo — try public path first, then the Next image URL
      let logoBase64: string | null = null;
      let logoNaturalW = 0;
      let logoNaturalH = 0;

      const tryLoad = async (src: string) => {
        return new Promise<{ b64: string; w: number; h: number }>((res, rej) => {
          const img = document.createElement("img");
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0);
            res({ b64: canvas.toDataURL("image/png"), w, h });
          };
          img.onerror = rej;
          img.src = src;
        });
      };

      try {
        const result = await tryLoad("/logos/aliice-logo.png");
        logoBase64 = result.b64;
        logoNaturalW = result.w;
        logoNaturalH = result.h;
      } catch {
        try {
          const result = await tryLoad(
            "https://www.aliice.app/_next/image?url=%2Flogos%2Faliice-logo.png&w=128&q=75"
          );
          logoBase64 = result.b64;
          logoNaturalW = result.w;
          logoNaturalH = result.h;
        } catch {
          console.warn("Logo could not be loaded");
        }
      }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();   // 210
      const pageH = doc.internal.pageSize.getHeight();  // 297
      const margin = 18;
      const col2 = pageW / 2 + 5;
      let y = margin;

      // ── Header bar ──────────────────────────────────────────────────────
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageW, 36, "F");

      // Logo — preserve natural aspect ratio, max height 14mm in header
      if (logoBase64 && logoNaturalW && logoNaturalH) {
        const maxH = 14;
        const aspect = logoNaturalW / logoNaturalH;
        const logoW = maxH * aspect;
        const logoH = maxH;
        // Center vertically in header
        doc.addImage(logoBase64, "PNG", margin, (36 - logoH) / 2, logoW, logoH);
      }

      // "INVOICE" label on right side of header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", pageW - margin, 22, { align: "right" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(invoice.invoiceNumber, pageW - margin, 30, { align: "right" });

      y = 46;

      // ── From / To columns ───────────────────────────────────────────────
      // FROM (left)
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("FROM", margin, y);

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(invoice.fromName, margin, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const fromAddrLines = doc.splitTextToSize(invoice.fromAddress, 80);
      doc.text(fromAddrLines, margin, y + 11);
      doc.text(invoice.fromCity, margin, y + 11 + fromAddrLines.length * 4.5);

      // TO (right)
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("BILL TO", col2, y);

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(invoice.clientName || "—", col2, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      if (invoice.clientEmail) doc.text(invoice.clientEmail, col2, y + 11);
      const clientAddrLines = doc.splitTextToSize(invoice.clientAddress, 80);
      doc.text(clientAddrLines, col2, y + 16);
      if (invoice.clientCity)
        doc.text(invoice.clientCity, col2, y + 16 + clientAddrLines.length * 4.5);

      y += 38;

      // ── Invoice meta bar ─────────────────────────────────────────────────
      doc.setFillColor(241, 245, 249); // slate-100
      doc.roundedRect(margin, y, pageW - 2 * margin, 18, 2, 2, "F");

      const metaItems = [
        { label: "Invoice No.", value: invoice.invoiceNumber },
        { label: "Issue Date", value: formatDate(invoice.issueDate) },
        { label: "Due Date", value: formatDate(invoice.dueDate) },
        { label: "Currency", value: invoice.currency },
      ];
      const metaColW = (pageW - 2 * margin) / metaItems.length;

      metaItems.forEach((m, idx) => {
        const mx = margin + idx * metaColW + 6;
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text(m.label.toUpperCase(), mx, y + 6);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(m.value, mx, y + 13);
      });

      y += 26;

      // ── Line items table ─────────────────────────────────────────────────
      const tableLeft = margin;
      const colWidths = {
        desc: pageW - 2 * margin - 28 - 28 - 30,
        qty: 28,
        price: 28,
        total: 30,
      };

      // Table header
      doc.setFillColor(15, 23, 42);
      doc.rect(tableLeft, y, pageW - 2 * margin, 8, "F");

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);

      let cx = tableLeft + 4;
      doc.text("DESCRIPTION", cx, y + 5.5);
      cx += colWidths.desc;
      doc.text("QTY", cx, y + 5.5, { align: "center" });
      cx += colWidths.qty;
      doc.text("UNIT PRICE", cx + colWidths.price / 2, y + 5.5, { align: "center" });
      cx += colWidths.price;
      doc.text("AMOUNT", cx + colWidths.total / 2, y + 5.5, { align: "center" });

      y += 8;

      // Rows
      const filteredItems = items.filter((i) => i.description.trim());
      filteredItems.forEach((item, idx) => {
        const rowH = 9;
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252); // slate-50
          doc.rect(tableLeft, y, pageW - 2 * margin, rowH, "F");
        }

        const lineTotal = item.quantity * item.unitPrice;
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);

        let rx = tableLeft + 4;
        const descLines = doc.splitTextToSize(item.description, colWidths.desc - 4);
        doc.text(descLines[0], rx, y + 6);
        rx += colWidths.desc;
        doc.text(String(item.quantity), rx + colWidths.qty / 2, y + 6, { align: "center" });
        rx += colWidths.qty;
        doc.text(
          formatCurrency(item.unitPrice, invoice.currency),
          rx + colWidths.price / 2,
          y + 6,
          { align: "center" }
        );
        rx += colWidths.price;
        doc.setFont("helvetica", "bold");
        doc.text(
          formatCurrency(lineTotal, invoice.currency),
          rx + colWidths.total / 2,
          y + 6,
          { align: "center" }
        );

        y += rowH;
      });

      // Table bottom border
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(tableLeft, y, tableLeft + pageW - 2 * margin, y);
      y += 6;

      // ── Totals ───────────────────────────────────────────────────────────
      const totalsX = pageW - margin - 70;
      const totalsValueX = pageW - margin;

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Subtotal", totalsX, y);
      doc.text(formatCurrency(subtotal, invoice.currency), totalsValueX, y, { align: "right" });
      y += 6;

      // Total box
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(totalsX - 4, y - 1, 76, 11, 2, 2, "F");
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("TOTAL DUE", totalsX, y + 7);
      doc.text(formatCurrency(total, invoice.currency), totalsValueX, y + 7, { align: "right" });
      y += 18;

      // ── Pay Now button (Payrexx online payment) ──
      if (payLink) {
        const btnW = 74;
        const btnH = 13;
        const btnX = pageW - margin - btnW;
        doc.setFillColor(2, 132, 199); // sky-600
        doc.roundedRect(btnX, y - 2, btnW, btnH, 2.5, 2.5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text("Pay Now Online", btnX + btnW / 2, y + 6.5, { align: "center" });
        // Clickable link over the button
        doc.link(btnX, y - 2, btnW, btnH, { url: payLink });
        // Caption on the left
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Pay securely by card via Payrexx:", margin, y + 6);
        y += btnH + 8;
      }

      // ── Bank Transfer Details ────────────────────────────────────────────
      if (invoice.bankName || invoice.iban || invoice.swift) {
        doc.setFillColor(239, 246, 255); // blue-50
        doc.setDrawColor(147, 197, 253); // blue-300
        doc.setLineWidth(0.4);
        const bankBoxH = 36;
        doc.roundedRect(margin, y, pageW - 2 * margin, bankBoxH, 3, 3, "FD");

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(29, 78, 216); // blue-700
        doc.text("BANK TRANSFER DETAILS", margin + 5, y + 7);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);

        const bankLeft = margin + 5;
        const bankRight = pageW / 2 + 5;
        let by = y + 13;

        const bankFields: [string, string][] = [
          ["Bank Name", invoice.bankName],
          ["Account Holder", invoice.accountHolder],
        ];
        const bankFields2: [string, string][] = [
          ["IBAN / Account No.", invoice.iban],
          ["SWIFT / BIC", invoice.swift],
        ];

        bankFields.forEach(([label, val]) => {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 116, 139);
          doc.text(label + ":", bankLeft, by);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 41, 59);
          doc.text(val || "—", bankLeft + 36, by);
          by += 6;
        });

        by = y + 13;
        bankFields2.forEach(([label, val]) => {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 116, 139);
          doc.text(label + ":", bankRight, by);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 41, 59);
          doc.text(val || "—", bankRight + 40, by);
          by += 6;
        });

        y += bankBoxH + 8;
      }

      // ── Notes ────────────────────────────────────────────────────────────
      if (invoice.notes.trim()) {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text("NOTES", margin, y);
        y += 5;
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const noteLines = doc.splitTextToSize(invoice.notes, pageW - 2 * margin);
        doc.text(noteLines, margin, y);
        y += noteLines.length * 4.5 + 8;
      }

      // ── Footer ───────────────────────────────────────────────────────────
      doc.setFillColor(241, 245, 249);
      doc.rect(0, pageH - 14, pageW, 14, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${invoice.fromName} · ${invoice.fromCity} · Generated by Aliice`,
        pageW / 2,
        pageH - 5,
        { align: "center" }
      );

      return doc;
    } catch (err) {
      console.error("PDF generation failed:", err);
      throw err;
    }
  };

  const exportPDF = async () => {
    if (!validateInvoice()) return;
    setIsGenerating(true);
    setActionError(null);
    try {
      // Save invoice record to DB (without Payrexx link — PDF export doesn't need it)
      await saveInvoice(false).catch(() => null); // non-fatal: save best-effort
      const doc = await buildInvoiceDoc();
      doc.save(`${invoice.invoiceNumber}.pdf`);
    } catch {
      setActionError("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveInvoice = async (createPaymentLink: boolean) => {
    const res = await fetch("/api/admin/client-invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_number: invoice.invoiceNumber,
        issue_date: invoice.issueDate,
        due_date: invoice.dueDate,
        client_name: invoice.clientName,
        client_email: invoice.clientEmail,
        client_address: invoice.clientAddress,
        client_city: invoice.clientCity,
        from_name: invoice.fromName,
        from_address: invoice.fromAddress,
        from_city: invoice.fromCity,
        currency: invoice.currency,
        notes: invoice.notes,
        organization_id: selectedOrgId || null,
        payment_method: paymentMethod,
        line_items: items
          .filter((i) => i.description.trim())
          .map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
        createPaymentLink: createPaymentLink && paymentMethod === "payrexx",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save invoice");
    if (data.invoice?.id) setInvoiceId(data.invoice.id);
    if (data.invoice?.status) setInvoiceStatus(data.invoice.status);
    if (data.paymentLink) setInvoicePaymentLink(data.paymentLink);
    return data as { invoice?: { id: string; status: string }; paymentLink?: string };
  };

  const createPayLink = async () => {
    if (!validateInvoice()) return;
    setCreatingLink(true);
    setActionMsg(null);
    setActionError(null);
    try {
      const data = await saveInvoice(true);
      setActionMsg(data.paymentLink ? "Payment link ready." : "Saved (no link created).");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to create link");
    } finally {
      setCreatingLink(false);
    }
  };

  const sendToClient = async () => {
    if (!validateInvoice()) return;
    if (!invoice.clientEmail.trim()) {
      alert("Please enter the client email address first.");
      return;
    }
    setSending(true);
    setActionMsg(null);
    setActionError(null);
    try {
      const data = await saveInvoice(true);
      const id = data.invoice?.id || invoiceId;
      const link = data.paymentLink || invoicePaymentLink;
      const doc = await buildInvoiceDoc(link);
      const dataUri = doc.output("datauristring");
      const base64 = dataUri.split(",").pop() || "";
      const res = await fetch("/api/admin/client-invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pdfBase64: base64, fileName: `${invoice.invoiceNumber}.pdf` }),
      });
      const sendData = await res.json();
      if (!res.ok) throw new Error(sendData.error || "Failed to send");
      setActionMsg(`Invoice emailed to ${invoice.clientEmail}.`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  // ─── UI ─────────────────────────────────────────────────────────────────

  const inputCls =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all placeholder:text-slate-400 bg-white";

  const labelCls = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-sky-600" />
            <h1 className="font-semibold text-slate-900 text-lg">Invoice Generator</h1>
          </div>
          <div className="w-px h-5 bg-slate-200" />
          <Link
            href="/admin/invoices/history"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm transition"
          >
            <FileText className="w-4 h-4" />
            History &amp; Payments
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {paymentMethod === "payrexx" && (
            <button
              onClick={createPayLink}
              disabled={creatingLink}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-sm font-semibold hover:bg-sky-100 transition disabled:opacity-50"
            >
              {creatingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {invoicePaymentLink ? "Pay link ready" : "Create pay link"}
            </button>
          )}
          {paymentMethod === "bank" && (
            <span className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl text-sm font-medium">
              <Banknote className="w-4 h-4" />
              Bank Transfer
            </span>
          )}
          <button
            onClick={sendToClient}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending…" : "Send to client"}
          </button>
          <button
            onClick={exportPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isGenerating ? "Generating…" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Status / error bar */}
      {(invoicePaymentLink || invoiceStatus || actionMsg || actionError) && (
        <div className={`border-b px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs ${
          actionError ? "bg-red-50 border-red-200" : "bg-white border-slate-200"
        }`}>
          {actionError && (
            <span className="flex items-center gap-1.5 text-red-700 font-medium">
              <X className="w-3.5 h-3.5" />
              {actionError}
            </span>
          )}
          {invoiceStatus && !actionError && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${
                invoiceStatus === "PAID"
                  ? "bg-emerald-50 text-emerald-700"
                  : invoiceStatus === "PARTIAL_LOSS"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {invoiceStatus === "PAID" && <CheckCircle2 className="w-3 h-3" />}
              {invoiceStatus}
            </span>
          )}
          {invoicePaymentLink && !actionError && (
            <a
              href={invoicePaymentLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-medium truncate max-w-[380px]"
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              {invoicePaymentLink}
            </a>
          )}
          {actionMsg && !actionError && <span className="text-slate-500">{actionMsg}</span>}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Left column ── */}
        <div className="space-y-6">

          {/* Invoice meta */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-sky-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Invoice Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Invoice No.</label>
                <input
                  className={inputCls}
                  value={invoice.invoiceNumber}
                  onChange={(e) => updateInvoice("invoiceNumber", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <select
                  className={inputCls}
                  value={invoice.currency}
                  onChange={(e) => updateInvoice("currency", e.target.value)}
                >
                  {["USD", "EUR", "AED", "GBP", "CHF", "SAR"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Issue Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={invoice.issueDate}
                  onChange={(e) => updateInvoice("issueDate", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Due Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={invoice.dueDate}
                  onChange={(e) => updateInvoice("dueDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* From */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-sky-600" />
              <h2 className="font-semibold text-slate-800 text-sm">From (Sender)</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Company / Name</label>
                <input
                  className={inputCls}
                  value={invoice.fromName}
                  onChange={(e) => updateInvoice("fromName", e.target.value)}
                  placeholder="Your company name"
                />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input
                  className={inputCls}
                  value={invoice.fromAddress}
                  onChange={(e) => updateInvoice("fromAddress", e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className={labelCls}>City / Country</label>
                <input
                  className={inputCls}
                  value={invoice.fromCity}
                  onChange={(e) => updateInvoice("fromCity", e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-sky-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Bill To (Recipient)</h2>
            </div>
            <div className="space-y-3">
              {/* Searchable org/client dropdown */}
              <div ref={clientDropRef} className="relative">
                <label className={labelCls}>Search Organization / Client</label>
                <button
                  type="button"
                  onClick={() => setClientDropOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white hover:border-sky-400 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {loadingClients ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={`truncate ${
                      invoice.clientName ? "text-slate-800" : "text-slate-400"
                    }`}>
                      {invoice.clientName || "Select an organization…"}
                    </span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                    clientDropOpen ? "rotate-180" : ""
                  }`} />
                </button>

                {clientDropOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search by name or email…"
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                      {filteredClients.length === 0 && (
                        <p className="px-4 py-3 text-sm text-slate-400 text-center">No organizations found</p>
                      )}
                      {filteredClients.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => selectClient(org)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-sky-50 transition group ${
                            selectedOrgId === org.id ? "bg-sky-50" : ""
                          }`}
                        >
                          <span className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-700 shrink-0">
                            {org.name[0].toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-sky-700">{org.name}</p>
                            {org.email && <p className="text-xs text-slate-500 truncate">{org.email}</p>}
                          </div>
                          {selectedOrgId === org.id && <CheckCircle2 className="w-4 h-4 text-sky-500 ml-auto shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Client Name *</label>
                <input
                  className={inputCls}
                  value={invoice.clientName}
                  onChange={(e) => updateInvoice("clientName", e.target.value)}
                  placeholder="Full name or company"
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  className={inputCls}
                  value={invoice.clientEmail}
                  onChange={(e) => updateInvoice("clientEmail", e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input
                  className={inputCls}
                  value={invoice.clientAddress}
                  onChange={(e) => updateInvoice("clientAddress", e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className={labelCls}>City / Country</label>
                <input
                  className={inputCls}
                  value={invoice.clientCity}
                  onChange={(e) => updateInvoice("clientCity", e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-sky-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Payment Method</h2>
            </div>
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === "payrexx"
                  ? "border-sky-500 bg-sky-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="payrexx"
                  checked={paymentMethod === "payrexx"}
                  onChange={() => setPaymentMethod("payrexx")}
                  className="accent-sky-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Payrexx (Online)</p>
                  <p className="text-xs text-slate-500">Card payment via secure link</p>
                </div>
              </label>
              <label className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === "bank"
                  ? "border-sky-500 bg-sky-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={paymentMethod === "bank"}
                  onChange={() => setPaymentMethod("bank")}
                  className="accent-sky-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Bank Transfer</p>
                  <p className="text-xs text-slate-500">IBAN / wire transfer</p>
                </div>
              </label>
            </div>
          </div>

          {/* Bank transfer — shown only when bank method selected */}
          {paymentMethod === "bank" && (
          <div className="bg-white rounded-2xl border border-sky-200 bg-sky-50/30 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="w-4 h-4 text-sky-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Bank Transfer Details</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Bank Name</label>
                <input
                  className={inputCls}
                  value={invoice.bankName}
                  onChange={(e) => updateInvoice("bankName", e.target.value)}
                  placeholder="e.g. Emirates NBD"
                />
              </div>
              <div>
                <label className={labelCls}>Account Holder</label>
                <input
                  className={inputCls}
                  value={invoice.accountHolder}
                  onChange={(e) => updateInvoice("accountHolder", e.target.value)}
                  placeholder="Account holder name"
                />
              </div>
              <div>
                <label className={labelCls}>IBAN / Account No.</label>
                <input
                  className={inputCls}
                  value={invoice.iban}
                  onChange={(e) => updateInvoice("iban", e.target.value)}
                  placeholder="AE00 0000 0000 0000 0000 000"
                />
              </div>
              <div>
                <label className={labelCls}>SWIFT / BIC</label>
                <input
                  className={inputCls}
                  value={invoice.swift}
                  onChange={(e) => updateInvoice("swift", e.target.value)}
                  placeholder="e.g. EBILAEAD"
                />
              </div>
            </div>
          </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <label className={labelCls}>Notes / Payment Terms</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={invoice.notes}
              onChange={(e) => updateInvoice("notes", e.target.value)}
              placeholder="e.g. Payment due within 30 days. Thank you for your business."
            />
          </div>
        </div>

        {/* ── Right column: Line items + summary ── */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 text-sm">Line Items</h2>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_60px_80px_80px_32px] gap-2 mb-2 px-1">
              {["Description", "Qty", "Unit Price", "Amount", ""].map((h) => (
                <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {h}
                </span>
              ))}
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const lineTotal = item.quantity * item.unitPrice;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_60px_80px_80px_32px] gap-2 items-start"
                  >
                    <input
                      className={inputCls}
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Item or service description"
                    />
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", Math.max(1, Number(e.target.value)))
                      }
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={inputCls}
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(item.id, "unitPrice", Number(e.target.value))
                      }
                      placeholder="0.00"
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 text-right">
                      {lineTotal.toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="flex items-center justify-center w-8 h-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Subtotal / Total */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-slate-700">
                  {formatCurrency(subtotal, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-900 text-white rounded-xl px-4 py-3">
                <span className="font-bold text-sm">Total Due</span>
                <span className="font-bold text-base">
                  {formatCurrency(total, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* PDF preview hint */}
          <div className="rounded-2xl border border-dashed border-sky-300 bg-sky-50 p-6 text-center">
            <Download className="w-8 h-8 text-sky-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-sky-700">Ready to export</p>
            <p className="text-xs text-sky-500 mt-1">
              Click <strong>Export PDF</strong> at the top to download your invoice with the Aliice logo and all details included.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
