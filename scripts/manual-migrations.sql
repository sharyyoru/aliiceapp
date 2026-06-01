-- ============================================
-- MAISON TOA DATABASE MIGRATIONS
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- CONSULTATIONS TABLE - Missing columns
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS invoice_status text CHECK (invoice_status IN ('OPEN', 'PAID', 'CANCELLED', 'OVERPAID', 'PARTIAL_LOSS', 'PARTIAL_PAID')) DEFAULT 'OPEN';
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS invoice_id text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS invoice_paid_amount numeric(12, 2);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS invoice_pdf_path text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payment_link_token text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payrexx_payment_link text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS payrexx_payment_status text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS reference_number text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS diagnosis_code text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS ref_icd10 text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS linked_invoice_id uuid;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS linked_invoice_status text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS linked_invoice_number text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS medidata_status text;

-- APPOINTMENTS TABLE - Missing columns
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendar_event_id text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- EMAILS TABLE - Missing columns
ALTER TABLE emails ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE emails ADD COLUMN IF NOT EXISTS mailgun_message_id text;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS in_reply_to text;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS thread_id text;

-- DEAL_STAGES TABLE - Missing columns
ALTER TABLE deal_stages ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- LEAD_IMPORTS TABLE - Create if not exists
CREATE TABLE IF NOT EXISTS lead_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  service text,
  total_leads integer,
  imported_count integer,
  failed_count integer,
  imported_patient_ids uuid[],
  errors text[],
  import_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Update patients source constraint to allow more values
DO $$ BEGIN
  ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_source_check;
  ALTER TABLE patients ADD CONSTRAINT patients_source_check 
    CHECK (source IN ('manual','event','meta','google','facebook','instagram','tiktok','website','referral','other'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS consultations_invoice_status_idx ON consultations(invoice_status);
CREATE INDEX IF NOT EXISTS emails_read_at_idx ON emails(read_at);
CREATE INDEX IF NOT EXISTS appointments_title_idx ON appointments(title);

-- SERVICES TABLE - Add duration_minutes column
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 30;

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
