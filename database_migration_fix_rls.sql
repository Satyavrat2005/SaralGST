-- =====================================================
-- FIX RLS POLICIES - Run this in Supabase SQL Editor
-- =====================================================

-- 1. Fix sales_invoices: Allow reading rows with NULL user_id (legacy/uploaded data)
DROP POLICY IF EXISTS "Users can view own sales invoices" ON sales_invoices;
CREATE POLICY "Users can view own or unassigned sales invoices" ON sales_invoices 
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own sales invoices" ON sales_invoices;
CREATE POLICY "Users can update own or unassigned sales invoices" ON sales_invoices 
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete own sales invoices" ON sales_invoices;
CREATE POLICY "Users can delete own or unassigned sales invoices" ON sales_invoices 
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert own sales invoices" ON sales_invoices;
CREATE POLICY "Users can insert sales invoices" ON sales_invoices 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 2. Add missing DELETE policies for GST return data tables
CREATE POLICY "Users can delete own gstr3b data" ON gstr3b_data 
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gstr2b data" ON gstr2b_data 
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own returns" ON gst_returns 
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Clean up stale generated records with 0 invoices (from previous buggy runs)
DELETE FROM gstr3b_data WHERE return_id IN (SELECT id FROM gst_returns WHERE total_invoices = 0);
DELETE FROM gstr1_invoices WHERE return_id IN (SELECT id FROM gst_returns WHERE total_invoices = 0);
DELETE FROM gstr2b_data WHERE return_id IN (SELECT id FROM gst_returns WHERE total_invoices = 0);
DELETE FROM gst_returns WHERE total_invoices = 0;
