"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  Bot,
  BarChart3,
  Shield,
  Zap,
  HardDrive,
} from "lucide-react";

const tiers = [
  {
    name: "Starter",
    description: "Essential CRM & Booking",
    monthlyPrice: 1490,
    onboarding: 2500,
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
    monthlyPrice: 2240,
    onboarding: 3500,
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
    monthlyPrice: 3200,
    onboarding: 5500,
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
];

const competitors = [
  { name: "Hubspot", type: "CRM", monthly: 3000, yearly: 36000 },
  { name: "Axenita", type: "ERP", monthly: 1200, yearly: 14400 },
  { name: "OneDoc", type: "Booking", monthly: 227, yearly: 2724 },
];

const competitorTotal = competitors.reduce((sum, c) => sum + c.monthly, 0);
const aliiceSavings = competitorTotal - 2240;

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

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
            <Link href="/register" className="rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-4 py-1.5 mb-6">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Save 49% vs Competitors</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            All-in-one clinic management platform. Replace 3 expensive tools with one unified solution.
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="text-3xl font-bold text-sky-600">$2,240</div>
              <div className="text-sm text-slate-600">Monthly Subscription</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="text-3xl font-bold text-emerald-600">49%</div>
              <div className="text-sm text-slate-600">Cheaper Than Competitors</div>
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
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-3xl p-8 ${
                  tier.popular
                    ? "bg-gradient-to-br from-sky-600 to-violet-600 text-white shadow-xl scale-105"
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
                  <span className={`text-4xl font-bold ${tier.popular ? "text-white" : "text-slate-900"}`}>
                    ${tier.monthlyPrice.toLocaleString()}
                  </span>
                  <span className={tier.popular ? "text-sky-200" : "text-slate-500"}>/month</span>
                </div>
                
                <div className={`text-sm mt-2 ${tier.popular ? "text-sky-200" : "text-slate-500"}`}>
                  + ${tier.onboarding.toLocaleString()} one-time onboarding
                </div>

                <ul className="mt-8 space-y-3">
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
                  href="/register"
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

      {/* Competitor Comparison */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Price Comparison</h2>
            <p className="mt-2 text-slate-600">How Aliice stacks up against alternatives</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden max-w-4xl mx-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-4 text-sm font-semibold text-slate-900">Product</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-900">Type</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-900">Monthly</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-900">Yearly</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr key={c.name} className="border-b border-slate-50">
                    <td className="p-4 font-medium text-slate-700">{c.name}</td>
                    <td className="p-4 text-slate-500">{c.type}</td>
                    <td className="p-4 text-right text-slate-700">${c.monthly.toLocaleString()}</td>
                    <td className="p-4 text-right text-slate-700">${c.yearly.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-gradient-to-r from-sky-50 to-violet-50">
                  <td className="p-4 font-bold text-slate-900">Aliice</td>
                  <td className="p-4 text-sky-600 font-medium">CRM + ERP + Booking</td>
                  <td className="p-4 text-right font-bold text-sky-600">$2,240</td>
                  <td className="p-4 text-right font-bold text-sky-600">$26,880</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Savings Summary */}
          <div className="mt-8 grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-4 text-center border border-slate-100">
              <div className="text-sm text-slate-500">Competitors Combined</div>
              <div className="text-2xl font-bold text-slate-900">${competitorTotal.toLocaleString()}/mo</div>
            </div>
            <div className="bg-gradient-to-r from-sky-600 to-violet-600 rounded-xl p-4 text-center">
              <div className="text-sm text-sky-200">Aliice Professional</div>
              <div className="text-2xl font-bold text-white">$2,240/mo</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
              <div className="text-sm text-emerald-600">Monthly Savings</div>
              <div className="text-2xl font-bold text-emerald-700">${aliiceSavings.toLocaleString()}</div>
            </div>
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
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left p-4 text-sm font-semibold text-slate-900">Feature</th>
                  <th className="text-center p-4 text-sm font-semibold text-slate-900">
                    <div>Starter</div>
                    <div className="text-sky-600 font-bold">$1,490/mo</div>
                  </th>
                  <th className="text-center p-4 text-sm font-semibold text-slate-900 bg-sky-50">
                    <div>Professional</div>
                    <div className="text-sky-600 font-bold">$2,240/mo</div>
                  </th>
                  <th className="text-center p-4 text-sm font-semibold text-slate-900">
                    <div>Enterprise</div>
                    <div className="text-sky-600 font-bold">$3,200/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Patient Management", starter: true, pro: true, enterprise: true },
                  { feature: "Appointment Scheduling", starter: true, pro: true, enterprise: true },
                  { feature: "Calendar Management", starter: true, pro: true, enterprise: true },
                  { feature: "Email Support", starter: true, pro: true, enterprise: true },
                  { feature: "1 TB Storage Included", starter: true, pro: true, enterprise: true },
                  { feature: "Basic Reporting", starter: true, pro: true, enterprise: true },
                  { feature: "Billing & Invoicing", starter: false, pro: true, enterprise: true },
                  { feature: "AI Medical Scribe", starter: false, pro: true, enterprise: true },
                  { feature: "WhatsApp Integration", starter: false, pro: true, enterprise: true },
                  { feature: "Document Generation", starter: false, pro: true, enterprise: true },
                  { feature: "Advanced Analytics", starter: false, pro: true, enterprise: true },
                  { feature: "Priority Support", starter: false, pro: true, enterprise: true },
                  { feature: "Custom Workflows", starter: false, pro: false, enterprise: true },
                  { feature: "API Access", starter: false, pro: false, enterprise: true },
                  { feature: "Custom Integrations", starter: false, pro: false, enterprise: true },
                  { feature: "24/7 Dedicated Support", starter: false, pro: false, enterprise: true },
                  { feature: "White-label Options", starter: false, pro: false, enterprise: true },
                  { feature: "Custom Booking Pages", starter: false, pro: false, enterprise: true },
                ].map((row, idx) => (
                  <tr key={row.feature} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="p-4 text-sm font-medium text-slate-700">{row.feature}</td>
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
                $50/month
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
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg"
            >
              Start Free Trial
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
