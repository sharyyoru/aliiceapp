-- ============================================================
-- Client-billing invoices (Aliice SaaS) — Payrexx-enabled
-- Paste into the Supabase SQL editor and Run. Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS client_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  client_city TEXT,
  from_name TEXT,
  from_address TEXT,
  from_city TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  payrexx_gateway_id BIGINT,
  payrexx_gateway_hash TEXT,
  payrexx_payment_link TEXT,
  payrexx_transaction_id TEXT,
  payrexx_transaction_uuid TEXT,
  payrexx_payment_status TEXT,
  payrexx_paid_at TIMESTAMPTZ,
  paid_amount NUMERIC,
  paid_at TIMESTAMPTZ,
  pdf_path TEXT,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_invoices_status ON client_invoices(status);
CREATE INDEX IF NOT EXISTS idx_client_invoices_created_at ON client_invoices(created_at DESC);

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_name = 'client_invoices' ORDER BY ordinal_position;
