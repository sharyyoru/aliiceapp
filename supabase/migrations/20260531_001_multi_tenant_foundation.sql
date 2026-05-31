-- ============================================
-- ALiice Multi-Tenant Foundation Schema
-- HubSpot-style B2B SaaS Architecture
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ORGANIZATIONS (CLINICS) TABLE
-- ============================================
-- This is the top-level tenant entity. All data in the system
-- will be scoped to an organization.

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- URL-friendly identifier (e.g., "clinic-zurich")
  
  -- Contact & Location
  email TEXT,
  phone TEXT,
  website TEXT,
  street_address TEXT,
  street_number TEXT,
  postal_code TEXT,
  city TEXT,
  canton TEXT,
  country TEXT DEFAULT 'Switzerland',
  
  -- Swiss Medical Identifiers
  gln TEXT, -- Global Location Number
  zsr TEXT, -- Zahlstellenregister number
  uid TEXT, -- Swiss company UID (e.g., CHE-123.456.789)
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0ea5e9', -- Brand color
  
  -- Subscription & Billing
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')) DEFAULT 'free',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')) DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Settings (JSON for flexibility)
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Owner reference (set after first member is created)
  owner_user_id UUID
);

-- Indexes for organizations
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_owner_idx ON organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS organizations_subscription_idx ON organizations(subscription_tier, subscription_status);

-- ============================================
-- 2. ORGANIZATION MEMBER ROLES ENUM
-- ============================================

DO $$ BEGIN
  CREATE TYPE organization_role AS ENUM (
    'owner',        -- Full control, can delete org
    'admin',        -- Can manage members, settings, billing
    'doctor',       -- Medical professional, can see all patients
    'staff',        -- Support staff, limited patient access
    'receptionist', -- Front desk, can manage appointments
    'billing'       -- Financial access only
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. ORGANIZATION MEMBERS (USER-ORG LINK)
-- ============================================
-- Links users to organizations with role-based access

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role & Permissions
  role organization_role NOT NULL DEFAULT 'staff',
  
  -- Custom permissions (override role defaults if needed)
  permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Member info within org context
  job_title TEXT,
  department TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique user per organization
  UNIQUE(organization_id, user_id)
);

-- Indexes for organization_members
CREATE INDEX IF NOT EXISTS org_members_org_idx ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS org_members_user_idx ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS org_members_role_idx ON organization_members(organization_id, role);
CREATE INDEX IF NOT EXISTS org_members_active_idx ON organization_members(organization_id, is_active) WHERE is_active = true;

