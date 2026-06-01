-- ============================================
-- ALiice Database Setup Script
-- Run this in Supabase SQL Editor (all at once)
-- ============================================

-- ============================================
-- PART 1: BASE SCHEMA (from schema.sql)
-- ============================================

create extension if not exists "pgcrypto";

-- Users table linked to Supabase auth.users
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff',
  full_name text,
  email text,
  designation text,
  created_at timestamptz default now()
);

-- Patients
create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  gender text check (gender in ('male','female','other')),
  dob date,
  marital_status text,
  nationality text,
  street_address text,
  postal_code text,
  town text,
  profession text,
  current_employer text,
  source text check (source in ('manual','event','meta','google')) default 'manual',
  notes text,
  avatar_url text,
  language_preference text,
  clinic_preference text,
  lifecycle_stage text,
  contact_owner_name text,
  contact_owner_email text,
  street_number text,
  country text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  created_by_user_id uuid references users(id),
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists patients_email_idx on patients(email);
create index if not exists patients_last_name_idx on patients(last_name);

-- Patient insurance information
create table if not exists patient_insurances (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  provider_name text not null,
  card_number text not null,
  insurance_type text check (insurance_type in ('private','semi_private','basic')) not null,
  created_at timestamptz default now()
);

create index if not exists patient_insurances_patient_id_idx on patient_insurances(patient_id);

-- Providers (doctors, clinicians)
create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text,
  email text,
  phone text,
  gln text,
  zsr text,
  created_at timestamptz default now()
);

-- Appointment status enum
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'scheduled',
    'confirmed',
    'completed',
    'cancelled',
    'no_show'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Appointments
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  provider_id uuid references providers(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz,
  status appointment_status not null default 'scheduled',
  reason text,
  location text,
  source text check (source in ('manual','ai')) default 'manual',
  created_at timestamptz default now()
);

create index if not exists appointments_patient_id_idx on appointments(patient_id);
create index if not exists appointments_provider_id_idx on appointments(provider_id);
create index if not exists appointments_start_time_idx on appointments(start_time);

-- Deal stage type enum
DO $$ BEGIN
  CREATE TYPE deal_stage_type AS ENUM (
    'lead',
    'consultation',
    'surgery',
    'post_op',
    'follow_up',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Deal pipeline stages
create table if not exists deal_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type deal_stage_type not null default 'other',
  sort_order int not null,
  is_default boolean not null default false
);

-- Service categories
create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order int not null default 1,
  created_at timestamptz default now()
);

