"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface UseOrganizationResult {
  organization: Organization | null;
  loading: boolean;
  hasOrganization: boolean;
}

// Pages that don't require organization
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/accept-invitation",
];

export function useOrganization(): UseOrganizationResult {
  const router = useRouter();
  const pathname = usePathname();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOrganization() {
      // Skip check for public paths
      if (PUBLIC_PATHS.some(path => pathname?.startsWith(path))) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Check if user is a member of any organization
        const { data: memberships, error } = await supabaseClient
          .from("organization_members")
          .select(`
            organization_id,
            organizations (
              id,
              name,
              slug
            )
          `)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1);

        if (error) {
          console.error("Error checking organization:", error);
          setLoading(false);
          return;
        }

        if (!memberships || memberships.length === 0) {
          // User has no organization - redirect to onboarding
          router.replace("/onboarding");
          return;
        }

        // User has an organization
        const org = memberships[0].organizations as unknown as Organization;
        setOrganization(org);
        setLoading(false);

      } catch (err) {
        console.error("Organization check error:", err);
        setLoading(false);
      }
    }

    checkOrganization();
  }, [pathname, router]);

  return {
    organization,
    loading,
    hasOrganization: !!organization,
  };
}
