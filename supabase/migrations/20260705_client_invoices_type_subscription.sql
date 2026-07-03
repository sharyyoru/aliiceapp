-- ============================================================
-- Unify subscription billing into client_invoices.
-- Adds an invoice_type discriminator ('manual' | 'subscription')
-- plus organization + billing-period linkage so subscription
-- charges flow through Payrexx like manual client invoices and
-- are tracked in a single history view.
-- ============================================================

ALTER TABLE client_invoices
  ADD COLUMN IF NOT EXISTS invoice_type TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS period_start DATE,
  ADD COLUMN IF NOT EXISTS period_end DATE;

CREATE INDEX IF NOT EXISTS idx_client_invoices_type ON client_invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_client_invoices_org ON client_invoices(organization_id);

-- Backfill: everything created before this migration is a manual invoice.
UPDATE client_invoices SET invoice_type = 'manual' WHERE invoice_type IS NULL;
