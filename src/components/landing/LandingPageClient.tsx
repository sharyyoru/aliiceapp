"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Users,
  FileText,
  CreditCard,
  MessageSquare,
  BarChart3,
  Shield,
  Building2,
  UserPlus,
  Clock,
  CheckCircle,
  ArrowRight,
  Play,
  Mic,
  Sparkles,
  Phone,
  Mail,
  Stethoscope,
  TrendingUp,
  Zap,
  Bot,
  Menu,
  X,
} from "lucide-react";

// Interactive Demo Components
import PatientCardDemo from "./demos/PatientCardDemo";
import CalendarDemo from "./demos/CalendarDemo";
import AIScribeDemo from "./demos/AIScribeDemo";
import AnalyticsDemo from "./demos/AnalyticsDemo";

const features = [
  {
    icon: Users,
    title: "Patient Management",
    description: "Comprehensive patient records, medical history, and treatment tracking.",
    color: "sky",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Intelligent appointment booking with automated reminders.",
    color: "violet",
  },
  {
    icon: Bot,
    title: "AI Medical Scribe",
    description: "Voice-powered consultation transcription with SOAP notes.",
    color: "emerald",
  },
  {
    icon: CreditCard,
    title: "Billing & Invoicing",
    description: "Swiss billing standards with TarMed and insurance integrations.",
    color: "amber",
  },
  {
    icon: MessageSquare,
    title: "Omnichannel Messaging",
    description: "Email, SMS, and WhatsApp for seamless patient engagement.",
    color: "pink",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Real-time insights into clinic performance and revenue.",
    color: "indigo",
  },
];

const stats = [
  { value: "49%", label: "Cost Savings", sublabel: "vs competitors" },
  { value: "3-in-1", label: "Platform", sublabel: "CRM + ERP + Booking" },
  { value: "24/7", label: "Availability", sublabel: "Cloud-based" },
  { value: "GDPR", label: "Compliant", sublabel: "Swiss hosted" },
];

