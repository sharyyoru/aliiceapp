"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, User, Mail, Phone, Building2 } from "lucide-react";

type Lang = "en" | "fr";

const COPY: Record<Lang, {
  heading: string;
  sub: string;
  name: string;
  namePlaceholder: string;
  email: string;
  mobile: string;
  company: string;
  companyPlaceholder: string;
  submit: string;
  submitting: string;
  fillAll: string;
  invalidEmail: string;
  genericError: string;
  successTitle: string;
  successBody: (name: string, email: string, company: string) => string;
  backHome: string;
  haveAccount: string;
  signIn: string;
  terms: string;
  tos: string;
  privacy: string;
  and: string;
}> = {
  en: {
    heading: "Request a demo",
    sub: "Tell us about yourself and we'll get your clinic set up.",
    name: "Name",
    namePlaceholder: "Dr. John Smith",
    email: "Email",
    mobile: "Mobile",
    company: "Company Name",
    companyPlaceholder: "Acme Clinic",
    submit: "Get Started",
    submitting: "Submitting...",
    fillAll: "Please fill in all fields.",
    invalidEmail: "Please enter a valid email address.",
    genericError: "Something went wrong. Please try again.",
    successTitle: "You're on the list!",
    successBody: (name, email, company) =>
      `Thanks, ${name}. Our team will reach out to ${email} shortly to get ${company} set up on Aliice.`,
    backHome: "Back to Home",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    terms: "By signing up, you agree to our",
    tos: "Terms of Service",
    privacy: "Privacy Policy",
    and: "and",
  },
  fr: {
    heading: "Démarrez votre essai gratuit",
    sub: "Parlez-nous de vous et nous configurerons votre clinique.",
    name: "Nom",
    namePlaceholder: "Dr Jean Dupont",
    email: "E-mail",
    mobile: "Téléphone",
    company: "Nom de l'établissement",
    companyPlaceholder: "Clinique Acme",
    submit: "Commencer",
    submitting: "Envoi en cours...",
    fillAll: "Veuillez remplir tous les champs.",
    invalidEmail: "Veuillez saisir une adresse e-mail valide.",
    genericError: "Une erreur s'est produite. Veuillez réessayer.",
    successTitle: "Votre demande est enregistrée !",
    successBody: (name, email, company) =>
      `Merci, ${name}. Notre équipe contactera ${email} prochainement pour configurer ${company} sur Aliice.`,
    backHome: "Retour à l'accueil",
    haveAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter",
    terms: "En vous inscrivant, vous acceptez nos",
    tos: "Conditions d'utilisation",
    privacy: "Politique de confidentialité",
    and: "et",
  },
};

export default function SignupPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const t = COPY[lang];

  // Determine initial language from ?lang= (e.g. QR code links) or the browser.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = (params.get("lang") || "").toLowerCase();
      if (q.startsWith("fr")) {
        setLang("fr");
      } else if (q.startsWith("en")) {
        setLang("en");
      } else if ((navigator.language || "").toLowerCase().startsWith("fr")) {
        setLang("fr");
      }
    } catch {
      // default en
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !mobile.trim() || !companyName.trim()) {
      setError(t.fillAll);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(t.invalidEmail);
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
          preferred_language: lang,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.genericError);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Signup error:", err);
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo + language switch */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logos/aliice-logo.png"
              alt="ALiice"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center rounded-full border border-slate-200 bg-white/80 p-0.5 text-xs font-semibold shadow-sm">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded-full px-3 py-1 transition ${
                lang === "en" ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("fr")}
              className={`rounded-full px-3 py-1 transition ${
                lang === "fr" ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              FR
            </button>
          </div>
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
                {t.successTitle}
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                {t.successBody(name, email, companyName)}
              </p>
              <Link
                href="/"
                className="text-sm font-medium text-sky-600 hover:text-sky-700"
              >
                {t.backHome}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-lg font-semibold text-slate-900">
                  {t.heading}
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  {t.sub}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    {t.name}
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.namePlaceholder}
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
                    {t.email}
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
                    {t.mobile}
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
                    {t.company}
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t.companyPlaceholder}
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
                      {t.submitting}
                    </>
                  ) : (
                    t.submit
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  {t.haveAccount}{" "}
                  <Link
                    href="/login"
                    className="font-medium text-sky-600 hover:text-sky-700"
                  >
                    {t.signIn}
                  </Link>
                </p>
              </div>

              <p className="mt-4 text-center text-[10px] text-slate-400">
                {t.terms}{" "}
                <Link href="/terms" className="underline hover:text-slate-600">
                  {t.tos}
                </Link>{" "}
                {t.and}{" "}
                <Link href="/privacy" className="underline hover:text-slate-600">
                  {t.privacy}
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
