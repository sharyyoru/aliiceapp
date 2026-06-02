"use client";

import { useState, useEffect, useRef } from "react";
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
  Globe,
  Layout,
  Palette,
  Smartphone,
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mouse tracking for spotlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
    <div className="min-h-screen bg-white" ref={heroRef}>
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
            <Link href="/blog" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Blog
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
            <Link href="/blog" className="block py-2 text-slate-600">Blog</Link>
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
        {/* Dot Grid Background with Mouse Spotlight */}
        <div className="absolute inset-0 -z-10">
          {/* Base background */}
          <div className="absolute inset-0 bg-[#fafafa]" />
          
          {/* Dot grid pattern */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          
          {/* Mouse spotlight effect */}
          <div 
            className="absolute pointer-events-none transition-opacity duration-300"
            style={{
              left: mousePosition.x - 300,
              top: mousePosition.y - 300,
              width: 600,
              height: 600,
              background: `radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 40%, transparent 70%)`,
              borderRadius: '50%',
            }}
          />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <div className="text-center lg:text-left">
              <p className="text-sm text-slate-500 mb-8">
                Manage patients • Schedule appointments • Bill clients
              </p>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                The All-in-one Digital Medical Assistant
              </h1>
              <p className="mt-4 text-base sm:text-lg md:text-xl text-sky-600 font-normal">
                Replacing CRM, ERP, and booking with one unified platform.
              </p>

              {/* Stats */}
              <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left p-2 sm:p-0">
                    <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-slate-900">{stat.label}</div>
                    <div className="text-[10px] sm:text-xs text-slate-500">{stat.sublabel}</div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/register"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Start 14-Day Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right - Interactive Demo Card */}
            <div className="relative mt-8 lg:mt-0">
              <div className="relative bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200/60 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.1)]">
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
                      className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all ${
                        activeDemo === tab.id
                          ? "text-sky-600 bg-sky-50 border-b-2 border-sky-600"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="text-[10px] sm:text-sm">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Demo Content - Responsive height */}
                <div className="p-4 sm:p-6 h-[320px] sm:h-[420px] overflow-hidden">
                  {activeDemo === "patient" && <PatientCardDemo />}
                  {activeDemo === "calendar" && <CalendarDemo />}
                  {activeDemo === "ai" && <AIScribeDemo />}
                  {activeDemo === "analytics" && <AnalyticsDemo />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-slate-50/50">
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
                className="group relative bg-white rounded-2xl p-8 border border-slate-200/60 transition-all duration-500 ease-out hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1"
              >
                <div className="mb-5 inline-flex rounded-2xl p-3 bg-slate-100 text-slate-700 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CMS & Booking Page Section */}
      <section className="py-20 sm:py-28 bg-slate-100 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-1.5 mb-6">
                <Sparkles className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Grow Your Business</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
                Custom Booking Pages That Convert
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Build beautiful, branded booking pages that turn visitors into patients. 
                No coding required — just drag, drop, and publish.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Custom Domains</h4>
                    <p className="text-sm text-slate-500">Use your own domain for a fully branded experience</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <Layout className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Drag & Drop CMS</h4>
                    <p className="text-sm text-slate-500">Build pages visually with our intuitive editor</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <Palette className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Full Customization</h4>
                    <p className="text-sm text-slate-500">Match your brand colors, fonts, and style</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Mobile Optimized</h4>
                    <p className="text-sm text-slate-500">Perfect experience on any device</p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white hover:bg-slate-800 transition-all"
                >
                  Build Your Booking Page
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Right - Mockup */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Browser Chrome */}
                <div className="bg-slate-100 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-lg px-3 py-1 text-sm text-slate-500 text-center">
                    yourclinic.aliice.com/book
                  </div>
                </div>
                
                {/* Page Content Preview */}
                <div className="p-6 bg-gradient-to-b from-sky-50 to-white">
                  <div className="text-center mb-6">
                    <div className="h-12 w-12 rounded-full bg-sky-600 mx-auto mb-3 flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Book Your Appointment</h3>
                    <p className="text-sm text-slate-500">Select a service and time that works for you</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-4 border border-slate-100 hover:border-sky-200 cursor-pointer transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">Consultation</div>
                          <div className="text-sm text-slate-500">30 min • $150</div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-100 hover:border-sky-200 cursor-pointer transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">Follow-up Visit</div>
                          <div className="text-sm text-slate-500">15 min • $75</div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                    <div className="bg-sky-600 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Treatment Session</div>
                          <div className="text-sm text-sky-100">60 min • $300</div>
                        </div>
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats Badge */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">+40%</div>
                    <div className="text-xs text-slate-500">More bookings</div>
                  </div>
                </div>
              </div>
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
              <div className="bg-slate-800 rounded-2xl p-6 text-left border border-slate-700">
                <div className="text-slate-400 text-sm font-medium mb-2">Starter</div>
                <div className="text-3xl font-bold text-white">$1,490<span className="text-lg text-slate-500">/mo</span></div>
                <div className="text-sm text-slate-400 mt-1">Essential CRM & Booking</div>
              </div>
              <div className="bg-white rounded-2xl p-6 text-left scale-105 shadow-xl">
                <div className="text-slate-500 text-sm font-medium mb-2">Professional</div>
                <div className="text-3xl font-bold text-slate-900">$2,240<span className="text-lg text-slate-400">/mo</span></div>
                <div className="text-sm text-slate-600 mt-1">Full CRM + ERP + Booking</div>
                <div className="mt-3 text-xs bg-slate-900 text-white rounded-full px-3 py-1 inline-block">Most Popular</div>
              </div>
              <div className="bg-slate-800 rounded-2xl p-6 text-left border border-slate-700">
                <div className="text-slate-400 text-sm font-medium mb-2">Enterprise</div>
                <div className="text-3xl font-bold text-white">$3,200<span className="text-lg text-slate-500">/mo</span></div>
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
                <li><Link href="/blog" className="hover:text-slate-900">Blog</Link></li>
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
