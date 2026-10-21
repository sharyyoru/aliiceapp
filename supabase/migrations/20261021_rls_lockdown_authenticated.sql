-- ============================================================================
-- SECURITY LOCKDOWN: scope authenticated access to organization members
-- ============================================================================
-- Fixes confirmed vulnerability (2026-10-10): any self-registered account
-- previously had full read access to every table (patients, appointments,
-- invoices, emails, users).
--
-- After this migration:
--   * `authenticated` role can only touch tables if the account is an ACTIVE
--     member of an organization (organization_members.is_active = true).
--     Staff membership was already populated for the Maison TOA org.
--   * `anon` role keeps ONLY: SELECT on booking_doctors (public booking flow).
--   * A few narrowly-scoped exceptions keep the invite / org-creation flows
--     working for authenticated non-members.
--   * The service_role key (all /api routes) bypasses RLS entirely — unchanged.
--
-- RUN IN: Supabase Dashboard -> SQL Editor for project mwtdhbllkzuryswrumrd
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helpers
-- ---------------------------------------------------------------------------

-- True when the current auth user is an active member of ANY organization.
CREATE OR REPLACE FUNCTION public.is_staff_member()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = auth.uid()
      AND is_active = true
  );
$$;

-- Email of the current auth user (for invite scoping).
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT lower(email) FROM auth.users WHERE id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 2. Drop every existing RLS policy in the public schema
-- ---------------------------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Enable RLS on every public table + staff-only policy
-- ---------------------------------------------------------------------------
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format(
      'CREATE POLICY staff_all ON public.%I FOR ALL TO authenticated
       USING (public.is_staff_member())
       WITH CHECK (public.is_staff_member())',
      t.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Narrow exceptions for authenticated NON-members (sign-up / invite flows)
-- ---------------------------------------------------------------------------

-- users: everyone can read/update/insert their own row
CREATE POLICY users_self_select ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY users_self_update ON public.users
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY users_self_insert ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- organization_invitations: an invited person can read invitations addressed
-- to their own email (needed by /invite/[token] before they become a member)
CREATE POLICY invitations_self_email ON public.organization_invitations
  FOR SELECT TO authenticated
  USING (lower(email) = public.current_user_email());

-- organizations: invitees need the org name/logo shown on the invite page;
-- any authenticated user may create an organization (sign-up flow)
CREATE POLICY organizations_invitee_select ON public.organizations
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.organization_invitations
      WHERE lower(email) = public.current_user_email()
    )
  );
CREATE POLICY organizations_auth_insert ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (true);

-- organization_members: a new user can add THEMSELVES (org creation / invite
-- acceptance via security-definer RPC bypasses RLS anyway)
CREATE POLICY members_self_insert ON public.organization_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY members_self_select ON public.organization_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- organization_settings + deal_stages: created during org onboarding
CREATE POLICY settings_auth_insert ON public.organization_settings
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY deal_stages_auth_insert ON public.deal_stages
  FOR INSERT TO authenticated WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 4b. Views must run as the invoker (otherwise they bypass RLS entirely)
-- ---------------------------------------------------------------------------
DO $$
DECLARE v record;
BEGIN
  FOR v IN SELECT viewname FROM pg_views WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v.viewname);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'security_invoker not supported on this Postgres version — review views manually';
END $$;

-- Deny anonymous EXECUTE on all public functions (RPC data leak prevention).
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon', f.proname, f.args);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Anonymous (public) access — only what public pages need
-- ---------------------------------------------------------------------------
-- Public booking pages read the doctor catalogue directly.
CREATE POLICY booking_doctors_anon_select ON public.booking_doctors
  FOR SELECT TO anon USING (true);
CREATE POLICY booking_doctors_auth_select ON public.booking_doctors
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 6. Storage: staff only (patient photos upload is proxied via API route)
-- ---------------------------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY staff_storage_all ON storage.objects
  FOR ALL TO authenticated
  USING (public.is_staff_member())
  WITH CHECK (public.is_staff_member());
