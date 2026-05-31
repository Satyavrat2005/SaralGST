import type { Gstr1InvoiceInsert, Gstr1ReturnData } from './types';
import { getRequiredHsnDigits, isValidGstin, normalizeGstin } from './utils';
import type { BusinessProfileContext } from './types';

export interface Gstr1ValidationIssue {
  level: 'error' | 'warning';
  message: string;
  invoice_id?: string;
}

export interface Gstr1ValidationResult {
  isValid: boolean;
  errors: Gstr1ValidationIssue[];
  warnings: Gstr1ValidationIssue[];
}

export function validateGstr1Return(
  invoices: Gstr1InvoiceInsert[],
  returnData: Gstr1ReturnData,
  profile: BusinessProfileContext
): Gstr1ValidationResult {
  const errors: Gstr1ValidationIssue[] = [];
  const warnings: Gstr1ValidationIssue[] = [];

  const outwardCount =
    returnData.sections['4A'].count +
    returnData.sections['5'].count +
    returnData.sections['7'].count;

  if (outwardCount > 0 && returnData.sections['13'].net_issued === 0) {
    errors.push({
      level: 'error',
      message: 'Table 13 (Documents Issued) is required when outward supplies are reported.',
    });
  }

  if (outwardCount > 0 && returnData.sections['12_b2b'].hsn_rows === 0 && returnData.sections['4A'].count > 0) {
    errors.push({
      level: 'error',
      message: 'Table 12 B2B HSN summary is required when B2B invoices exist.',
    });
  }

  const invoiceNumbers = new Set<string>();
  invoices.forEach((inv) => {
    if (inv.validation_status === 'error') {
      errors.push({
        level: 'error',
        message: `Invoice ${inv.invoice_number || '(no number)'} has validation errors.`,
        invoice_id: inv.source_invoice_id,
      });
    }

    if (inv.section === 'b2b' && inv.invoice_number) {
      const key = `${inv.counterparty_gstin}_${inv.invoice_number}`;
      if (invoiceNumbers.has(key)) {
        errors.push({
          level: 'error',
          message: `Duplicate B2B invoice ${inv.invoice_number} for ${inv.counterparty_gstin}.`,
        });
      }
      invoiceNumbers.add(key);
    }
  });

  returnData.validation_warnings.forEach((msg) => {
    warnings.push({ level: 'warning', message: msg });
  });

  const hsnDigits = getRequiredHsnDigits(profile.annual_turnover_range);
  [...returnData.hsn_b2b, ...returnData.hsn_b2c].forEach((row) => {
    const digits = (row.hsn || '').replace(/\D/g, '').length;
    if (digits > 0 && digits < hsnDigits) {
      warnings.push({
        level: 'warning',
        message: `HSN ${row.hsn}: minimum ${hsnDigits} digits required for your turnover slab.`,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/** Buyer GSTINs that would fail GSTN portal save (RET11410 / RET191113). */
export function getPortalGstinIssues(
  invoices: Gstr1InvoiceInsert[],
  filerGstin: string
): Gstr1ValidationIssue[] {
  const issues: Gstr1ValidationIssue[] = [];
  const filer = normalizeGstin(filerGstin) || filerGstin.trim().toUpperCase();

  invoices.forEach((inv) => {
    if (inv.section !== 'b2b' || !inv.counterparty_gstin) return;
    const ctin = inv.counterparty_gstin.trim().toUpperCase();
    const label = inv.invoice_number ? `Invoice ${inv.invoice_number}` : 'A B2B invoice';

    if (ctin === filer) {
      issues.push({
        level: 'error',
        message: `${label}: customer GSTIN ${ctin} is the same as your GSTIN — use B2C or correct the buyer GSTIN in Sales Register.`,
        invoice_id: inv.source_invoice_id,
      });
      return;
    }

    if (!isValidGstin(ctin)) {
      issues.push({
        level: 'error',
        message: `${label}: customer GSTIN "${ctin}" is invalid (wrong format or check digit). Correct it in Sales Register or remove GSTIN to report as B2C.`,
        invoice_id: inv.source_invoice_id,
      });
    }
  });

  return issues;
}
