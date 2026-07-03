-- Add payment_method column to client_invoices if it doesn't exist
ALTER TABLE client_invoices
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'payrexx';