-- Services offered by the clinic
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references service_categories(id) on delete restrict,
  name text not null,
  description text,
  is_active boolean not null default true,
  base_price numeric(12,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists services_category_id_idx on services(category_id);

-- Deals (cases / opportunities)
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  stage_id uuid not null references deal_stages(id),
  service_id uuid references services(id) on delete set null,
  pipeline text,
  contact_label text,
  location text,
  title text,
  value numeric(12,2),
  notes text,
  owner_id uuid references users(id) on delete set null,
  owner_name text,
  service_interest text,
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists deals_patient_id_idx on deals(patient_id);
create index if not exists deals_stage_id_idx on deals(stage_id);
create index if not exists deals_owner_id_idx on deals(owner_id);

-- Workflow trigger type enum
DO $$ BEGIN
  CREATE TYPE workflow_trigger_type AS ENUM (
    'deal_stage_changed',
    'patient_created',
    'appointment_created',
    'appointment_completed',
    'appointment_updated',
    'form_submitted',
    'task_completed',
    'manual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Workflows
create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_type workflow_trigger_type not null,
  active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Workflow action type enum
DO $$ BEGIN
  CREATE TYPE workflow_action_type AS ENUM (
    'draft_email_patient',
    'draft_email_insurance',
    'generate_postop_doc'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Workflow actions
create table if not exists workflow_actions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  action_type workflow_action_type not null,
  config jsonb not null default '{}'::jsonb,
  sort_order int not null default 1
);

create index if not exists workflow_actions_workflow_id_idx on workflow_actions(workflow_id);

-- Email template type enum
DO $$ BEGIN
  CREATE TYPE email_template_type AS ENUM (
    'patient',
    'insurance',
    'post_op'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Email templates
create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type email_template_type not null,
  subject_template text not null,
  body_template text not null,
  created_at timestamptz default now()
);

-- Email status and direction enums
DO $$ BEGIN
  CREATE TYPE email_status AS ENUM (
    'draft',
    'queued',
    'sent',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE email_direction AS ENUM (
    'outbound',
    'inbound'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Emails
create table if not exists emails (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  to_address text not null,
  from_address text,
  subject text not null,
  body text not null,
  status email_status not null default 'draft',
  direction email_direction not null default 'outbound',
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists emails_patient_id_idx on emails(patient_id);
create index if not exists emails_deal_id_idx on emails(deal_id);

-- WhatsApp message enums
DO $$ BEGIN
  CREATE TYPE whatsapp_status AS ENUM (
    'queued',
    'sent',
    'delivered',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_direction AS ENUM (
    'outbound',
    'inbound'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- WhatsApp messages
create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete set null,
  to_number text not null,
  from_number text,
  body text not null,
  status whatsapp_status not null default 'queued',
  direction whatsapp_direction not null default 'outbound',
  provider_message_sid text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists whatsapp_messages_patient_id_idx on whatsapp_messages(patient_id);

-- Document type enum
DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'post_op',
    'report',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  deal_id uuid references deals(id) on delete set null,
  type document_type not null default 'other',
  title text not null,
  content text not null,
  created_by_user_id uuid references users(id),
  created_by text,
  created_at timestamptz default now()
);

create index if not exists documents_patient_id_idx on documents(patient_id);

-- Patient notes
create table if not exists patient_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  author_user_id uuid references users(id),
  author_name text,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists patient_notes_patient_id_idx on patient_notes(patient_id);

-- Task enums
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'not_started',
    'in_progress',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM (
    'low',
    'medium',
    'high'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_type AS ENUM (
    'todo',
    'call',
    'email',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  name text not null,
  content text,
  status task_status not null default 'not_started',
  priority task_priority not null default 'medium',
  type task_type not null default 'todo',
  activity_date timestamptz,
  created_by_user_id uuid references users(id),
  created_by_name text,
  assigned_user_id uuid references users(id),
  assigned_user_name text,
  assigned_read_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists tasks_patient_id_idx on tasks(patient_id);
create index if not exists tasks_assigned_user_id_idx on tasks(assigned_user_id);

-- Task comments
create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  author_user_id uuid references users(id),
  author_name text,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists task_comments_task_id_idx on task_comments(task_id);

-- Patient edit locks
create table if not exists patient_edit_locks (
  patient_id uuid primary key references patients(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  user_name text,
  user_avatar_url text,
  updated_at timestamptz not null default now()
);

-- Consultation record type enum
DO $$ BEGIN
  CREATE TYPE consultation_record_type AS ENUM (
    'notes',
    'prescription',
    'invoice',
    'file',
    'photo',
    '3d',
    'patient_information',
    'documents',
    'form_photos'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Consultations
create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  consultation_id text not null,
  title text not null,
  record_type consultation_record_type not null,
  doctor_user_id uuid references users(id),
  doctor_name text,
  scheduled_at timestamptz not null,
  payment_method text,
  content text,
  duration_seconds integer,
  invoice_total_amount numeric(12, 2),
  invoice_is_complimentary boolean not null default false,
  invoice_is_paid boolean not null default false,
  cash_receipt_path text,
  created_by_user_id uuid references users(id),
  created_by_name text,
  created_at timestamptz default now(),
  is_archived boolean not null default false,
  archived_at timestamptz
);

create index if not exists consultations_patient_id_idx on consultations(patient_id);

-- Service groups
create table if not exists service_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  discount_percent numeric(5, 2),
  created_at timestamptz default now()
);

-- Chat folders
create table if not exists chat_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat conversations
create table if not exists chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  folder_id uuid references chat_folders(id) on delete set null,
  title text,
  patient_id uuid references patients(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_archived boolean not null default false,
  archived_at timestamptz
);

-- MediData config
create table if not exists medidata_config (
  id uuid primary key default gen_random_uuid(),
  clinic_gln text not null,
  clinic_zsr text not null,
  clinic_name text not null,
  clinic_address_street text,
  clinic_address_postal_code text,
  clinic_address_city text,
  clinic_canton text,
  medidata_client_id text,
  medidata_username text,
  medidata_password_encrypted text,
  medidata_endpoint_url text default 'https://medidata.ch/md/ela',
  is_test_mode boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MediData submissions
create table if not exists medidata_submissions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references consultations(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  invoice_number text not null,
  invoice_date date not null,
  invoice_amount numeric(12, 2) not null,
  billing_type text check (billing_type in ('TG', 'TP')) not null,
  law_type text check (law_type in ('KVG', 'UVG', 'IVG', 'MVG', 'VVG')) not null,
  status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Document templates
create table if not exists document_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  file_path text not null,
  file_type text not null default 'docx',
  category text,
  is_active boolean not null default true,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Patient documents
create table if not exists patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  template_id uuid references document_templates(id) on delete set null,
  title text not null,
  content text,
  status text check (status in ('draft', 'final', 'signed', 'archived')) not null default 'draft',
  file_path text,
  version integer not null default 1,
  created_by uuid references users(id),
  created_by_name text,
  last_edited_by uuid references users(id),
  last_edited_at timestamptz,
  signed_at timestamptz,
  signed_by_patient boolean default false,
  signed_by_doctor boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- External labs
create table if not exists external_labs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  username text not null,
  password text not null,
  type text not null default 'medisupport_fr',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Doctor scheduling settings
create table if not exists doctor_scheduling_settings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique,
  time_interval_minutes integer not null default 15,
  default_duration_minutes integer not null default 15,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Crisalix reconstructions
create table if not exists crisalix_reconstructions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  crisalix_patient_id integer not null,
  reconstruction_type text not null,
  player_id text,
  created_at timestamp with time zone default now() not null
);

-- ============================================
-- PART 2: MULTI-TENANT FOUNDATION
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  website TEXT,
  street_address TEXT,
  street_number TEXT,
  postal_code TEXT,
  city TEXT,
  canton TEXT,
  country TEXT DEFAULT 'Switzerland',
  gln TEXT,
  zsr TEXT,
  uid TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0ea5e9',
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')) DEFAULT 'free',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')) DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  owner_user_id UUID
);

CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_owner_idx ON organizations(owner_user_id);

-- Organization roles enum
DO $$ BEGIN
  CREATE TYPE organization_role AS ENUM (
    'owner',
    'admin',
    'doctor',
    'staff',
    'receptionist',
    'billing'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'staff',
  permissions JSONB DEFAULT '{}'::jsonb,
  job_title TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS org_members_org_idx ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS org_members_user_idx ON organization_members(user_id);

-- Invitation status enum
DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'expired',
    'revoked'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Organization invitations
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role organization_role NOT NULL DEFAULT 'staff',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status invitation_status NOT NULL DEFAULT 'pending',
  personal_message TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  accepted_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS org_invitations_org_idx ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS org_invitations_token_idx ON organization_invitations(token);

-- Update users table for multi-tenancy
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Zurich';

CREATE INDEX IF NOT EXISTS users_current_org_idx ON users(current_organization_id);

-- Organization settings
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_slot_duration INTEGER DEFAULT 30,
  appointment_buffer_time INTEGER DEFAULT 0,
  working_hours_start TIME DEFAULT '08:00',
  working_hours_end TIME DEFAULT '18:00',
  working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  email_notifications_enabled BOOLEAN DEFAULT true,
  sms_notifications_enabled BOOLEAN DEFAULT false,
  whatsapp_notifications_enabled BOOLEAN DEFAULT false,
  default_language TEXT DEFAULT 'en',
  supported_languages TEXT[] DEFAULT ARRAY['en', 'fr', 'de'],
  date_format TEXT DEFAULT 'DD.MM.YYYY',
  currency TEXT DEFAULT 'CHF',
  default_billing_type TEXT CHECK (default_billing_type IN ('TG', 'TP')) DEFAULT 'TG',
  vat_number TEXT,
  vat_rate NUMERIC(5,2) DEFAULT 0,
  medidata_enabled BOOLEAN DEFAULT false,
  stripe_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization audit log
CREATE TABLE IF NOT EXISTS organization_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS org_audit_log_org_idx ON organization_audit_log(organization_id);

-- ============================================
-- PART 3: ADD organization_id TO ALL TABLES
-- ============================================

ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS providers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS deal_stages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS services ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS service_categories ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS service_groups ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS workflows ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS workflow_actions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS email_templates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS emails ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS whatsapp_messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS patient_notes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS task_comments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS consultations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS chat_folders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS chat_conversations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS medidata_config ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS medidata_submissions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS document_templates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS patient_documents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS external_labs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS doctor_scheduling_settings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS patient_insurances ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS patient_edit_locks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS crisalix_reconstructions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS patients_organization_id_idx ON patients(organization_id);
CREATE INDEX IF NOT EXISTS providers_organization_id_idx ON providers(organization_id);
CREATE INDEX IF NOT EXISTS appointments_organization_id_idx ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS deals_organization_id_idx ON deals(organization_id);
CREATE INDEX IF NOT EXISTS consultations_organization_id_idx ON consultations(organization_id);
CREATE INDEX IF NOT EXISTS tasks_organization_id_idx ON tasks(organization_id);

-- ============================================
-- PART 4: HELPER FUNCTIONS
-- ============================================

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

-- Function to accept invitation
CREATE OR REPLACE FUNCTION accept_organization_invitation(
  p_token UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_invitation organization_invitations%ROWTYPE;
  v_member_id UUID;
BEGIN
  SELECT * INTO v_invitation
  FROM organization_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
    
  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
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
  
  UPDATE organization_invitations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by_user_id = p_user_id,
    updated_at = NOW()
  WHERE id = v_invitation.id;
  
  UPDATE users
  SET current_organization_id = v_invitation.organization_id
  WHERE id = p_user_id
    AND current_organization_id IS NULL;
  
  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ============================================
-- INVOICE NUMBER GENERATION FUNCTION
-- ============================================

-- Function to generate unique invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_number text;
  year_prefix text;
  next_seq integer;
BEGIN
  -- Get current year as 2-digit prefix
  year_prefix := to_char(CURRENT_DATE, 'YY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN consultation_id ~ ('^' || year_prefix || '-[0-9]+$') 
      THEN CAST(SUBSTRING(consultation_id FROM '-([0-9]+)$') AS integer)
      ELSE 0
    END
  ), 0) + 1
  INTO next_seq
  FROM consultations
  WHERE consultation_id LIKE year_prefix || '-%';
  
  -- Format as YY-XXXXX (e.g., 26-00001)
  new_number := year_prefix || '-' || LPAD(next_seq::text, 5, '0');
  
  RETURN new_number;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;

-- DONE! Your database is ready for ALiice
-- ============================================
