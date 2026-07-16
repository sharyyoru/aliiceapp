import jsPDF from "jspdf";

interface TierConfig {
  name: string;
  setup: number;
  monthly: number;
  annual: number;
}

interface FeatureRow {
  name: string;
  basic: boolean;
  pro: boolean;
  ent: boolean;
}

interface FeatureGroup {
  category: string;
  rows: FeatureRow[];
}

const tiers: TierConfig[] = [
  { name: "Basic Package", setup: 2000, monthly: 1190, annual: 1070 },
  { name: "Professional", setup: 2800, monthly: 1790, annual: 1610 },
  { name: "Enterprise", setup: 4400, monthly: 2560, annual: 2300 },
];

const pricingTable = [
  { label: "Initial setup", values: ["CHF 2'000", "CHF 2'800", "CHF 4'400"] },
  { label: "Monthly Subscription", values: ["CHF 1'190 / month", "CHF 1'790 / month", "CHF 2'560 / month"] },
  { label: "Annual Subscription", values: ["CHF 1'070 / month", "CHF 1'610 / month", "CHF 2'300 / month"] },
  { label: "AI Module", values: ["Included", "Included", "Included"] },
  { label: "Storage", values: ["Usage-Based", "Usage-Based", "Usage-Based"] },
];

const storageTable = [
  { label: "Basic Storage", value: "Included" },
  { label: "+1TB", value: "+CHF 50 / month" },
  { label: "+2TB", value: "+CHF 100 / month" },
  { label: "+3TB", value: "+CHF 150 / month" },
  { label: "+5TB", value: "+CHF 250 / month" },
  { label: "+10TB", value: "+CHF 500 / month" },
];

const featureGroups: FeatureGroup[] = [
  {
    category: "Core Features",
    rows: [
      { name: "Patient Management", basic: true, pro: true, ent: true },
      { name: "Appointment Booking", basic: true, pro: true, ent: true },
      { name: "Basic Calendar / Agenda", basic: true, pro: true, ent: true },
      { name: "Lead Management", basic: true, pro: true, ent: true },
      { name: "Tasks & Reminders", basic: true, pro: true, ent: true },
      { name: "Email Notifications", basic: true, pro: true, ent: true },
    ],
  },
  {
    category: "Business Tools",
    rows: [
      { name: "Deals Pipeline", basic: true, pro: true, ent: true },
      { name: "Invoicing (TARDOC)", basic: true, pro: true, ent: true },
    ],
  },
  {
    category: "AI & 3D",
    rows: [
      { name: "AI Assistant (Alice)", basic: true, pro: true, ent: true },
      { name: "Crisalix 3D Integration", basic: true, pro: true, ent: true },
    ],
  },
  {
    category: "Integrations",
    rows: [
      { name: "WhatsApp Integration", basic: true, pro: true, ent: true },
    ],
  },
  {
    category: "Analytics",
    rows: [
      { name: "Advanced Analytics", basic: true, pro: true, ent: true },
    ],
  },
];

const brandBlue = { r: 29, g: 78, b: 216 };
const slate900 = { r: 15, g: 23, b: 42 };
const slate500 = { r: 100, g: 116, b: 139 };
const slate400 = { r: 148, g: 163, b: 184 };
const slate50 = { r: 248, g: 250, b: 252 };
const blue100 = { r: 219, g: 234, b: 254 };

function loadImageBase64(src: string): Promise<{ b64: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0);
      resolve({ b64: c.toDataURL("image/png"), w, h });
    };
    img.onerror = reject;
    img.src = src;
  });
}

async function loadLogo(): Promise<{ b64: string; w: number; h: number } | null> {
  const attempts = ["/logos/aliice-logo.png", "https://www.aliice.app/_next/image?url=%2Flogos%2Faliice-logo.png&w=128&q=75"];
  for (const src of attempts) {
    try {
      return await loadImageBase64(src);
    } catch {
      // try next
    }
  }
  return null;
}

