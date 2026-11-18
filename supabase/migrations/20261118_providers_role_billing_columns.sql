-- Provider role/billing columns previously applied manually via
-- scripts/setup-billing-entities*.sql — captured as a real migration so
-- fresh projects build cleanly.
ALTER TABLE providers ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS iban text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS bic text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS billing_type text
  CHECK (billing_type IS NULL OR billing_type IN ('medical', 'aesthetic'));
ALTER TABLE providers ADD COLUMN IF NOT EXISTS invoice_method text
  CHECK (invoice_method IS NULL OR invoice_method IN ('tardoc_insurer', 'direct_patient'));
ALTER TABLE providers ADD COLUMN IF NOT EXISTS vat_enabled boolean DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS retrocession_pct numeric(5,2);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS notes text;

-- Clinics + bank accounts (from setup-billing-entities-v2.sql)
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  rcc text,
  vat_number text,
  bank_name text,
  bic text,
  gln text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  account_number text,
  iban text NOT NULL UNIQUE,
  bic text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_clinic_id ON bank_accounts(clinic_id);

ALTER TABLE providers ADD COLUMN IF NOT EXISTS bank_account_id uuid
  REFERENCES bank_accounts(id) ON DELETE SET NULL;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS clinic_id uuid
  REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS doctor_id uuid
  REFERENCES providers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_providers_doctor_id ON providers(doctor_id);
CREATE INDEX IF NOT EXISTS idx_providers_bank_account_id ON providers(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_providers_clinic_id ON providers(clinic_id);
