-- Add a customer WhatsApp/phone number to sales invoices.
-- This powers outbound WhatsApp actions on the Sales Register (chase payment,
-- request correction, send invoice copy) via the Evolution API.
--
-- Unlike purchase invoices (which carry wa_sender_phone from the inbound
-- WhatsApp message), sales invoices have no inbound number, so the user
-- supplies the customer's number manually in the invoice detail editor.

ALTER TABLE sales_invoices
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

COMMENT ON COLUMN sales_invoices.customer_phone IS
  'Customer contact number (digits, optionally with country code) used for outbound WhatsApp messages via Evolution API.';
