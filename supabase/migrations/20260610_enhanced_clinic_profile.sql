-- Enhanced clinic profile structure

-- Add new fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[], -- Array of specialties
ADD COLUMN IF NOT EXISTS languages TEXT[], -- Array of spoken languages
ADD COLUMN IF NOT EXISTS notes TEXT, -- Notes to track steps/progress
ADD COLUMN IF NOT EXISTS contact_owner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS multiple_centers BOOLEAN DEFAULT false;

-- Create organization_contacts table for multiple contacts per clinic
CREATE TABLE IF NOT EXISTS organization_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT, -- Dr, Nurse, Manager, etc.
  full_name TEXT NOT NULL,
  gender TEXT, -- male, female, other
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_contacts_org ON organization_contacts(organization_id);

-- Predefined specialties list for reference
COMMENT ON COLUMN organizations.specialties IS 'Array of specialties: Dental, Aesthetic, IV Therapy, Radiology, Dermatology, Ophthalmology, Cardiology, Orthopedics, General Medicine, Pediatrics, Gynecology, Neurology, Psychiatry, ENT, Urology, Oncology, Physiotherapy, Nutrition, etc.';
