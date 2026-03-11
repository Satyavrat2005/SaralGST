-- =====================================================
-- SaralGST - GST Returns Module Database Migration
-- Run this on Supabase SQL Editor
-- =====================================================

-- =====================================================
-- Table: gst_returns
-- Master table for all GST return filings
-- =====================================================
CREATE TABLE IF NOT EXISTS gst_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  gstin TEXT NOT NULL,
  return_type TEXT NOT NULL CHECK (return_type IN ('GSTR1', 'GSTR2B', 'GSTR3B')),
  return_period TEXT NOT NULL, -- Format: MMYYYY e.g. '012026'
  financial_year TEXT NOT NULL, -- e.g. '2025-26'
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'validated', 'submitted', 'filed', 'error')),
  
  -- Summary values
  total_taxable_value NUMERIC DEFAULT 0,
  total_igst NUMERIC DEFAULT 0,
  total_cgst NUMERIC DEFAULT 0,
  total_sgst NUMERIC DEFAULT 0,
  total_cess NUMERIC DEFAULT 0,
  total_tax NUMERIC DEFAULT 0,
  total_invoices INTEGER DEFAULT 0,
  
  -- Filing info
  arn TEXT, -- Acknowledgment Reference Number after filing
  filed_date TIMESTAMP WITH TIME ZONE,
  filed_by TEXT,
  
  -- MasterGST API tracking
  api_reference_id TEXT,
  api_status TEXT,
  api_response JSONB,
  
  -- JSON data for the entire return
  return_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gst_returns_user_id ON gst_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_gst_returns_gstin ON gst_returns(gstin);
CREATE INDEX IF NOT EXISTS idx_gst_returns_type_period ON gst_returns(return_type, return_period);
CREATE INDEX IF NOT EXISTS idx_gst_returns_status ON gst_returns(status);

-- =====================================================
-- Table: gstr1_invoices
-- Individual invoice entries for GSTR-1
-- =====================================================
CREATE TABLE IF NOT EXISTS gstr1_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES gst_returns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Section type: b2b, b2cl, b2cs, cdnr, cdnur, exp, nil, hsn, doc_issue, at, txpd
  section TEXT NOT NULL,
  
  -- Invoice details
  invoice_number TEXT,
  invoice_date DATE,
  invoice_value NUMERIC,
  place_of_supply TEXT,
  
  -- Counterparty
  counterparty_gstin TEXT,
  counterparty_name TEXT,
  
  -- Tax details
  taxable_value NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  cess_amount NUMERIC DEFAULT 0,
  tax_rate NUMERIC,
  
  -- Classification
  invoice_type TEXT DEFAULT 'R', -- R=Regular, SEWP=SEZ with payment, SEWOP=SEZ without payment, DE=Deemed export
  reverse_charge BOOLEAN DEFAULT FALSE,
  
  -- HSN details
  hsn_code TEXT,
  description TEXT,
  uqc TEXT,
  quantity NUMERIC,
  
  -- Status
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'warning', 'error')),
  validation_errors JSONB,
  
  -- Source tracking
  source TEXT DEFAULT 'sales_register', -- sales_register, manual, import
  source_invoice_id UUID, -- Reference to sales_invoices.id
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gstr1_invoices_return_id ON gstr1_invoices(return_id);
CREATE INDEX IF NOT EXISTS idx_gstr1_invoices_section ON gstr1_invoices(section);
CREATE INDEX IF NOT EXISTS idx_gstr1_invoices_user_id ON gstr1_invoices(user_id);

