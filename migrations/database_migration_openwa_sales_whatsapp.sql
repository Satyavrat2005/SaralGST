-- =====================================================
-- OpenWA / WhatsApp — sales + conversation state
-- Safe to run multiple times
-- =====================================================

-- 1) Sales: source + WhatsApp tracking (align with purchase_register)
ALTER TABLE sales_invoices
  ADD COLUMN IF NOT EXISTS source TEXT
    CHECK (source IN ('whatsapp', 'email', 'manual', 'bulk'));

ALTER TABLE sales_invoices
  ADD COLUMN IF NOT EXISTS wa_sender_phone TEXT;

ALTER TABLE sales_invoices
  ADD COLUMN IF NOT EXISTS wa_attempt_count INTEGER DEFAULT 0;

-- Allow quarantine status for failed WhatsApp sales (mirror purchase)
ALTER TABLE sales_invoices
  DROP CONSTRAINT IF EXISTS sales_invoices_extraction_status_check;

ALTER TABLE sales_invoices
  ADD CONSTRAINT sales_invoices_extraction_status_check
  CHECK (extraction_status IN (
    'pending',
    'extracted',
    'needs_review',
    'wa_quarantine'
  ));

CREATE INDEX IF NOT EXISTS idx_sales_invoices_wa_sender
  ON sales_invoices(wa_sender_phone);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_source_status
  ON sales_invoices(source, extraction_status);

-- 2) Extend whatsapp_intake for purchase vs sales + sales FK
ALTER TABLE whatsapp_intake
  ADD COLUMN IF NOT EXISTS invoice_kind TEXT
    CHECK (invoice_kind IN ('purchase', 'sales'));

ALTER TABLE whatsapp_intake
  ADD COLUMN IF NOT EXISTS linked_sales_id UUID
    REFERENCES sales_invoices(id) ON DELETE SET NULL;

ALTER TABLE whatsapp_intake
  DROP CONSTRAINT IF EXISTS whatsapp_intake_last_status_check;

ALTER TABLE whatsapp_intake
  ADD CONSTRAINT whatsapp_intake_last_status_check
  CHECK (last_status IN (
    'pending',
    'validated',
    'rejected',
    'needs_review',
    'awaiting_kind'
  ));

-- 3) Pending media when we need PURCHASE/SALES reply
CREATE TABLE IF NOT EXISTS whatsapp_pending_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_phone TEXT NOT NULL UNIQUE,
  media_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_name TEXT,
  message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_pending_media_expires
  ON whatsapp_pending_media(expires_at);
