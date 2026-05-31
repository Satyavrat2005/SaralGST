import type { Gstr2bDocumentRow } from './types';
import { normalizeDocNumber, normalizeGstin } from './utils';

export interface SandboxPurchaseRow {
  source: 'manual';
  supplier_name: string | null;
  supplier_gstin: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_type: string;
  buyer_gstin: string | null;
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_invoice_value: number;
  is_itc_eligible: boolean;
  invoice_status: 'verified';
}

export function gstr2bRowToSandboxPurchase(
  row: Gstr2bDocumentRow,
  buyerGstin: string
): SandboxPurchaseRow {
  const taxable = row.taxable_value || 0;
  const cgst = row.cgst_amount || 0;
  const sgst = row.sgst_amount || 0;
  const igst = row.igst_amount || 0;
  const cess = row.cess_amount || 0;

  return {
    source: 'manual',
    supplier_name: row.supplier_name,
    supplier_gstin: row.supplier_gstin,
    invoice_number: row.invoice_number,
    invoice_date: row.invoice_date,
    invoice_type: row.section.startsWith('impg') ? 'IMPG' : 'B2B',
    buyer_gstin: buyerGstin,
    taxable_value: taxable,
    cgst_amount: cgst,
    sgst_amount: sgst,
    igst_amount: igst,
    cess_amount: cess,
    total_invoice_value: row.invoice_value || taxable + cgst + sgst + igst + cess,
    is_itc_eligible: row.itc_eligible !== false,
    invoice_status: 'verified',
  };
}

export function buildSandboxPurchaseRows(
  gstr2bRows: Gstr2bDocumentRow[],
  buyerGstin: string
): SandboxPurchaseRow[] {
  return gstr2bRows
    .filter((r) => r.invoice_number && r.invoice_date)
    .map((r) => gstr2bRowToSandboxPurchase(r, buyerGstin));
}

export function purchaseSeedKey(row: SandboxPurchaseRow): string {
  return `${normalizeGstin(row.supplier_gstin)}|${normalizeDocNumber(row.invoice_number)}|${row.invoice_date}`;
}
