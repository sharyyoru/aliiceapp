"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const inviteEmail = searchParams.get("email");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(inviteEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Determine the redirect URL based on environment
      const baseUrl = typeof window !== "undefined" 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || "https://aliiceapp.vercel.app";
      
      // Create user account
      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: inviteToken 
            ? `${baseUrl}/invite/${inviteToken}` 
            : `${baseUrl}/dashboard`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create user profile in users table
        await supabaseClient.from("users").upsert({
          id: data.user.id,
          email: email.trim(),
          full_name: fullName.trim(),
          role: "staff",
        });

        // If there's an invite token, redirect to accept it
        if (inviteToken) {
          router.replace(`/invite/${inviteToken}`);
        } else {
          setSuccess(true);
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
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
                Check Your Email
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                Please check your inbox and click the link to verify your account.
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-sky-600 hover:text-sky-700"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-lg font-semibold text-slate-900">
                  Create Your Account
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  {inviteToken
                    ? "Complete your registration to join the clinic."
                    : "Sign up to start managing your clinic."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. John Smith"
                    required
                    disabled={loading}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading || !!inviteEmail}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    disabled={loading}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    disabled={loading}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
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
