"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Clock,
  Shield,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setIsSuccess(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        subject: "General Inquiry",
        message: "",
      });
    } catch (err) {
      setError("Failed to send message. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-lg border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logos/aliice-logo.png" alt="Aliice" width={100} height={32} className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Login</Link>
            <Link href="/register" className="rounded-full bg-gradient-to-r from-sky-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left - Contact Info */}
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Get in Touch</h1>
              <p className="text-lg text-slate-600 mb-8">
                Have questions about Aliice? Want to schedule a demo? We&apos;re here to help.
              </p>

              {/* Contact Methods */}
              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Email Us</div>
                    <a href="mailto:sharyyoru@gmail.com" className="text-sky-600 hover:text-sky-700">
                      sharyyoru@gmail.com
                    </a>
                    <div className="text-sm text-slate-500 mt-1">We reply within 24 hours</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Live Chat</div>
                    <div className="text-slate-600">Available Mon-Fri, 9am-6pm CET</div>
                    <div className="text-sm text-slate-500 mt-1">Average response: 5 minutes</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Location</div>
                    <div className="text-slate-600">Switzerland</div>
                    <div className="text-sm text-slate-500 mt-1">Swiss data hosting & GDPR compliant</div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                  <Clock className="h-8 w-8 text-slate-400" />
                  <div>
                    <div className="font-semibold text-slate-900">24h Response</div>
                    <div className="text-sm text-slate-500">Guaranteed</div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                  <Shield className="h-8 w-8 text-slate-400" />
                  <div>
                    <div className="font-semibold text-slate-900">GDPR Compliant</div>
                    <div className="text-sm text-slate-500">Data Protection</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Contact Form */}
            <div className="bg-slate-50 rounded-3xl p-8">
              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                  <p className="text-slate-600 mb-6">
                    Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-sky-600 font-medium hover:text-sky-700"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                        placeholder="Your clinic name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                        placeholder="+41 XX XXX XX XX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all bg-white"
                    >
                      <option>General Inquiry</option>
                      <option>Request a Demo</option>
                      <option>Pricing Question</option>
                      <option>Technical Support</option>
                      <option>Partnership Opportunity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-violet-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-600/25 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    By submitting this form, you agree to our{" "}
                    <Link href="/privacy" className="text-sky-600 hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Image src="/logos/aliice-logo.png" alt="Aliice" width={80} height={26} className="h-6 w-auto" />
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/">Home</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
