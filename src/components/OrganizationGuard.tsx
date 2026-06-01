"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

// Pages that don't require organization
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/create-organization",
  "/accept-invitation",
  "/book", // Public booking pages
];

interface OrganizationGuardProps {
  children: React.ReactNode;
}

export default function OrganizationGuard({ children }: OrganizationGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [hasOrganization, setHasOrganization] = useState(false);

  useEffect(() => {
    async function checkOrganization() {
      // Skip check for public paths
      if (PUBLIC_PATHS.some(path => pathname?.startsWith(path))) {
        setChecking(false);
        setHasOrganization(true); // Allow access
        return;
      }

      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          // Not logged in - let middleware handle redirect to login
          setChecking(false);
          setHasOrganization(true);
          return;
        }

        // Check if user is a member of any organization
        const { data: memberships, error } = await supabaseClient
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1);

        if (error) {
          // If RLS error, user likely has no org access
          console.error("Error checking organization:", error);
          router.replace("/create-organization");
          return;
        }

        if (!memberships || memberships.length === 0) {
          // User has no organization - redirect to create organization
          router.replace("/create-organization");
          return;
        }

        // User has an organization
        setHasOrganization(true);
        setChecking(false);

      } catch (err) {
        console.error("Organization check error:", err);
        // On error, redirect to create organization
        router.replace("/create-organization");
      }
    }

    checkOrganization();
  }, [pathname, router]);

  // Show loading while checking
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Render children if has organization
  if (hasOrganization) {
    return <>{children}</>;
  }

  // Fallback loading (shouldn't reach here normally)
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
    </div>
  );
}