-- =====================================================
-- Table: gstr2b_data
-- GSTR-2B data fetched from portal
-- =====================================================
CREATE TABLE IF NOT EXISTS gstr2b_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES gst_returns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Section: b2b, b2ba, cdnr, cdnra, isd, isda, impg, impgsez
  section TEXT NOT NULL,
  
  -- Supplier details
  supplier_gstin TEXT,
  supplier_name TEXT,
  
  -- Invoice details
  invoice_number TEXT,
  invoice_date DATE,
  invoice_value NUMERIC,
  place_of_supply TEXT,
  
  -- Tax details
  taxable_value NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  cess_amount NUMERIC DEFAULT 0,
  tax_rate NUMERIC,
  
  -- ITC eligibility
  itc_eligible BOOLEAN DEFAULT TRUE,
  itc_igst NUMERIC DEFAULT 0,
  itc_cgst NUMERIC DEFAULT 0,
  itc_sgst NUMERIC DEFAULT 0,
  itc_cess NUMERIC DEFAULT 0,
  
  -- Matching
  match_status TEXT DEFAULT 'not_matched' CHECK (match_status IN ('not_matched', 'matched', 'partial', 'mismatch')),
  matched_purchase_id UUID,
  
  -- IMS action
  ims_action TEXT CHECK (ims_action IN ('accept', 'reject', 'pending', NULL)),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gstr2b_data_return_id ON gstr2b_data(return_id);
CREATE INDEX IF NOT EXISTS idx_gstr2b_data_user_id ON gstr2b_data(user_id);
CREATE INDEX IF NOT EXISTS idx_gstr2b_data_supplier ON gstr2b_data(supplier_gstin);

-- =====================================================
-- Table: gstr3b_data
-- GSTR-3B section-wise data
-- =====================================================
CREATE TABLE IF NOT EXISTS gstr3b_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES gst_returns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Section 3.1: Tax on Outward Supplies
  sec_3_1_a_taxable NUMERIC DEFAULT 0, -- Outward taxable (other than zero/nil/exempt)
  sec_3_1_a_igst NUMERIC DEFAULT 0,
  sec_3_1_a_cgst NUMERIC DEFAULT 0,
  sec_3_1_a_sgst NUMERIC DEFAULT 0,
  sec_3_1_a_cess NUMERIC DEFAULT 0,
  
  sec_3_1_b_taxable NUMERIC DEFAULT 0, -- Zero rated
  sec_3_1_b_igst NUMERIC DEFAULT 0,
  
  sec_3_1_c_taxable NUMERIC DEFAULT 0, -- Nil rated / exempt
  
  sec_3_1_d_taxable NUMERIC DEFAULT 0, -- Inward supplies (reverse charge)
  sec_3_1_d_igst NUMERIC DEFAULT 0,
  sec_3_1_d_cgst NUMERIC DEFAULT 0,
  sec_3_1_d_sgst NUMERIC DEFAULT 0,
  sec_3_1_d_cess NUMERIC DEFAULT 0,
  
  sec_3_1_e_taxable NUMERIC DEFAULT 0, -- Non-GST outward
  
  -- Section 3.2: Inter-state supplies
  sec_3_2_unreg_taxable NUMERIC DEFAULT 0,
  sec_3_2_unreg_igst NUMERIC DEFAULT 0,
  sec_3_2_comp_taxable NUMERIC DEFAULT 0,
  sec_3_2_comp_igst NUMERIC DEFAULT 0,
  sec_3_2_uin_taxable NUMERIC DEFAULT 0,
  sec_3_2_uin_igst NUMERIC DEFAULT 0,
  
  -- Section 4: ITC Available
  sec_4_a1_igst NUMERIC DEFAULT 0, -- Import of goods
  sec_4_a1_cgst NUMERIC DEFAULT 0,
  sec_4_a1_sgst NUMERIC DEFAULT 0,
  sec_4_a1_cess NUMERIC DEFAULT 0,
  
  sec_4_a2_igst NUMERIC DEFAULT 0, -- Import of services
  sec_4_a2_cgst NUMERIC DEFAULT 0,
  sec_4_a2_sgst NUMERIC DEFAULT 0,
  sec_4_a2_cess NUMERIC DEFAULT 0,
  
  sec_4_a3_igst NUMERIC DEFAULT 0, -- Inward reverse charge
  sec_4_a3_cgst NUMERIC DEFAULT 0,
  sec_4_a3_sgst NUMERIC DEFAULT 0,
  sec_4_a3_cess NUMERIC DEFAULT 0,
  
  sec_4_a4_igst NUMERIC DEFAULT 0, -- ISD
  sec_4_a4_cgst NUMERIC DEFAULT 0,
  sec_4_a4_sgst NUMERIC DEFAULT 0,
  sec_4_a4_cess NUMERIC DEFAULT 0,
  
  sec_4_a5_igst NUMERIC DEFAULT 0, -- All other ITC
  sec_4_a5_cgst NUMERIC DEFAULT 0,
  sec_4_a5_sgst NUMERIC DEFAULT 0,
  sec_4_a5_cess NUMERIC DEFAULT 0,
  
  -- Section 4B: ITC Reversed
  sec_4_b1_igst NUMERIC DEFAULT 0, -- Rules 38,42,43
  sec_4_b1_cgst NUMERIC DEFAULT 0,
  sec_4_b1_sgst NUMERIC DEFAULT 0,
  sec_4_b1_cess NUMERIC DEFAULT 0,
  
  sec_4_b2_igst NUMERIC DEFAULT 0, -- Others
  sec_4_b2_cgst NUMERIC DEFAULT 0,
  sec_4_b2_sgst NUMERIC DEFAULT 0,
  sec_4_b2_cess NUMERIC DEFAULT 0,
  
  -- Section 5: Exempt/Nil/Non-GST
  sec_5_inter_exempt NUMERIC DEFAULT 0,
  sec_5_inter_nil NUMERIC DEFAULT 0,
  sec_5_inter_nongst NUMERIC DEFAULT 0,
  sec_5_intra_exempt NUMERIC DEFAULT 0,
  sec_5_intra_nil NUMERIC DEFAULT 0,
  sec_5_intra_nongst NUMERIC DEFAULT 0,
  
  -- Section 6.1: Payment of tax
  sec_6_1_igst_tax NUMERIC DEFAULT 0,
  sec_6_1_igst_itc NUMERIC DEFAULT 0,
  sec_6_1_igst_cash NUMERIC DEFAULT 0,
  sec_6_1_cgst_tax NUMERIC DEFAULT 0,
  sec_6_1_cgst_itc NUMERIC DEFAULT 0,
  sec_6_1_cgst_cash NUMERIC DEFAULT 0,
  sec_6_1_sgst_tax NUMERIC DEFAULT 0,
  sec_6_1_sgst_itc NUMERIC DEFAULT 0,
  sec_6_1_sgst_cash NUMERIC DEFAULT 0,
  sec_6_1_cess_tax NUMERIC DEFAULT 0,
  sec_6_1_cess_cash NUMERIC DEFAULT 0,
  sec_6_1_interest NUMERIC DEFAULT 0,
  sec_6_1_late_fee NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gstr3b_data_return_id ON gstr3b_data(return_id);
