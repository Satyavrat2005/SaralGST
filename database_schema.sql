-- =====================================================
-- SaralGST Invoice Processing System - Database Schema
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: purchase_register
-- Stores all purchase invoice data
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_register (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Source tracking
  source TEXT CHECK (source IN ('whatsapp', 'email', 'manual', 'bulk')),
  
  -- Supplier Details
  supplier_name TEXT,
  supplier_gstin TEXT,
  supplier_state_code TEXT,
  
  -- Invoice Details
  invoice_number TEXT,
  invoice_date DATE,
  invoice_type TEXT DEFAULT 'B2B',
  
  -- Buyer Details
  buyer_gstin TEXT,
  place_of_supply_state_code TEXT,
  
  -- Tax Details
  taxable_value DECIMAL(15,2),
  cgst_amount DECIMAL(15,2),
  sgst_amount DECIMAL(15,2),
  igst_amount DECIMAL(15,2),
  cess_amount DECIMAL(15,2),
  total_invoice_value DECIMAL(15,2),
  
  -- Line Item Details
  hsn_or_sac_code TEXT,
  description_of_goods_services TEXT,
  quantity DECIMAL(15,2),
  unit_of_measure TEXT,
  rate_per_unit DECIMAL(15,2),
  
  -- Reverse Charge & ITC
  is_reverse_charge BOOLEAN DEFAULT FALSE,
  is_itc_eligible BOOLEAN DEFAULT TRUE,
  itc_claimed_cgst DECIMAL(15,2),
  itc_claimed_sgst DECIMAL(15,2),
  itc_claimed_igst DECIMAL(15,2),
  itc_claimed_cess DECIMAL(15,2),
  
  -- Processing Metadata
  invoice_bucket_url TEXT,
  ocr_raw_json JSONB,
  ocr_confidence_score DECIMAL(3,2),
  invoice_status TEXT CHECK (invoice_status IN ('extracted', 'verified', 'error', 'pending', 'needs_review')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_purchase_register_invoice_number ON purchase_register(invoice_number);
CREATE INDEX IF NOT EXISTS idx_purchase_register_supplier_gstin ON purchase_register(supplier_gstin);
CREATE INDEX IF NOT EXISTS idx_purchase_register_invoice_date ON purchase_register(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchase_register_source ON purchase_register(source);
CREATE INDEX IF NOT EXISTS idx_purchase_register_status ON purchase_register(invoice_status);
CREATE INDEX IF NOT EXISTS idx_purchase_register_created_at ON purchase_register(created_at DESC);

-- =====================================================
-- Table: purchase_remarks
-- Stores validation errors and remarks
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_remarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchase_register(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  issue_type TEXT CHECK (issue_type IN ('missing', 'unreadable', 'mismatch', 'invalid_format')),
  detected_value TEXT,
  expected_value TEXT,
  confidence_score DECIMAL(3,2),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_remarks_purchase_id ON purchase_remarks(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_remarks_status ON purchase_remarks(status);
CREATE INDEX IF NOT EXISTS idx_purchase_remarks_issue_type ON purchase_remarks(issue_type);

-- =====================================================
-- Trigger: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_purchase_register_updated_at 
  BEFORE UPDATE ON purchase_register 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- Uncomment and customize based on your auth setup
-- =====================================================

-- Enable RLS
-- ALTER TABLE purchase_register ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_remarks ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your auth requirements)
-- Allow authenticated users to read all purchase invoices
-- CREATE POLICY "Allow authenticated users to read purchase_register"
--   ON purchase_register FOR SELECT
--   USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert purchase invoices
-- CREATE POLICY "Allow authenticated users to insert purchase_register"
--   ON purchase_register FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their own purchase invoices
-- CREATE POLICY "Allow users to update purchase_register"
--   ON purchase_register FOR UPDATE
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');

-- Similar policies for purchase_remarks
-- CREATE POLICY "Allow authenticated users to read purchase_remarks"
--   ON purchase_remarks FOR SELECT
--   USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow authenticated users to insert purchase_remarks"
--   ON purchase_remarks FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- Helpful Views
-- =====================================================

-- View: Purchase invoices with error counts
CREATE OR REPLACE VIEW v_purchase_register_with_errors AS
SELECT 
  pr.*,
  COUNT(prm.id) as error_count,
  COUNT(CASE WHEN prm.status = 'open' THEN 1 END) as open_errors
FROM purchase_register pr
LEFT JOIN purchase_remarks prm ON pr.id = prm.purchase_id
GROUP BY pr.id;

-- View: Monthly purchase summary
CREATE OR REPLACE VIEW v_monthly_purchase_summary AS
SELECT 
  DATE_TRUNC('month', invoice_date) as month,
  COUNT(*) as invoice_count,
  SUM(taxable_value) as total_taxable,
  SUM(cgst_amount) as total_cgst,
  SUM(sgst_amount) as total_sgst,
  SUM(igst_amount) as total_igst,
  SUM(total_invoice_value) as total_amount,
  COUNT(CASE WHEN invoice_status = 'verified' THEN 1 END) as verified_count,
  COUNT(CASE WHEN invoice_status = 'needs_review' THEN 1 END) as review_needed_count
FROM purchase_register
WHERE invoice_date IS NOT NULL
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month DESC;

-- View: Vendor-wise purchase summary
CREATE OR REPLACE VIEW v_vendor_purchase_summary AS
SELECT 
  supplier_gstin,
  supplier_name,
  COUNT(*) as invoice_count,
  SUM(total_invoice_value) as total_amount,
  SUM(cgst_amount + sgst_amount + igst_amount) as total_tax,
  MAX(invoice_date) as last_invoice_date,
  COUNT(CASE WHEN invoice_status = 'needs_review' THEN 1 END) as issues_count
FROM purchase_register
WHERE supplier_gstin IS NOT NULL
GROUP BY supplier_gstin, supplier_name
ORDER BY total_amount DESC;

-- =====================================================
-- Sample Data (for testing)
-- =====================================================

-- Insert a sample invoice
-- INSERT INTO purchase_register (
--   source, supplier_name, supplier_gstin, invoice_number, invoice_date,
--   invoice_type, buyer_gstin, taxable_value, cgst_amount, sgst_amount,
--   total_invoice_value, hsn_or_sac_code, invoice_status
-- ) VALUES (
--   'manual', 'ABC Enterprises Pvt Ltd', '27ABCDE1234F1Z5', 'INV-2024-001',
--   '2024-01-04', 'B2B', '27XYZAB5678G1Z9', 10000.00, 900.00, 900.00,
--   11800.00, '8471', 'extracted'
-- );

-- =====================================================
-- Useful Queries
-- =====================================================

-- Get all invoices with validation errors
-- SELECT pr.*, prm.*
-- FROM purchase_register pr
-- INNER JOIN purchase_remarks prm ON pr.id = prm.purchase_id
-- WHERE prm.status = 'open';

-- Get monthly GST summary
-- SELECT 
--   TO_CHAR(invoice_date, 'YYYY-MM') as month,
--   SUM(cgst_amount) as total_cgst,
--   SUM(sgst_amount) as total_sgst,
--   SUM(igst_amount) as total_igst
-- FROM purchase_register
-- WHERE invoice_status = 'verified'
-- GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
-- ORDER BY month DESC;

-- Get invoices needing review
-- SELECT *
-- FROM purchase_register
-- WHERE invoice_status = 'needs_review'
-- ORDER BY created_at DESC;
