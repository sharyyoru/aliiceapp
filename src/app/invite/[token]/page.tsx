"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import type { OrganizationInvitation } from "@/types/organization";
import { getRoleDisplayName } from "@/types/organization";
import { UserPlus, Building2, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

type InvitationState = "loading" | "valid" | "expired" | "already_used" | "error";

export default function InvitationPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<InvitationState>("loading");
  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check auth status and fetch invitation
  useEffect(() => {
    async function checkInvitation() {
      try {
        // Check if user is logged in
        const { data: { user } } = await supabaseClient.auth.getUser();
        setIsLoggedIn(!!user);
        setUserEmail(user?.email || null);

        // Fetch invitation by token
        const { data, error: fetchError } = await supabaseClient
          .from("organization_invitations")
          .select(`
            *,
            organizations (
              name,
              logo_url
            ),
            users!organization_invitations_invited_by_user_id_fkey (
              full_name,
              email
            )
          `)
          .eq("token", token)
          .single();

        if (fetchError || !data) {
          setState("error");
          setError("Invitation not found");
          return;
        }

        const inv = data as unknown as OrganizationInvitation & {
          organizations: { name: string; logo_url?: string };
          users: { full_name?: string; email: string };
        };

        // Check status
        if (inv.status === "accepted") {
          setState("already_used");
          return;
        }

        if (inv.status !== "pending") {
          setState("expired");
          return;
        }

        // Check expiration
        if (new Date(inv.expires_at) < new Date()) {
          setState("expired");
          return;
        }

        // Transform to proper shape
        setInvitation({
          ...inv,
          organization: inv.organizations,
          invited_by: inv.users,
        });
        setState("valid");
      } catch (err) {
        console.error("Error checking invitation:", err);
        setState("error");
        setError("Failed to load invitation");
      }
    }

    checkInvitation();
  }, [token]);

  // Accept invitation
  async function handleAccept() {
    if (!invitation) return;

    setAccepting(true);
    setError(null);

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) {
        // Redirect to signup/login with return URL
        router.push(`/register?invite=${token}&email=${encodeURIComponent(invitation.email)}`);
        return;
      }

      // Accept invitation via RPC function
      const { error: acceptError } = await supabaseClient
        .rpc("accept_organization_invitation", {
          p_token: token,
          p_user_id: user.id,
        });

      if (acceptError) {
        setError(acceptError.message || "Failed to accept invitation");
        setAccepting(false);
        return;
      }

      // Success - redirect to dashboard
      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError("An unexpected error occurred");
      setAccepting(false);
    }
  }

  // Render based on state
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-600" />
          <p className="mt-4 text-sm text-slate-500">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            Invalid Invitation
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {error || "This invitation link is not valid."}
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            Invitation Expired
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This invitation has expired. Please ask the administrator to send a new one.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (state === "already_used") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            Already Accepted
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This invitation has already been used.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Valid invitation
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
            <UserPlus className="h-8 w-8 text-sky-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            You&apos;re Invited!
          </h1>
        </div>

        {/* Invitation Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          {/* Organization Info */}
          <div className="mb-6 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              {invitation?.organization?.logo_url ? (
                <img
                  src={invitation.organization.logo_url}
                  alt={invitation.organization.name}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                {invitation?.organization?.name}
              </h2>
              <p className="text-sm text-slate-500">
                Invited as {getRoleDisplayName(invitation?.role || "staff")}
              </p>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="mb-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Invited by</span>
              <span className="font-medium text-slate-900">
                {invitation?.invited_by?.full_name || invitation?.invited_by?.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-900">
                {invitation?.email}
              </span>
            </div>
          </div>

          {/* Personal Message */}
          {invitation?.personal_message && (
            <div className="mb-6 rounded-lg bg-sky-50 p-4">
              <p className="text-sm italic text-slate-600">
                &ldquo;{invitation.personal_message}&rdquo;
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : isLoggedIn ? (
                "Accept Invitation"
              ) : (
                "Sign Up to Accept"
              )}
            </button>

            {isLoggedIn && userEmail !== invitation?.email && (
              <p className="text-center text-xs text-amber-600">
                Note: You&apos;re logged in as {userEmail}. The invitation was sent to {invitation?.email}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
