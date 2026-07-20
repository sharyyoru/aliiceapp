import jsPDF from "jspdf";

export interface ProposalClientData {
  company?: string;
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface AliiceCompanyData {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
}

interface TierConfig {
  name: string;
  setup: string;
  monthly: string;
  annual: string;
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

interface DetailSection {
  title: string;
  items: string[];
}

const tiers: TierConfig[] = [
  { name: "Basic Package", setup: "CHF 2'000", monthly: "CHF 1'190 / month", annual: "CHF 1'070 / month" },
  { name: "Professional", setup: "CHF 2'800", monthly: "CHF 1'790 / month", annual: "CHF 1'610 / month" },
  { name: "Enterprise", setup: "CHF 4'400", monthly: "CHF 2'560 / month", annual: "CHF 2'300 / month" },
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
      { name: "Deals Pipeline", basic: false, pro: true, ent: true },
      { name: "Invoicing (TARDOC)", basic: true, pro: true, ent: true },
    ],
  },
  {
    category: "AI & 3D",
    rows: [
      { name: "AI Assistant (Alice)", basic: false, pro: false, ent: true },
      { name: "Crisalix 3D Integration", basic: false, pro: false, ent: true },
    ],
  },
  {
    category: "Integrations",
    rows: [
      { name: "WhatsApp Integration", basic: true, pro: true, ent: true },
      { name: "Workflow Automation", basic: false, pro: true, ent: true },
      { name: "Marketing Campaigns", basic: false, pro: true, ent: true },
    ],
  },
  {
    category: "Analytics",
    rows: [{ name: "Advanced Analytics", basic: false, pro: true, ent: true }],
  },
];

const objectives = [
  "Centralize medical, administrative, marketing, and billing information",
  "Structure and optimize the patient journey",
  "Reduce administrative workload",
  "Automate repetitive tasks",
  "Improve team organization and communication",
  "Enhance pre- and post-treatment follow-up",
];

const detailSections: DetailSection[] = [
  {
    title: "1. Patient Management & Medical Records",
    items: [
      "Comprehensive patient profiles with complete medical history and treatment records",
      "Secure storage of medical documents, consent forms, and questionnaires",
      "Complete interaction history with all patient communications (emails, messages, calls)",
      "Medical photography and imaging management with secure access controls",
      "Treatment records with detailed clinical notes and follow-up information",
      "Medication and prescription tracking with automated reminders",
      "Laboratory results and insurance correspondence management",
      "GDPR-compliant data storage with encrypted backups",
    ],
  },
  {
    title: "2. Appointment & Consultation Management",
    items: [
      "Integrated scheduling system with unlimited practitioner calendars",
      "Automated appointment confirmations and reminders via email and SMS",
      "Online appointment booking portal for patients (24/7 availability)",
      "Consultation planning with customizable templates and workflows",
      "Practitioner availability management with real-time synchronization",
      "Complete appointment history and analytics for performance tracking",
      "Lead management for new patient inquiries and follow-ups",
    ],
  },
  {
    title: "3. Centralized Communication Hub",
    items: [
      "Unified inbox for all communication channels (Email, SMS, WhatsApp, Phone)",
      "WhatsApp Business integration for direct patient messaging",
      "Automated communication workflows and templates",
      "Complete communication history linked directly to patient records",
      "Bulk messaging capabilities for campaigns and announcements",
      "Message scheduling and automation for follow-ups",
      "Communication analytics and engagement tracking",
    ],
  },
  {
    title: "4. Automated Patient Follow-Up & Workflows",
    items: [
      "Pre-consultation: automated appointment confirmations, reminders, pre-consultation forms, informed consent documents, medical questionnaires",
      "Post-treatment: automated post-operative instructions, scheduled follow-up appointments, recovery reminders",
      "Customizable workflow automation for repetitive tasks",
      "Conditional workflows based on treatment type and patient status",
      "Integration with external systems for seamless data flow",
    ],
  },
  {
    title: "5. Patient Retention & Long-Term Follow-Up",
    items: [
      "Automated treatment reminders (Botox, Fillers, Laser treatments, etc.)",
      "Periodic check-up scheduling and notifications",
      "Post-operative follow-up management with automated touchpoints",
      "Targeted patient campaigns based on treatment history and preferences",
      "Patient satisfaction surveys and feedback collection",
      "Loyalty programs and retention analytics",
    ],
  },
  {
    title: "6. Business & Performance Analytics",
    items: [
      "Comprehensive operational dashboards with real-time KPIs",
      "Consultation and treatment tracking with detailed analytics",
      "Revenue analysis by treatment, practitioner, and time period",
      "Patient journey analytics and conversion tracking",
      "Staff performance metrics and productivity analysis",
      "Financial reporting and accounting integration (TARDOC billing)",
      "Customizable reports and data exports for business intelligence",
    ],
  },
  {
    title: "7. Advanced Features (Professional & Enterprise)",
    items: [
      "Deals Pipeline: manage treatment proposals and sales opportunities",
      "Workflow Automation: create complex business processes without coding",
      "Marketing Campaigns: email and SMS campaigns with segmentation",
      "AI Assistant (Enterprise): intelligent patient insights and recommendations",
      "3D Simulations (Enterprise): Crisalix 3D integration for aesthetic previews",
      "Multi-Site Management: centralized control across multiple locations",
    ],
  },
];

