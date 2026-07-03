-- ============================================================
-- Client-billing invoices (Aliice SaaS billing its own clients)
-- Backs the /admin/invoices generator with persistence + Payrexx
-- payment link + payment tracking via the shared payrexx webhook.
-- ============================================================

CREATE TABLE IF NOT EXISTS client_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  invoice_number TEXT NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,

  -- Recipient (the Aliice client)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  client_city TEXT,

  -- Sender
  from_name TEXT,
  from_address TEXT,
  from_city TEXT,

  currency TEXT NOT NULL DEFAULT 'USD',
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,

  -- Status: OPEN | PAID | PARTIAL_LOSS | CANCELLED
  status TEXT NOT NULL DEFAULT 'OPEN',

  -- Payrexx payment gateway
  payrexx_gateway_id BIGINT,
  payrexx_gateway_hash TEXT,
  payrexx_payment_link TEXT,
  payrexx_transaction_id TEXT,
  payrexx_transaction_uuid TEXT,
  payrexx_payment_status TEXT,
  payrexx_paid_at TIMESTAMPTZ,

  -- Payment tracking
  paid_amount NUMERIC,
  paid_at TIMESTAMPTZ,

  -- Delivery
  pdf_path TEXT,
  last_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_invoices_status ON client_invoices(status);
CREATE INDEX IF NOT EXISTS idx_client_invoices_created_at ON client_invoices(created_at DESC);
