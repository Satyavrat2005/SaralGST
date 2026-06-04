-- =====================================================
-- SaralGST — WhatsApp Integration Migration
-- =====================================================
-- Adds:
--   1. The `wa_quarantine` invoice status (received via WhatsApp, not yet validated).
--   2. WhatsApp sender tracking columns on purchase_register.
--   3. A `whatsapp_intake` side table to correlate resends / drive the
--      correction loop without polluting purchase_register.
--
-- Safe to run multiple times.
-- =====================================================

-- -----------------------------------------------------
-- 1. Allow the new `wa_quarantine` status.
--    The original CHECK constraint enumerates allowed statuses, so we must
--    drop and recreate it with the extra value.
-- -----------------------------------------------------
ALTER TABLE purchase_register
  DROP CONSTRAINT IF EXISTS purchase_register_invoice_status_check;

ALTER TABLE purchase_register
  ADD CONSTRAINT purchase_register_invoice_status_check
  CHECK (invoice_status IN (
    'extracted',
    'verified',
    'error',
    'pending',
    'needs_review',
    'wa_quarantine'
  ));

-- -----------------------------------------------------
-- 2. WhatsApp sender tracking columns on purchase_register.
-- -----------------------------------------------------
ALTER TABLE purchase_register
  ADD COLUMN IF NOT EXISTS wa_sender_phone TEXT;

ALTER TABLE purchase_register
  ADD COLUMN IF NOT EXISTS wa_attempt_count INTEGER DEFAULT 0;

-- -----------------------------------------------------
-- 3. whatsapp_intake side table.
--    One row per (sender_phone, invoice_number) intake conversation; used to
--    count attempts and decide when to escalate to manual review.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS whatsapp_intake (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_phone TEXT NOT NULL,
  invoice_number TEXT,
  attempt_count INTEGER DEFAULT 0,
  last_status TEXT CHECK (last_status IN ('pending', 'validated', 'rejected', 'needs_review')),
  last_error_summary TEXT,
  linked_purchase_id UUID REFERENCES purchase_register(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_intake_sender ON whatsapp_intake(sender_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_intake_invoice_number ON whatsapp_intake(invoice_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_intake_linked_purchase ON whatsapp_intake(linked_purchase_id);

-- Reuse the shared updated_at trigger function (defined in database_schema.sql).
DROP TRIGGER IF EXISTS update_whatsapp_intake_updated_at ON whatsapp_intake;
CREATE TRIGGER update_whatsapp_intake_updated_at
  BEFORE UPDATE ON whatsapp_intake
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
