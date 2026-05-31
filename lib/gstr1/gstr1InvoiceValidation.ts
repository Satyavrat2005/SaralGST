import { isValidGstin } from './utils';

/** Lenient checks for GSTR-1 mapping (sales register rows are often incomplete). */
export function validateForGstr1Mapping(inv: {
  invoice_number?: string | null;
  invoice_date?: string | null;
  taxable_value?: number;
  gross_total?: number;
  customer_gstin?: string | null;
  section: string;
}): { status: 'valid' | 'warning' | 'error'; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!inv.invoice_number?.trim()) {
    errors.push('Invoice number is missing');
  }
  if (!inv.invoice_date) {
    errors.push('Invoice date is missing');
  }
  const value = inv.taxable_value || inv.gross_total || 0;
  if (value <= 0) {
    errors.push('Taxable or invoice value must be greater than zero');
  }
  if (inv.section === 'b2b' && inv.customer_gstin && !isValidGstin(inv.customer_gstin)) {
    errors.push('Customer GSTIN is invalid (check format and check digit)');
  }
  if (!inv.customer_gstin && inv.section === 'b2b') {
    errors.push('B2B row requires customer GSTIN');
  }

  let status: 'valid' | 'warning' | 'error' = 'valid';
  if (errors.length) status = 'error';
  else if (warnings.length) status = 'warning';
  return { status, errors, warnings };
}
