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
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Patient Management",
    description:
      "Comprehensive patient records, medical history, and treatment tracking all in one place.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Intelligent appointment booking with automated reminders and calendar sync.",
  },
  {
    icon: FileText,
    title: "Medical Documentation",
    description:
      "Digital forms, prescriptions, and clinical notes with secure storage.",
  },
  {
    icon: CreditCard,
    title: "Billing & Invoicing",
    description:
      "Swiss billing standards support including TarMed, and insurance integrations.",
  },
  {
    icon: MessageSquare,
    title: "Patient Communication",
    description:
      "Email, SMS, and WhatsApp messaging for seamless patient engagement.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description:
      "Real-time insights into clinic performance, revenue, and patient flow.",
  },
];

const benefits = [
  {
    icon: Building2,
    title: "Multi-Clinic Support",
    description: "Manage multiple clinic locations from a single dashboard.",
  },
  {
    icon: Shield,
    title: "Swiss Data Protection",
    description: "GDPR compliant with data hosted in Swiss data centers.",
  },
  {
    icon: UserPlus,
    title: "Team Collaboration",
    description: "Role-based access for doctors, staff, and administrators.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Cloud-based access from anywhere, anytime, any device.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/aliice-logo.png"
              alt="ALiice"
              width={100}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-sky-600/25 transition-all hover:bg-sky-700 hover:shadow-sky-600/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-50 via-white to-violet-50" />
        <div className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-gradient-to-l from-sky-100/50" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              The Complete{" "}
              <span className="bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
                Medical CRM
              </span>{" "}
              for Aesthetics Clinics
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Streamline your clinic operations with ALiice. From patient management
              to billing, scheduling to analytics — everything you need to run a
              successful aesthetics practice.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition-all hover:bg-sky-700 hover:shadow-sky-600/30"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need to Run Your Clinic
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Powerful features designed specifically for aesthetics and medical practices.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-sky-100 hover:shadow-lg hover:shadow-sky-100/50"
              >
                <div className="mb-4 inline-flex rounded-xl bg-sky-50 p-3 text-sky-600 transition-colors group-hover:bg-sky-100">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-slate-50 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Built for Swiss Healthcare
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Compliant, secure, and tailored for the Swiss medical industry.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-8 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="flex gap-4 rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex-shrink-0 rounded-xl bg-sky-50 p-3 text-sky-600">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-slate-900">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 to-sky-700 px-8 py-16 text-center shadow-2xl sm:px-16 sm:py-24">
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to Transform Your Clinic?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-sky-100">
                Join hundreds of clinics already using ALiice to streamline their operations
                and deliver better patient experiences.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-semibold text-sky-600 shadow-lg transition-all hover:bg-sky-50"
                >
                  <CheckCircle className="h-5 w-5" />
                  Start 14-Day Free Trial
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/20"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/logos/aliice-logo.png"
                alt="ALiice"
                width={80}
                height={26}
                className="h-6 w-auto"
              />
              <span className="text-sm text-slate-500">
                © {new Date().getFullYear()} ALiice. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-700">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-slate-700">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-slate-700">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
