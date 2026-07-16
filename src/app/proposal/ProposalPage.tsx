"use client";

import { useState, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Download, ArrowRight } from "lucide-react";
import { buildProposalPdf } from "@/lib/buildProposalPdf";

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
    rows: [{ name: "WhatsApp Integration", basic: true, pro: true, ent: true }],
  },
  {
    category: "Analytics",
    rows: [{ name: "Advanced Analytics", basic: true, pro: true, ent: true }],
  },
];

const aliiceLogoUrl =
  "https://www.aliice.app/_next/image?url=%2Flogos%2Faliice-logo.png&w=128&q=75";

export default function ProposalPage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const doc = await buildProposalPdf();
      doc.save("aliice-proposal.pdf");
    } finally {
      setIsGenerating(false);
    }
  };

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
              <li className="flex items-start gap-2">
                <span className="text-blue-700">•</span>
                <span>Answer any questions you may have</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-700">•</span>
                <span>Assess your specific needs and requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-700">•</span>
                <span>Organize an additional demonstration for your team</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-700">•</span>
                <span>Prepare a customized proposal tailored to your organization</span>
              </li>
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