export default function LandingPageClient() {
  const [activeDemo, setActiveDemo] = useState<"patient" | "calendar" | "ai" | "analytics">("patient");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate demos
  useEffect(() => {
    const demos: ("patient" | "calendar" | "ai" | "analytics")[] = ["patient", "calendar", "ai", "analytics"];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % demos.length;
      setActiveDemo(demos[index]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-lg shadow-sm" : "bg-white/80 backdrop-blur-lg border-b border-slate-100"
      }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/aliice-logo.png"
              alt="Aliice"
              width={100}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </Link>
            <Link href="#demo" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Demo
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-sky-600/25 transition-all hover:shadow-sky-600/40 hover:scale-105"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3">
            <Link href="#features" className="block py-2 text-slate-600">Features</Link>
            <Link href="#demo" className="block py-2 text-slate-600">Demo</Link>
            <Link href="/pricing" className="block py-2 text-slate-600">Pricing</Link>
            <Link href="/contact" className="block py-2 text-slate-600">Contact</Link>
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link href="/login" className="block py-2 text-slate-600">Login</Link>
              <Link href="/register" className="block w-full text-center rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white">
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-violet-50" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-sky-200/30 to-violet-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-200/20 to-sky-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-50 to-violet-50 border border-sky-100 px-4 py-1.5 mb-6">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-medium text-slate-700">AI-Powered Clinic Management</span>
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                The All-in-One{" "}
                <span className="bg-gradient-to-r from-sky-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent animate-gradient">
                  Medical CRM
                </span>
              </h1>
              
              <p className="mt-6 text-lg leading-8 text-slate-600 max-w-xl mx-auto lg:mx-0">
                Replace 3 expensive tools with one unified platform. Patient management, 
                scheduling, billing, and AI-powered documentation — all in one place.
              </p>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-slate-900">{stat.label}</div>
                    <div className="text-xs text-slate-500">{stat.sublabel}</div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-600/25 transition-all hover:shadow-sky-600/40 hover:scale-105"
                >
                  Start 14-Day Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="#demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <Play className="h-5 w-5 text-violet-600" />
                  Watch Demo
                </Link>
              </div>
            </div>

            {/* Right - Interactive Demo Card */}
            <div className="relative">
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {/* Demo Tabs */}
                <div className="flex border-b border-slate-100">
                  {[
                    { id: "patient", icon: Users, label: "Patients" },
                    { id: "calendar", icon: Calendar, label: "Calendar" },
                    { id: "ai", icon: Mic, label: "AI Scribe" },
                    { id: "analytics", icon: BarChart3, label: "Analytics" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDemo(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                        activeDemo === tab.id
                          ? "text-sky-600 bg-sky-50 border-b-2 border-sky-600"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Demo Content */}
                <div className="p-6 min-h-[400px]">
                  {activeDemo === "patient" && <PatientCardDemo />}
                  {activeDemo === "calendar" && <CalendarDemo />}
                  {activeDemo === "ai" && <AIScribeDemo />}
                  {activeDemo === "analytics" && <AnalyticsDemo />}
                </div>
              </div>

              {/* Floating Elements - Hidden on mobile, positioned outside on desktop */}
              <div className="hidden xl:block absolute top-4 -right-16 bg-white rounded-2xl shadow-xl p-3 animate-float z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">Consultation Saved</div>
                    <div className="text-xs text-slate-500">Just now</div>
                  </div>
                </div>
              </div>

              <div className="hidden xl:block absolute bottom-8 -left-16 bg-white rounded-2xl shadow-xl p-3 animate-float-delayed z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">New Appointment</div>
                    <div className="text-xs text-slate-500">Tomorrow at 10:00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need to Run Your Clinic
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              One platform that replaces CRM, ERP, and booking systems — saving you 49% on software costs.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-transparent transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`mb-4 inline-flex rounded-xl p-3 bg-${feature.color}-50 text-${feature.color}-600 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              See Aliice in Action
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Interactive demos — click around and explore the features
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* AI Scribe Demo */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-8 border border-violet-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-violet-600 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">AI Medical Scribe</h3>
                  <p className="text-sm text-slate-600">Voice-powered documentation</p>
                </div>
              </div>
              <AIScribeDemo expanded />
            </div>

            {/* Calendar Demo */}
            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-3xl p-8 border border-sky-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-sky-600 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Smart Scheduling</h3>
                  <p className="text-sm text-slate-600">Drag & drop appointments</p>
                </div>
              </div>
              <CalendarDemo expanded />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
              Save 49% compared to using separate CRM, ERP, and booking systems.
            </p>
            
            <div className="mt-12 grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-left border border-white/10">
                <div className="text-emerald-400 text-sm font-medium mb-2">Starter</div>
                <div className="text-3xl font-bold text-white">$1,490<span className="text-lg text-slate-400">/mo</span></div>
                <div className="text-sm text-slate-400 mt-1">Essential CRM & Booking</div>
              </div>
              <div className="bg-gradient-to-br from-sky-600 to-violet-600 rounded-2xl p-6 text-left scale-105 shadow-xl">
                <div className="text-sky-200 text-sm font-medium mb-2">Professional</div>
                <div className="text-3xl font-bold text-white">$2,240<span className="text-lg text-sky-200">/mo</span></div>
                <div className="text-sm text-sky-100 mt-1">Full CRM + ERP + Booking</div>
                <div className="mt-3 text-xs bg-white/20 rounded-full px-3 py-1 inline-block">Most Popular</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-left border border-white/10">
                <div className="text-amber-400 text-sm font-medium mb-2">Enterprise</div>
                <div className="text-3xl font-bold text-white">$3,200<span className="text-lg text-slate-400">/mo</span></div>
                <div className="text-sm text-slate-400 mt-1">Everything + AI & Custom</div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-50"
              >
                View Full Pricing
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Ready to Transform Your Clinic?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Join clinics already using Aliice to streamline operations and deliver better patient care.
          </p>
          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-600/25 transition-all hover:shadow-sky-600/40 hover:scale-105"
            >
              <Zap className="h-5 w-5" />
              Start Your Free Trial
            </Link>
            <p className="mt-4 text-sm text-slate-500">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#features" className="hover:text-slate-900">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-slate-900">Pricing</Link></li>
                <li><Link href="#demo" className="hover:text-slate-900">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="/contact" className="hover:text-slate-900">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-slate-900">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-slate-900">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="mailto:support@aliice.com" className="hover:text-slate-900">Email Support</a></li>
                <li><Link href="/contact" className="hover:text-slate-900">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>GDPR Compliant</li>
                <li>Swiss Data Hosting</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Image
                src="/logos/aliice-logo.png"
                alt="Aliice"
                width={80}
                height={26}
                className="h-6 w-auto"
              />
              <span className="text-sm text-slate-500">
                © {new Date().getFullYear()} Aliice. All rights reserved.
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
