"use client";

import { useState, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Download, ArrowRight, Building2, User, MapPin, Mail, Phone } from "lucide-react";
import { buildProposalPdf } from "@/lib/buildProposalPdf";
import type { ProposalClientData, AliiceCompanyData } from "@/lib/buildProposalPdf";

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

const pricingRows = [
  { label: "Initial setup", values: ["CHF 2'000", "CHF 2'800", "CHF 4'400"] },
  { label: "Monthly Subscription", values: ["CHF 1'190 / month", "CHF 1'790 / month", "CHF 2'560 / month"] },
  { label: "Annual Subscription", values: ["CHF 1'070 / month", "CHF 1'610 / month", "CHF 2'300 / month"] },
  { label: "AI Module", values: ["Included", "Included", "Included"] },
  { label: "Storage", values: ["Usage-Based", "Usage-Based", "Usage-Based"] },
];

const storageRows = [
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

const aliiceLogoUrl =
  "https://www.aliice.app/_next/image?url=%2Flogos%2Faliice-logo.png&w=128&q=75";

const defaultAliiceData: AliiceCompanyData = {
  name: "Aliice",
  address: "Switzerland",
  email: "contact@aliice.app",
  phone: "+41 (0) 00 000 00 00",
  website: "www.aliice.app",
};

export default function ProposalPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [client, setClient] = useState<ProposalClientData>({
    company: "",
    name: "",
    address: "",
    email: "",
    phone: "",
  });
  const [aliice, setAliice] = useState<AliiceCompanyData>(defaultAliiceData);

  const updateClient = (field: keyof ProposalClientData, value: string) => {
    setClient((prev) => ({ ...prev, [field]: value }));
  };

  const updateAliice = (field: keyof AliiceCompanyData, value: string) => {
    setAliice((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const doc = await buildProposalPdf(client, aliice);
      doc.save("aliice-proposal.pdf");
    } finally {
      setIsGenerating(false);
    }
  };

  const inputBase =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-lg border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={aliiceLogoUrl}
              alt="Aliice"
              width={128}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Login
            </Link>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-800 transition disabled:opacity-70"
            >
              {isGenerating ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGenerating ? "Generating…" : "Download PDF"}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 border-b border-blue-700 pb-6">
            <Image
              src={aliiceLogoUrl}
              alt="Aliice"
              width={128}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Aliice Pricing Proposal
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              Aliice is an all-in-one medical practice management platform. All plans
              include core patient management, scheduling, communications, and 1 TB of
              storage.
            </p>
          </div>

          {/* Client details form */}
          <section className="mb-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-blue-700">
              <Building2 className="h-5 w-5" />
              Proposal To
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  Client Company
                </label>
                <input
                  type="text"
                  value={client.company}
                  onChange={(e) => updateClient("company", e.target.value)}
                  placeholder="Company name"
                  className={inputBase}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  Contact Name
                </label>
                <input
                  type="text"
                  value={client.name}
                  onChange={(e) => updateClient("name", e.target.value)}
                  placeholder="Contact person"
                  className={inputBase}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Address
                </label>
                <textarea
                  value={client.address}
                  onChange={(e) => updateClient("address", e.target.value)}
                  placeholder="Street address, city, country"
                  rows={2}
                  className={inputBase}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email
                </label>
                <input
                  type="email"
                  value={client.email}
                  onChange={(e) => updateClient("email", e.target.value)}
                  placeholder="contact@company.com"
                  className={inputBase}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={client.phone}
                  onChange={(e) => updateClient("phone", e.target.value)}
                  placeholder="+41 00 000 00 00"
                  className={inputBase}
                />
              </div>
            </div>
          </section>

          {/* Aliice details form */}
          <section className="mb-14 rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-blue-700">
              <Building2 className="h-5 w-5" />
              Aliice Company Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  Company Name
                </label>
                <input
                  type="text"
                  value={aliice.name}
                  onChange={(e) => updateAliice("name", e.target.value)}
                  placeholder="Aliice"
                  className={inputBase}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Website
                </label>
                <input
                  type="text"
                  value={aliice.website}
                  onChange={(e) => updateAliice("website", e.target.value)}
                  placeholder="www.aliice.app"
                  className={inputBase}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Address
                </label>
                <textarea
                  value={aliice.address}
                  onChange={(e) => updateAliice("address", e.target.value)}
                  placeholder="Street address, city, country"
                  rows={2}
                  className={inputBase}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email
                </label>
                <input
                  type="email"
                  value={aliice.email}
                  onChange={(e) => updateAliice("email", e.target.value)}
                  placeholder="contact@aliice.app"
                  className={inputBase}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={aliice.phone}
                  onChange={(e) => updateAliice("phone", e.target.value)}
                  placeholder="+41 (0) 00 000 00 00"
                  className={inputBase}
                />
              </div>
            </div>
          </section>

          {/* Intro */}
          <section className="mb-14">
            <p className="text-lg leading-relaxed text-slate-600">
              Alice is an all-in-one medical practice management platform developed by Dr.
              Temoro, plastic surgeon and founder of Aesthetics Clinic. Designed around the
              real-world needs of healthcare professionals, Alice centralizes the entire
              patient journey within a single secure and intuitive platform. The platform
              enables healthcare providers to manage medical records, consultations,
              patient communications, and pre- and post-treatment follow-up. Through advanced
              automation tools, Alice streamlines clinical operations, enhances the patient
              experience, and reduces administrative workload.
            </p>
          </section>

          {/* Objectives */}
          <section className="mb-14">
            <h2 className="mb-5 text-2xl font-bold text-blue-700">Alice Objectives</h2>
            <p className="mb-4 text-slate-600">Alice enables healthcare providers to:</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {objectives.map((item) => (
                <li key={item} className="flex items-start gap-2 text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Core Features */}
          <section className="mb-14">
            <h2 className="mb-6 text-2xl font-bold text-blue-700">Core Features</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {detailSections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="mb-4 text-lg font-bold text-slate-900">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-700" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Implementation */}
          <section className="mb-14 rounded-2xl bg-blue-50 p-6 sm:p-8">
            <h2 className="mb-4 text-2xl font-bold text-blue-700">
              Implementation & Onboarding Support
            </h2>
            <p className="mb-4 text-slate-600">The implementation process includes:</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {implementationSteps.map((item) => (
                <li key={item} className="flex items-start gap-2 text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Proven Benefits */}
          <section className="mb-14">
            <h2 className="mb-4 text-2xl font-bold text-blue-700">Proven Benefits</h2>
            <p className="mb-4 text-slate-600">
              At Aesthetics Clinic, the implementation of Alice has resulted in:
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {provenBenefits.map((item) => (
                <li key={item} className="flex items-start gap-2 text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Pricing table */}
          <section className="mb-14">
            <h2 className="mb-5 text-2xl font-bold text-blue-700">Tarification Alice</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="px-4 py-3 text-left font-bold text-blue-700">Offer</th>
                    {tiers.map((tier) => (
                      <th
                        key={tier.name}
                        className="px-4 py-3 text-center font-bold text-blue-700"
                      >
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pricingRows.map((row, idx) => (
                    <tr
                      key={row.label}
                      className={idx % 2 === 1 ? "bg-slate-50" : "bg-white"}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                      {row.values.map((val, i) => (
                        <td
                          key={i}
                          className="px-4 py-3 text-center font-semibold text-blue-700"
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Storage table */}
          <section className="mb-14">
            <h2 className="mb-5 text-2xl font-bold text-blue-700">
              Additional Storage Space
            </h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="px-4 py-3 text-left font-bold text-blue-700">
                      Storage
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-blue-700">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {storageRows.map((row, idx) => (
                    <tr
                      key={row.label}
                      className={idx % 2 === 1 ? "bg-slate-50" : "bg-white"}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-700">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Feature comparison */}
          <section className="mb-14">
            <h2 className="mb-5 text-2xl font-bold text-blue-700">
              Package Comparison: Alice
            </h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="px-4 py-3 text-left font-bold text-blue-700">
                      Core Features
                    </th>
                    {tiers.map((tier) => (
                      <th
                        key={tier.name}
                        className="px-4 py-3 text-center font-bold text-blue-700"
                      >
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureGroups.map((group, groupIdx) => (
                    <Fragment key={group.category}>
                      {groupIdx > 0 && (
                        <tr className="bg-blue-700">
                          <td
                            colSpan={4}
                            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                          >
                            {group.category}
                          </td>
                        </tr>
                      )}
                      {group.rows.map((row, idx) => (
                        <tr
                          key={`${group.category}-${row.name}`}
                          className={idx % 2 === 1 ? "bg-slate-50" : "bg-white"}
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {row.name}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.basic ? (
                              <Check className="mx-auto h-5 w-5 text-blue-700" />
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.pro ? (
                              <Check className="mx-auto h-5 w-5 text-blue-700" />
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.ent ? (
                              <Check className="mx-auto h-5 w-5 text-blue-700" />
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Closing */}
          <section className="mb-14 rounded-2xl bg-slate-50 p-6 sm:p-8">
            <p className="text-slate-600 italic">
              We are confident that Aliice can become a powerful driver of efficiency,
              organization, and growth for your practice. We remain at your disposal to
              answer any questions and to support you in implementing a solution perfectly
              tailored to your practice and your objectives.
            </p>
          </section>

          {/* Next steps */}
          <section className="mb-14">
            <h2 className="mb-4 text-2xl font-bold text-blue-700">Next Steps</h2>
            <ul className="space-y-2 text-slate-700">
              {nextSteps.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-blue-700">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <section className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Ready to Get Started?</h2>
            <p className="mt-3 text-lg text-slate-600">
              Request a demo today. No commitment required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-800 transition"
              >
                Request a Demo
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 px-8 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Contact Sales
              </Link>
            </div>
            <div className="mt-6">
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow hover:bg-slate-800 transition disabled:opacity-70"
              >
                {isGenerating ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                {isGenerating ? "Generating PDF…" : "Download PDF Proposal"}
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Image
            src={aliiceLogoUrl}
            alt="Aliice"
            width={100}
            height={32}
            className="h-6 w-auto"
          />
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/">Home</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
