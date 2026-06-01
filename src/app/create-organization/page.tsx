"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabaseClient";
import { Loader2, Building2, CheckCircle } from "lucide-react";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [step, setStep] = useState<"org" | "complete">("org");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setOrgName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
    setOrgSlug(slug);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!orgName.trim()) {
      setError("Organization name is required");
      return;
    }

    if (!orgSlug.trim()) {
      setError("Organization URL is required");
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        setError("You must be logged in");
        setLoading(false);
        return;
      }

      // Create organization
      const { data: org, error: orgError } = await supabaseClient
        .from("organizations")
        .insert({
          name: orgName.trim(),
          slug: orgSlug.trim(),
          owner_user_id: user.id,
        })
        .select()
        .single();

      if (orgError) {
        if (orgError.message.includes("duplicate") || orgError.message.includes("unique")) {
          setError("This organization URL is already taken. Please choose another.");
        } else {
          setError(orgError.message);
        }
        setLoading(false);
        return;
      }

      // Add user as owner in organization_members
      const { error: memberError } = await supabaseClient
        .from("organization_members")
        .insert({
          user_id: user.id,
          organization_id: org.id,
          role: "owner",
          is_active: true,
        });

      if (memberError) {
        console.error("Member error:", memberError);
        // Organization was created, continue anyway
      }

      // Update user's current organization
      await supabaseClient
        .from("users")
        .update({ current_organization_id: org.id })
        .eq("id", user.id);

      // Create default organization settings
      await supabaseClient
        .from("organization_settings")
        .insert({
          organization_id: org.id,
          settings: {
            timezone: "Europe/Zurich",
            currency: "CHF",
            language: "en",
          },
        });

      setStep("complete");
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);

    } catch (err) {
      console.error("Organization creation error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logos/aliice-logo.png"
            alt="ALiice"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-[0_22px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          {step === "complete" ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Welcome to Aliice!
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Your organization <strong>{orgName}</strong> has been created.
              </p>
              <p className="text-xs text-slate-500">
                Redirecting to your dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
                  <Building2 className="h-7 w-7 text-sky-600" />
                </div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Create Your Organization
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Set up your clinic or practice to get started with Aliice.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="orgName"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Organization Name
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    value={orgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Sunset Aesthetics Clinic"
                    required
                    disabled={loading}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="orgSlug"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Organization URL
                  </label>
                  <div className="flex items-center gap-0">
                    <span className="rounded-l-lg border border-r-0 border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500">
                      aliice.app/
                    </span>
                    <input
                      id="orgSlug"
                      type="text"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="your-clinic"
                      required
                      disabled={loading}
                      className="block w-full rounded-r-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    This will be your unique booking page URL
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4" />
                      Create Organization
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Need help? Contact us at{" "}
          <a href="mailto:support@aliice.app" className="text-sky-600 hover:underline">
            support@aliice.app
          </a>
        </p>
      </div>
    </div>
  );
}