export async function buildProposalPdf(): Promise<jsPDF> {
  const logo = await loadLogo();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 18;
  const mr = 18;
  const footerH = 10;
  const safeBottom = ph - footerH - 4;
  let y = 15;
  let pageNum = 1;

  const drawLogo = (x: number, yPos: number, maxH: number) => {
    if (!logo) return;
    const aspect = logo.w / logo.h;
    doc.addImage(logo.b64, "PNG", x, yPos, maxH * aspect, maxH);
  };

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate400.r, slate400.g, slate400.b);
    doc.text(`Aliice — Medical Practice Management Platform · ${today}`, ml, ph - 4);
    doc.text(`Page ${pageNum}`, pw - mr, ph - 4, { align: "right" });
  };

  const newPage = () => {
    addFooter();
    doc.addPage();
    pageNum++;
    y = 15;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate400.r, slate400.g, slate400.b);
    doc.text("Aliice Proposal — continued", ml, 10);
    doc.line(ml, 12, pw - mr, 12);
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > safeBottom) {
      newPage();
    }
  };

  const drawCheckmark = (cx: number, cy: number, size: number) => {
    doc.setDrawColor(brandBlue.r, brandBlue.g, brandBlue.b);
    doc.setLineWidth(0.8);
    const s = size;
    doc.line(cx - s * 0.35, cy + s * 0.05, cx - s * 0.1, cy + s * 0.3);
    doc.line(cx - s * 0.1, cy + s * 0.3, cx + s * 0.4, cy - s * 0.25);
  };

  const drawDash = (cx: number, cy: number, width: number) => {
    doc.setDrawColor(slate400.r, slate400.g, slate400.b);
    doc.setLineWidth(0.6);
    doc.line(cx - width / 2, cy, cx + width / 2, cy);
  };

  // ── Header ───────────────────────────────────────────────────────────────
  drawLogo(ml, y, 12);
  doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Aliice Pricing Proposal", pw - mr, y + 7, { align: "right" });

  y += 18;
  doc.setDrawColor(brandBlue.r, brandBlue.g, brandBlue.b);
  doc.setLineWidth(0.5);
  doc.line(ml, y, pw - mr, y);
  y += 8;

  // ── Intro ───────────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(slate500.r, slate500.g, slate500.b);
  const intro =
    "Aliice is an all-in-one medical practice management platform. All plans include core patient management, scheduling, communications, and 1 TB of storage.";
  const introLines = doc.splitTextToSize(intro, pw - ml - mr);
  doc.text(introLines, ml, y);
  y += introLines.length * 4.5 + 8;

  // ── Pricing table ─────────────────────────────────────────────────────────
  ensureSpace(70);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slate900.r, slate900.g, slate900.b);
  doc.text("Tarification Alice", ml, y);
  y += 8;

  const colCount = 4;
  const col1W = 55;
  const colW = (pw - ml - mr - col1W) / (colCount - 1);
  const rowH = 9;

  // Header row
  doc.setFillColor(blue100.r, blue100.g, blue100.b);
  doc.rect(ml, y, col1W, rowH, "F");
  for (let i = 0; i < 3; i++) {
    doc.rect(ml + col1W + i * colW, y, colW, rowH, "F");
  }
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
  doc.text("Offer", ml + 3, y + 6);
  tiers.forEach((tier, i) => {
    doc.text(tier.name, ml + col1W + i * colW + colW / 2, y + 6, { align: "center" });
  });
  y += rowH;

  // Pricing rows
  pricingTable.forEach((row, idx) => {
    const fill = idx % 2 === 0 ? 255 : slate50;
    if (fill !== 255) {
      doc.setFillColor(slate50.r, slate50.g, slate50.b);
      doc.rect(ml, y, col1W + 3 * colW, rowH, "F");
    }
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(ml, y + rowH, ml + col1W + 3 * colW, y + rowH);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate900.r, slate900.g, slate900.b);
    doc.text(row.label, ml + 3, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
    row.values.forEach((val, i) => {
      doc.text(val, ml + col1W + i * colW + colW / 2, y + 6, { align: "center" });
    });
    y += rowH;
  });

  y += 10;

  // ── Storage table ──────────────────────────────────────────────────────────
  ensureSpace(62);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slate900.r, slate900.g, slate900.b);
  doc.text("Additional Storage Space", ml, y);
  y += 8;

  const storageCol1W = 70;
  const storageCol2W = pw - ml - mr - storageCol1W;

  // Header
  doc.setFillColor(blue100.r, blue100.g, blue100.b);
  doc.rect(ml, y, storageCol1W, rowH, "F");
  doc.rect(ml + storageCol1W, y, storageCol2W, rowH, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
  doc.text("Storage", ml + 3, y + 6);
  doc.text("Price", ml + storageCol1W + storageCol2W / 2, y + 6, { align: "center" });
  y += rowH;

  storageTable.forEach((row, idx) => {
    const fill = idx % 2 === 0 ? 255 : slate50;
    if (fill !== 255) {
      doc.setFillColor(slate50.r, slate50.g, slate50.b);
      doc.rect(ml, y, storageCol1W + storageCol2W, rowH, "F");
    }
    doc.setDrawColor(220, 220, 220);
    doc.line(ml, y + rowH, ml + storageCol1W + storageCol2W, y + rowH);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate900.r, slate900.g, slate900.b);
    doc.text(row.label, ml + 3, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
    doc.text(row.value, ml + storageCol1W + storageCol2W / 2, y + 6, { align: "center" });
    y += rowH;
  });

  y += 10;

  // ── Feature comparison table ────────────────────────────────────────────
  ensureSpace(18);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slate900.r, slate900.g, slate900.b);
  doc.text("Package Comparison: Alice", ml, y);
  y += 8;

  const compRowH = 8;

  // Top header
  doc.setFillColor(blue100.r, blue100.g, blue100.b);
  doc.rect(ml, y, col1W, compRowH, "F");
  for (let i = 0; i < 3; i++) {
    doc.rect(ml + col1W + i * colW, y, colW, compRowH, "F");
  }
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
  doc.text("Core Features", ml + 3, y + 5.5);
  tiers.forEach((tier, i) => {
    doc.text(tier.name, ml + col1W + i * colW + colW / 2, y + 5.5, { align: "center" });
  });
  y += compRowH;

  let firstCategory = true;
  featureGroups.forEach((group) => {
    if (!firstCategory) {
      ensureSpace(compRowH + group.rows.length * compRowH + 4);
      doc.setFillColor(brandBlue.r, brandBlue.g, brandBlue.b);
      doc.rect(ml, y, col1W + 3 * colW, compRowH, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(group.category, ml + 3, y + 5.5);
      y += compRowH;
    }
    firstCategory = false;

    group.rows.forEach((row, idx) => {
      ensureSpace(compRowH);
      const fill = idx % 2 === 0 ? 255 : slate50;
      if (fill !== 255) {
        doc.setFillColor(slate50.r, slate50.g, slate50.b);
        doc.rect(ml, y, col1W + 3 * colW, compRowH, "F");
      }
      doc.setDrawColor(220, 220, 220);
      doc.line(ml, y + compRowH, ml + col1W + 3 * colW, y + compRowH);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(slate900.r, slate900.g, slate900.b);
      doc.text(row.name, ml + 3, y + 5.5);

      [row.basic, row.pro, row.ent].forEach((included, i) => {
        const cx = ml + col1W + i * colW + colW / 2;
        const cy = y + 5.5;
        if (included) {
          drawCheckmark(cx, cy, 2.8);
        } else {
          drawDash(cx, cy, 4);
        }
      });
      y += compRowH;
    });
  });

  y += 10;

  // ── Closing ───────────────────────────────────────────────────────────────
  ensureSpace(30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(slate500.r, slate500.g, slate500.b);
  const closing =
    "We are confident that Aliice can become a powerful driver of efficiency, organization, and growth for your practice. We remain at your disposal to answer any questions and to support you in implementing a solution perfectly tailored to your practice and your objectives.";
  const closingLines = doc.splitTextToSize(closing, pw - ml - mr);
  doc.text(closingLines, ml, y);
  y += closingLines.length * 4.5 + 10;

  // ── Next steps ──────────────────────────────────────────────────────────
  ensureSpace(25);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
  doc.text("Next Steps", ml, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(slate900.r, slate900.g, slate900.b);
  const nextSteps = [
    "Answer any questions you may have",
    "Assess your specific needs and requirements",
    "Organize an additional demonstration for your team",
    "Prepare a customized proposal tailored to your organization",
  ];
  nextSteps.forEach((step) => {
    doc.text("• " + step, ml + 3, y);
    y += 5;
  });

  addFooter();

  return doc;
}