-- ============================================
-- 4. ORGANIZATION INVITATIONS
-- ============================================
-- Email-based invitation flow for team members

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM (
    'pending',   -- Sent, awaiting acceptance
    'accepted',  -- User accepted and joined
    'declined',  -- User declined
    'expired',   -- Past expiration date
    'revoked'    -- Admin cancelled
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Invitation details
  email TEXT NOT NULL,
  role organization_role NOT NULL DEFAULT 'staff',
  
  -- Secure token for invitation link
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Status tracking
  status invitation_status NOT NULL DEFAULT 'pending',
  
  -- Custom message from inviter
  personal_message TEXT,
  
  -- Expiration (7 days by default)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Tracking timestamps
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  accepted_by_user_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for invitations
CREATE INDEX IF NOT EXISTS org_invitations_org_idx ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS org_invitations_email_idx ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS org_invitations_token_idx ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS org_invitations_status_idx ON organization_invitations(organization_id, status);

-- ============================================
-- 5. UPDATE USERS TABLE FOR MULTI-TENANCY
-- ============================================
-- Add columns to track user's current/default organization

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Zurich';

-- Index for current organization
CREATE INDEX IF NOT EXISTS users_current_org_idx ON users(current_organization_id);

-- ============================================
-- 6. ORGANIZATION SETTINGS TABLE
-- ============================================
-- Detailed settings per organization

CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Appointment settings
  appointment_slot_duration INTEGER DEFAULT 30, -- minutes
  appointment_buffer_time INTEGER DEFAULT 0, -- minutes between appointments
  working_hours_start TIME DEFAULT '08:00',
  working_hours_end TIME DEFAULT '18:00',
  working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Monday, 7=Sunday
  
  -- Notification settings
  email_notifications_enabled BOOLEAN DEFAULT true,
  sms_notifications_enabled BOOLEAN DEFAULT false,
  whatsapp_notifications_enabled BOOLEAN DEFAULT false,
  
  -- Localization
  default_language TEXT DEFAULT 'en',
  supported_languages TEXT[] DEFAULT ARRAY['en', 'fr', 'de'],
  date_format TEXT DEFAULT 'DD.MM.YYYY',
  currency TEXT DEFAULT 'CHF',
  
  -- Medical/Billing
  default_billing_type TEXT CHECK (default_billing_type IN ('TG', 'TP')) DEFAULT 'TG',
  vat_number TEXT,
  vat_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Integration settings (encrypted secrets stored elsewhere)
  medidata_enabled BOOLEAN DEFAULT false,
  stripe_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. AUDIT LOG FOR ORGANIZATION ACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS organization_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Action details
  action TEXT NOT NULL, -- e.g., 'member.invited', 'settings.updated', 'patient.created'
  entity_type TEXT, -- e.g., 'member', 'patient', 'appointment'
  entity_id UUID,
  
  -- Before/after state for detailed auditing
  old_data JSONB,
  new_data JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS org_audit_log_org_idx ON organization_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS org_audit_log_user_idx ON organization_audit_log(user_id);
CREATE INDEX IF NOT EXISTS org_audit_log_action_idx ON organization_audit_log(organization_id, action);
CREATE INDEX IF NOT EXISTS org_audit_log_entity_idx ON organization_audit_log(organization_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS org_audit_log_created_idx ON organization_audit_log(organization_id, created_at DESC);

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to get current user's active organization memberships
CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id UUID)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT,
  role organization_role,
  is_owner BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    om.role,
    (o.owner_user_id = p_user_id)
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = p_user_id
    AND om.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role in organization
CREATE OR REPLACE FUNCTION user_has_role(
  p_user_id UUID,
  p_organization_id UUID,
  p_roles organization_role[]
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_organization_id
      AND role = ANY(p_roles)
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or owner
CREATE OR REPLACE FUNCTION user_is_org_admin(
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_has_role(p_user_id, p_organization_id, ARRAY['owner', 'admin']::organization_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION accept_organization_invitation(
  p_token UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_invitation organization_invitations%ROWTYPE;
  v_member_id UUID;
BEGIN
  -- Find and validate invitation
  SELECT * INTO v_invitation
  FROM organization_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
    
  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- Create organization member
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role
  ) VALUES (
    v_invitation.organization_id,
    p_user_id,
    v_invitation.role
  )
  RETURNING id INTO v_member_id;
  
  -- Update invitation status
  UPDATE organization_invitations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by_user_id = p_user_id,
    updated_at = NOW()
  WHERE id = v_invitation.id;
  
  -- Set user's current organization if not set
  UPDATE users
  SET current_organization_id = v_invitation.organization_id
  WHERE id = p_user_id
    AND current_organization_id IS NULL;
  
  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create organization with owner
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_owner_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Create organization
  INSERT INTO organizations (name, slug, owner_user_id)
  VALUES (p_name, p_slug, p_owner_user_id)
  RETURNING id INTO v_org_id;
  
  -- Create owner as member
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role
  ) VALUES (
    v_org_id,
    p_owner_user_id,
    'owner'
  );
  
  -- Create default settings
  INSERT INTO organization_settings (organization_id)
  VALUES (v_org_id);
  
  -- Set user's current organization
  UPDATE users
  SET 
    current_organization_id = v_org_id,
    onboarding_completed = true
  WHERE id = p_owner_user_id;
  
  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. TRIGGERS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to organization_members
DROP TRIGGER IF EXISTS update_org_members_updated_at ON organization_members;
CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to organization_invitations
DROP TRIGGER IF EXISTS update_org_invitations_updated_at ON organization_invitations;
CREATE TRIGGER update_org_invitations_updated_at
  BEFORE UPDATE ON organization_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to organization_settings
DROP TRIGGER IF EXISTS update_org_settings_updated_at ON organization_settings;
CREATE TRIGGER update_org_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
