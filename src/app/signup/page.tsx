"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, User, Mail, Phone, Building2 } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !mobile.trim() || !companyName.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/public/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          company_name: companyName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Image
              src="/logos/aliice-logo.png"
              alt="ALiice"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-[0_22px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                You&apos;re on the list!
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Thanks, <strong>{name}</strong>. Our team will reach out to{" "}
                <strong>{email}</strong> shortly to get{" "}
                <strong>{companyName}</strong> set up on Aliice.
              </p>
              <Link
                href="/"
                className="text-sm font-medium text-sky-600 hover:text-sky-700"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-lg font-semibold text-slate-900">
                  Start your free trial
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Tell us about yourself and we&apos;ll get your clinic set up.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. John Smith"
                      required
                      disabled={loading}
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={loading}
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="mobile"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Mobile
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+971 00 000 0000"
                      required
                      disabled={loading}
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Clinic"
                      required
                      disabled={loading}
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Get Started"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-sky-600 hover:text-sky-700"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <p className="mt-4 text-center text-[10px] text-slate-400">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-slate-600">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-slate-600">
                  Privacy Policy
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
