"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, X, ArrowRight, HardDrive } from "lucide-react";

type Currency = "EUR" | "CHF" | "USD";

type Money = {
  amount: number;
  currency: Currency;
};

const tiers = [
  {
    name: "Basic",
    description: "Core clinic platform",
    monthlyPrice: { amount: 700, currency: "USD" },
    onboarding: { amount: 1000, currency: "USD" },
    features: [
      { name: "Patient Management", included: true },
      { name: "Appointment Scheduling", included: true },
      { name: "Calendar Management", included: true },
      { name: "Basic Reporting", included: true },
      { name: "Email Support", included: true },
      { name: "1 TB Storage", included: true },
      { name: "Billing & Invoicing", included: false },
      { name: "AI Medical Scribe", included: false },
      { name: "WhatsApp Integration", included: false },
      { name: "Custom Workflows", included: false },
      { name: "API Access", included: false },
    ],
    color: "slate",
    popular: false,
  },
  {
    name: "Starter",
    description: "Essential CRM & Booking",
    monthlyPrice: { amount: 1490, currency: "CHF" },
    onboarding: { amount: 2500, currency: "CHF" },
    features: [
      { name: "Patient Management", included: true },
      { name: "Appointment Scheduling", included: true },
      { name: "Basic Reporting", included: true },
      { name: "Email Support", included: true },
      { name: "1 TB Storage", included: true },
      { name: "Billing & Invoicing", included: false },
      { name: "AI Medical Scribe", included: false },
      { name: "WhatsApp Integration", included: false },
      { name: "Custom Workflows", included: false },
      { name: "API Access", included: false },
    ],
    color: "slate",
    popular: false,
  },
  {
    name: "Professional",
    description: "Full CRM + ERP + Booking",
    monthlyPrice: { amount: 2240, currency: "CHF" },
    onboarding: { amount: 3500, currency: "CHF" },
    features: [
      { name: "Patient Management", included: true },
      { name: "Appointment Scheduling", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Priority Support", included: true },
      { name: "1 TB Storage", included: true },
      { name: "Billing & Invoicing", included: true },
      { name: "AI Medical Scribe", included: true },
      { name: "WhatsApp Integration", included: true },
      { name: "Custom Workflows", included: false },
      { name: "API Access", included: false },
    ],
    color: "sky",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Everything + AI & Integrations",
    monthlyPrice: { amount: 3200, currency: "CHF" },
    onboarding: { amount: 5500, currency: "CHF" },
    features: [
      { name: "Patient Management", included: true },
      { name: "Appointment Scheduling", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "24/7 Dedicated Support", included: true },
      { name: "1 TB Storage", included: true },
      { name: "Billing & Invoicing", included: true },
      { name: "AI Medical Scribe", included: true },
      { name: "WhatsApp Integration", included: true },
      { name: "Custom Workflows", included: true },
      { name: "API Access", included: true },
    ],
    color: "violet",
    popular: false,
  },
] as const;

const CURRENCIES: Currency[] = ["EUR", "CHF", "USD"];

const EUR_REFERENCE_RATES: Record<Currency, number> = {
  EUR: 1,
  CHF: 0.9359,
  USD: 1.1269,
};

function convertPrice(money: Money, currency: Currency): number {
  const amountInEuros = money.amount / EUR_REFERENCE_RATES[money.currency];
  return Math.round(amountInEuros * EUR_REFERENCE_RATES[currency]);
}

function formatPrice(money: Money, currency: Currency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(convertPrice(money, currency));
}

export default function PricingPage() {
  const [currency, setCurrency] = useState<Currency>("EUR");

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-lg border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logos/aliice-logo.png" alt="Aliice" width={100} height={32} className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Login</Link>
            <Link href="/signup" className="rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white">
              Request a Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            All-in-one clinic management platform. Replace 3 expensive tools with one unified solution.
          </p>

          {/* Currency toggle */}
          <div className="mt-8 inline-flex items-center gap-1 bg-slate-100 rounded-full p-1">
            {CURRENCIES.map((currencyCode) => (
              <button
                key={currencyCode}
                onClick={() => setCurrency(currencyCode)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  currency === currencyCode
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {currencyCode}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Converted prices use fixed ECB reference rates from 6 October 2026. Base prices are USD for Basic and CHF for all other plans.
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="text-3xl font-bold text-sky-600">100%</div>
              <div className="text-sm text-slate-600">Automated</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="text-3xl font-bold text-violet-600">3-in-1</div>
              <div className="text-sm text-slate-600">CRM + ERP + Booking</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="text-3xl font-bold text-amber-600">1 TB</div>
              <div className="text-sm text-slate-600">Storage Included</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl p-6 xl:p-7 ${
                  tier.popular
                    ? "bg-gradient-to-br from-sky-600 to-violet-600 text-white shadow-xl xl:scale-105"
                    : "bg-white border-2 border-slate-100"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                
                <div className={`text-sm font-medium ${tier.popular ? "text-sky-200" : "text-slate-500"}`}>
                  {tier.description}
                </div>
                <h3 className={`text-2xl font-bold mt-1 ${tier.popular ? "text-white" : "text-slate-900"}`}>
                  {tier.name}
                </h3>
                
                <div className="mt-6">
                  <span className={`text-3xl font-bold 2xl:text-4xl ${tier.popular ? "text-white" : "text-slate-900"}`}>
                    {formatPrice(tier.monthlyPrice, currency)}
                  </span>
                  <span className={tier.popular ? "text-sky-200" : "text-slate-500"}>/month</span>
                </div>
                
                <div className={`text-sm mt-2 ${tier.popular ? "text-sky-200" : "text-slate-500"}`}>
                  + {formatPrice(tier.onboarding, currency)} one-time onboarding
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className={`h-5 w-5 flex-shrink-0 ${tier.popular ? "text-emerald-300" : "text-emerald-500"}`} />
                      ) : (
                        <X className={`h-5 w-5 flex-shrink-0 ${tier.popular ? "text-white/30" : "text-slate-300"}`} />
                      )}
                      <span className={`text-sm ${
                        feature.included
                          ? tier.popular ? "text-white" : "text-slate-700"
                          : tier.popular ? "text-white/50" : "text-slate-400"
                      }`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-8 block w-full py-3 rounded-xl font-semibold text-center transition-all ${
                    tier.popular
                      ? "bg-white text-sky-600 hover:bg-sky-50"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Breakdown */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Feature Breakdown</h2>
            <p className="mt-2 text-slate-600">What&apos;s included in each tier</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left p-4 text-sm font-semibold text-slate-900">Feature</th>
                  {tiers.map((tier) => (
                    <th
                      key={tier.name}
                      className={`text-center p-4 text-sm font-semibold text-slate-900 ${tier.popular ? "bg-sky-50" : ""}`}
                    >
                      <div>{tier.name}</div>
                      <div className="text-sky-600 font-bold">{formatPrice(tier.monthlyPrice, currency)}/mo</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Patient Management", basic: true, starter: true, pro: true, enterprise: true },
                  { feature: "Appointment Scheduling", basic: true, starter: true, pro: true, enterprise: true },
                  { feature: "Calendar Management", basic: true, starter: true, pro: true, enterprise: true },
                  { feature: "Email Support", basic: true, starter: true, pro: true, enterprise: true },
                  { feature: "1 TB Storage Included", basic: true, starter: true, pro: true, enterprise: true },
                  { feature: "Basic Reporting", basic: true, starter: true, pro: true, enterprise: true },
                  { feature: "Billing & Invoicing", basic: false, starter: false, pro: true, enterprise: true },
                  { feature: "AI Medical Scribe", basic: false, starter: false, pro: true, enterprise: true },
                  { feature: "WhatsApp Integration", basic: false, starter: false, pro: true, enterprise: true },
                  { feature: "Document Generation", basic: false, starter: false, pro: true, enterprise: true },
                  { feature: "Advanced Analytics", basic: false, starter: false, pro: true, enterprise: true },
                  { feature: "Priority Support", basic: false, starter: false, pro: true, enterprise: true },
                  { feature: "Custom Workflows", basic: false, starter: false, pro: false, enterprise: true },
                  { feature: "API Access", basic: false, starter: false, pro: false, enterprise: true },
                  { feature: "Custom Integrations", basic: false, starter: false, pro: false, enterprise: true },
                  { feature: "24/7 Dedicated Support", basic: false, starter: false, pro: false, enterprise: true },
                  { feature: "White-label Options", basic: false, starter: false, pro: false, enterprise: true },
                  { feature: "Custom Booking Pages", basic: false, starter: false, pro: false, enterprise: true },
                ].map((row, idx) => (
                  <tr key={row.feature} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="p-4 text-sm font-medium text-slate-700">{row.feature}</td>
                    <td className="p-4 text-center">
                      {row.basic ? (
                        <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.starter ? (
                        <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center bg-sky-50/50">
                      {row.pro ? (
                        <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.enterprise ? (
                        <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Storage Pricing */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Storage</h2>
            <p className="mt-2 text-slate-600">For files and contacts</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <HardDrive className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">1 TB</div>
              <div className="text-slate-600 mt-1">Included with all plans</div>
              <div className="mt-4 inline-block bg-emerald-100 text-emerald-700 text-sm font-medium px-3 py-1 rounded-full">
                Free
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
              <div className="h-14 w-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <HardDrive className="h-7 w-7 text-violet-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">+1 TB</div>
              <div className="text-slate-600 mt-1">Additional storage</div>
              <div className="mt-4 inline-block bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-full">
                {formatPrice({ amount: 50, currency: "CHF" }, currency)}/month
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-slate-600">
            Request a demo today. No commitment required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg"
            >
              Request a Demo
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 px-8 py-4 text-base font-semibold text-slate-700"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Image src="/logos/aliice-logo.png" alt="Aliice" width={80} height={26} className="h-6 w-auto" />
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