const implementationSteps = [
  "Data migration",
  "Initial platform setup",
  "User and automation configuration",
  "Adaptation to existing workflows",
  "Team training",
  "Go-live support",
  "Ongoing customer support and maintenance",
];

const provenBenefits = [
  "Improved internal organization",
  "Full centralization of data and billing",
  "Enhanced patient follow-up",
  "Reduced administrative workload",
  "Improved patient experience",
  "A measurable increase in revenue following implementation",
];

const nextSteps = [
  "Answer any questions you may have",
  "Assess your specific needs and requirements",
  "Organize an additional demonstration for your team",
  "Prepare a customized proposal tailored to your organization",
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

const defaultAliiceData: AliiceCompanyData = {
  name: "Aliice",
  address: "Switzerland",
  email: "contact@aliice.app",
  phone: "+41 (0) 00 000 00 00",
  website: "www.aliice.app",
};

export async function buildProposalPdf(client: ProposalClientData = {}, aliice: AliiceCompanyData = defaultAliiceData): Promise<jsPDF> {
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
    doc.setDrawColor(brandBlue.r, brandBlue.g, brandBlue.b);
    doc.setLineWidth(0.3);
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

  const bulletList = (items: string[], indent: number, maxWidth: number, fontSize: number, lineHeight: number) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate900.r, slate900.g, slate900.b);
    items.forEach((item) => {
      const lines = doc.splitTextToSize(item, maxWidth - indent);
      ensureSpace(lines.length * lineHeight + 2);
      doc.text("•", ml, y + fontSize * 0.35);
      doc.text(lines, ml + indent, y + fontSize * 0.35);
      y += lines.length * lineHeight + 1.5;
    });
  };

  const sectionTitle = (title: string) => {
    ensureSpace(12);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
    doc.text(title, ml, y);
    y += 8;
    doc.setDrawColor(brandBlue.r, brandBlue.g, brandBlue.b);
    doc.setLineWidth(0.4);
    doc.line(ml, y - 3, ml + 55, y - 3);
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

  // ── Client info & Aliice details ────────────────────────────────────────
  const hasClient = client.company || client.name || client.address || client.email || client.phone;
  if (hasClient) {
    ensureSpace(80);
    const colWidth = (pw - ml - mr) / 2 - 2;

    // Left column: Proposal To
    doc.setFillColor(slate50.r, slate50.g, slate50.b);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(ml, y, colWidth, 36, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(slate500.r, slate500.g, slate500.b);
    doc.text("PROPOSAL TO", ml + 5, y + 6);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(slate900.r, slate900.g, slate900.b);
    const clientName = client.company || client.name || "";
    if (clientName) {
      doc.text(clientName, ml + 5, y + 13);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(slate500.r, slate500.g, slate500.b);
    let cy = y + 20;
    if (client.name && client.company) {
      doc.text(`Contact: ${client.name}`, ml + 5, cy);
      cy += 4;
    }
    if (client.address) {
      const addrLines = doc.splitTextToSize(client.address, colWidth - 10);
      doc.text(addrLines, ml + 5, cy);
      cy += addrLines.length * 3.5;
    }
    if (client.email) {
      doc.text(`Email: ${client.email}`, ml + 5, cy);
      cy += 4;
    }
    if (client.phone) {
      doc.text(`Phone: ${client.phone}`, ml + 5, cy);
    }

    // Right column: Aliice Details
    doc.setFillColor(blue100.r, blue100.g, blue100.b);
    doc.setDrawColor(brandBlue.r, brandBlue.g, brandBlue.b);
    doc.roundedRect(ml + colWidth + 4, y, colWidth, 36, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
    doc.text("FROM", ml + colWidth + 9, y + 6);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandBlue.r, brandBlue.g, brandBlue.b);
    doc.text(aliice.name, ml + colWidth + 9, y + 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(slate500.r, slate500.g, slate500.b);
    cy = y + 20;
    if (aliice.address) {
      const addrLines = doc.splitTextToSize(aliice.address, colWidth - 10);
      doc.text(addrLines, ml + colWidth + 9, cy);
      cy += addrLines.length * 3.5;
    }
    if (aliice.email) {
      doc.text(`Email: ${aliice.email}`, ml + colWidth + 9, cy);
      cy += 4;
    }
    if (aliice.phone) {
      doc.text(`Phone: ${aliice.phone}`, ml + colWidth + 9, cy);
      cy += 4;
    }
    if (aliice.website) {
      doc.text(`Web: ${aliice.website}`, ml + colWidth + 9, cy);
    }

    y += 44;
  }

  // ── Intro ─────────────────────────────────────────────────────────────────
  ensureSpace(30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(slate900.r, slate900.g, slate900.b);
  const intro =
    "Alice is an all-in-one medical practice management platform developed by Dr. Temoro, plastic surgeon and founder of Aesthetics Clinic. Designed around the real-world needs of healthcare professionals, Alice centralizes the entire patient journey within a single secure and intuitive platform. The platform enables healthcare providers to manage medical records, consultations, patient communications, and pre- and post-treatment follow-up. Through advanced automation tools, Alice streamlines clinical operations, enhances the patient experience, and reduces administrative workload.";
  const introLines = doc.splitTextToSize(intro, pw - ml - mr);
  doc.text(introLines, ml, y);
  y += introLines.length * 4.7 + 8;

  // ── Objectives ──────────────────────────────────────────────────────────
  sectionTitle("Alice Objectives");
  bulletList(objectives, 4, pw - ml - mr, 9.5, 4.5);
  y += 4;

  // ── Core Features detail ───────────────────────────────────────────────
  sectionTitle("Core Features");
  detailSections.forEach((section) => {
    ensureSpace(10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(slate900.r, slate900.g, slate900.b);
    doc.text(section.title, ml, y);
    y += 6;
    bulletList(section.items, 4, pw - ml - mr, 9, 4);
    y += 3;
  });

  // ── Implementation ───────────────────────────────────────────────────────
  sectionTitle("Implementation & Onboarding Support");
  bulletList(implementationSteps, 4, pw - ml - mr, 9.5, 4.5);
  y += 4;

  // ── Proven Benefits ──────────────────────────────────────────────────────
  sectionTitle("Proven Benefits");
  bulletList(provenBenefits, 4, pw - ml - mr, 9.5, 4.5);
  y += 8;

  // ── Pricing table ────────────────────────────────────────────────────────
  sectionTitle("Tarification Alice");
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

  // ── Storage table ───────────────────────────────────────────────────────
  sectionTitle("Additional Storage Space");
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

  // ── Feature comparison table ───────────────────────────────────────────
  sectionTitle("Package Comparison: Alice");
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
  y += closingLines.length * 4.7 + 10;

  // ── Next steps ──────────────────────────────────────────────────────────
  sectionTitle("Next Steps");
  bulletList(nextSteps, 4, pw - ml - mr, 9.5, 4.5);

  addFooter();

  return doc;
}
