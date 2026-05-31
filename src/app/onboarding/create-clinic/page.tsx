"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { generateSlug } from "@/types/organization";
import { Building2, ArrowRight, Loader2 } from "lucide-react";

export default function CreateClinicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  // Auto-generate slug from name unless manually edited
  const handleNameChange = (name: string) => {
    setClinicName(name);
    if (!slugEdited) {
      setSlug(generateSlug(name));
    }
  };

  const handleSlugChange = (newSlug: string) => {
    setSlug(generateSlug(newSlug));
    setSlugEdited(true);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    if (!clinicName.trim()) {
      setError("Please enter a clinic name");
      return;
    }

    if (!slug.trim()) {
      setError("Please enter a URL slug");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError || !user) {
        setError("You must be logged in to create a clinic");
        setLoading(false);
        return;
      }

      // Check if slug is available
      const { data: existingOrg } = await supabaseClient
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existingOrg) {
        setError("This URL is already taken. Please choose a different one.");
        setLoading(false);
        return;
      }

      // Create organization using the helper function
      const { data, error: createError } = await supabaseClient
        .rpc("create_organization_with_owner", {
          p_name: clinicName.trim(),
          p_slug: slug.trim(),
          p_owner_user_id: user.id,
        });

      if (createError) {
        console.error("Error creating organization:", createError);
        setError(createError.message || "Failed to create clinic. Please try again.");
        setLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
            <Building2 className="h-8 w-8 text-sky-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create Your Clinic
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Set up your clinic workspace to start managing patients and appointments
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Clinic Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="clinicName"
                className="block text-sm font-medium text-slate-700"
              >
                Clinic Name
              </label>
              <input
                id="clinicName"
                type="text"
                value={clinicName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Zurich Aesthetics Clinic"
                required
                className="block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-slate-700"
              >
                Clinic URL
              </label>
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/50 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/20">
                <span className="pl-4 text-sm text-slate-400">
                  aliice.app/
                </span>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="your-clinic"
                  required
                  className="block w-full rounded-r-lg border-0 bg-transparent px-1 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
              </div>
              <p className="text-xs text-slate-500">
                This will be your unique clinic URL for bookings and patient portals
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition-all hover:bg-sky-700 hover:shadow-sky-600/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Clinic...
                </>
              ) : (
                <>
                  Create Clinic
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          By creating a clinic, you agree to our{" "}
          <a href="/terms" className="text-sky-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-sky-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
