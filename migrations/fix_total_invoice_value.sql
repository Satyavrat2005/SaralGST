-- Migration: Fix total_invoice_value calculation for purchase_register
-- Purpose: Update existing records where total_invoice_value is 0 or NULL
-- Date: 2026-03-11

-- Step 1: Update all existing records to calculate total_invoice_value
-- This fixes any records that were created before the calculation was added to the code
UPDATE public.purchase_register
SET 
  total_invoice_value = 
    COALESCE(taxable_value, 0) + 
    COALESCE(cgst_amount, 0) + 
    COALESCE(sgst_amount, 0) + 
    COALESCE(igst_amount, 0) + 
    COALESCE(cess_amount, 0),
  updated_at = NOW()
WHERE 
  total_invoice_value IS NULL 
  OR total_invoice_value = 0
  OR total_invoice_value != (
    COALESCE(taxable_value, 0) + 
    COALESCE(cgst_amount, 0) + 
    COALESCE(sgst_amount, 0) + 
    COALESCE(igst_amount, 0) + 
    COALESCE(cess_amount, 0)
  );

-- Step 2 (OPTIONAL - RECOMMENDED): Convert to generated column
-- This ensures the total is ALWAYS correct and can't be manually set incorrectly
-- WARNING: This will drop the column and recreate it, so run Step 1 first!

-- Uncomment the following lines to make total_invoice_value a generated column:
/*
ALTER TABLE public.purchase_register 
DROP COLUMN IF EXISTS total_invoice_value;

ALTER TABLE public.purchase_register 
ADD COLUMN total_invoice_value numeric 
GENERATED ALWAYS AS (
  COALESCE(taxable_value, 0) + 
  COALESCE(cgst_amount, 0) + 
  COALESCE(sgst_amount, 0) + 
  COALESCE(igst_amount, 0) + 
  COALESCE(cess_amount, 0)
) STORED;

-- If you make it a generated column, you must also update the code:
-- 1. Remove the total_invoice_value calculation from app/api/invoice/process/route.ts
-- 2. Remove the total_invoice_value calculation from app/dashboard/sme/invoices/purchase/page.tsx
-- 3. Ensure no code tries to SET total_invoice_value directly
*/

-- Verification query - run this to check if the update worked:
SELECT 
  id,
  invoice_number,
  taxable_value,
  cgst_amount,
  sgst_amount,
  igst_amount,
  cess_amount,
  total_invoice_value,
  -- Calculate what it should be:
  (COALESCE(taxable_value, 0) + COALESCE(cgst_amount, 0) + COALESCE(sgst_amount, 0) + COALESCE(igst_amount, 0) + COALESCE(cess_amount, 0)) as calculated_total
FROM public.purchase_register
ORDER BY created_at DESC
LIMIT 10;
