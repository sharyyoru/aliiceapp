"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import type {
  Organization,
  OrganizationMember,
  OrganizationRole,
  OrganizationSettings,
} from "@/types/organization";
import { hasPermission } from "@/types/organization";

interface OrganizationContextValue {
  // Current organization
  organization: Organization | null;
  organizationId: string | null;
  
  // User's membership in current org
  membership: OrganizationMember | null;
  role: OrganizationRole | null;
  
  // All organizations user belongs to
  organizations: Organization[];
  
  // Settings for current org
  settings: OrganizationSettings | null;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganization: () => Promise<void>;
  
  // Permission helpers
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isOwner: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch all organizations the user belongs to
  const fetchOrganizations = useCallback(async (userId: string) => {
    const { data, error } = await supabaseClient
      .from("organization_members")
      .select(`
        organization_id,
        role,
        organizations (
          id,
          name,
          slug,
          logo_url,
          subscription_tier,
          subscription_status
        )
      `)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching organizations:", error);
      return [];
    }

    return (data || []).map((m: { organizations: unknown }) => m.organizations as Organization);
  }, []);

  // Fetch current organization details
  const fetchOrganizationDetails = useCallback(async (orgId: string, userId: string) => {
    // Fetch organization
    const { data: orgData, error: orgError } = await supabaseClient
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
      return null;
    }

    // Fetch membership
    const { data: memberData, error: memberError } = await supabaseClient
      .from("organization_members")
      .select("*")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (memberError) {
      console.error("Error fetching membership:", memberError);
      return null;
    }

    // Fetch settings
    const { data: settingsData } = await supabaseClient
      .from("organization_settings")
      .select("*")
      .eq("organization_id", orgId)
      .single();

    return {
      organization: orgData as Organization,
      membership: memberData as OrganizationMember,
      settings: settingsData as OrganizationSettings | null,
    };
  }, []);

  // Initialize organization context
  const initialize = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        setOrganization(null);
        setMembership(null);
        setOrganizations([]);
        setSettings(null);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      // Fetch user's current organization from users table
      const { data: userData } = await supabaseClient
        .from("users")
        .select("current_organization_id")
        .eq("id", user.id)
        .single();

      // Fetch all organizations
      const orgs = await fetchOrganizations(user.id);
      setOrganizations(orgs);

      // Determine which org to load
      let currentOrgId = userData?.current_organization_id;
      
      // If no current org set but user has orgs, use first one
      if (!currentOrgId && orgs.length > 0) {
        currentOrgId = orgs[0].id;
        // Update user's current org
        await supabaseClient
          .from("users")
          .update({ current_organization_id: currentOrgId })
          .eq("id", user.id);
      }

      if (currentOrgId) {
        const details = await fetchOrganizationDetails(currentOrgId, user.id);
        if (details) {
          setOrganization(details.organization);
          setMembership(details.membership);
          setSettings(details.settings);
        }
      }
    } catch (error) {
      console.error("Error initializing organization context:", error);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, [fetchOrganizations, fetchOrganizationDetails]);

  // Switch to a different organization
  const switchOrganization = useCallback(async (orgId: string) => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Update user's current organization
      await supabaseClient
        .from("users")
        .update({ current_organization_id: orgId })
        .eq("id", user.id);

      // Fetch new organization details
      const details = await fetchOrganizationDetails(orgId, user.id);
      if (details) {
        setOrganization(details.organization);
        setMembership(details.membership);
        setSettings(details.settings);
      }
    } catch (error) {
      console.error("Error switching organization:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrganizationDetails]);

  // Refresh current organization data
  const refreshOrganization = useCallback(async () => {
    if (!organization) return;

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const details = await fetchOrganizationDetails(organization.id, user.id);
      if (details) {
        setOrganization(details.organization);
        setMembership(details.membership);
        setSettings(details.settings);
      }

      // Also refresh organizations list
      const orgs = await fetchOrganizations(user.id);
      setOrganizations(orgs);
    } catch (error) {
      console.error("Error refreshing organization:", error);
    }
  }, [organization, fetchOrganizationDetails, fetchOrganizations]);

  // Initialize on mount
  useEffect(() => {
    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event: string) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          initialize();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialize]);

  // Computed values
  const role = membership?.role ?? null;
  const isAdmin = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  const checkPermission = useCallback(
    (permission: string): boolean => {
      if (!role) return false;
      return hasPermission(role, permission);
    },
    [role]
  );

  const value: OrganizationContextValue = {
    organization,
    organizationId: organization?.id ?? null,
    membership,
    role,
    organizations,
    settings,
    isLoading,
    isInitialized,
    switchOrganization,
    refreshOrganization,
    hasPermission: checkPermission,
    isAdmin,
    isOwner,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}

// Hook to require organization context (redirects if not set)
export function useRequireOrganization() {
  const context = useOrganization();
  
  if (context.isInitialized && !context.organization && !context.isLoading) {
    // User is logged in but has no organization - needs onboarding
    if (typeof window !== "undefined") {
      window.location.href = "/onboarding/create-clinic";
    }
  }
  
  return context;
}