CREATE INDEX IF NOT EXISTS idx_gstr3b_data_user_id ON gstr3b_data(user_id);

-- =====================================================
-- Table: mastergst_auth_tokens
-- Store MasterGST API auth tokens
-- =====================================================
CREATE TABLE IF NOT EXISTS mastergst_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  gstin TEXT NOT NULL,
  auth_token TEXT,
  txn TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, gstin)
);

-- =====================================================
-- Trigger: Auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gst_returns_updated_at 
  BEFORE UPDATE ON gst_returns 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gstr1_invoices_updated_at 
  BEFORE UPDATE ON gstr1_invoices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gstr3b_data_updated_at 
  BEFORE UPDATE ON gstr3b_data 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Enable RLS
-- =====================================================
ALTER TABLE gst_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE gstr1_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE gstr2b_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE gstr3b_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastergst_auth_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for gst_returns
CREATE POLICY "Users can view own returns" ON gst_returns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own returns" ON gst_returns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own returns" ON gst_returns
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for gstr1_invoices
CREATE POLICY "Users can view own gstr1 invoices" ON gstr1_invoices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gstr1 invoices" ON gstr1_invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gstr1 invoices" ON gstr1_invoices
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gstr1 invoices" ON gstr1_invoices
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for gstr2b_data
CREATE POLICY "Users can view own gstr2b data" ON gstr2b_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gstr2b data" ON gstr2b_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gstr2b data" ON gstr2b_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for gstr3b_data
CREATE POLICY "Users can view own gstr3b data" ON gstr3b_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gstr3b data" ON gstr3b_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gstr3b data" ON gstr3b_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for mastergst_auth_tokens
CREATE POLICY "Users can manage own tokens" ON mastergst_auth_tokens
  FOR ALL USING (auth.uid() = user_id);
