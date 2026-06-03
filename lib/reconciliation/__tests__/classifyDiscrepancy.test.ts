import { describe, it, expect } from 'vitest';
import { classifyDiscrepancy, buildInsightCacheKey } from '../classifyDiscrepancy';

describe('classifyDiscrepancy', () => {
  it('classifies missing_in_books with supplier reported factor', () => {
    const result = classifyDiscrepancy('missing_in_books', {
      gstr2b: {
        invoice_number: 'INV-100',
        supplier_gstin: '27AABCU9603R1ZM',
        supplier_name: 'Acme Supplies',
        taxable_value: 10000,
        igst_amount: 1800,
        cgst_amount: 0,
        sgst_amount: 0,
        itc_eligible: true,
      },
      returnPeriod: '032026',
    });
    expect(result.category).toBe('in_gstr2b_not_in_books');
    expect(result.ruleTriggered).toBe('Rule_03_Unrecorded_Supplier_Invoice');
    expect(result.factors.some((f) => f.code === 'SUPPLIER_REPORTED')).toBe(true);
    expect(result.suggestedActions.length).toBeGreaterThanOrEqual(3);
  });

  it('classifies missing_in_gstr2b without GSTIN as data_entry_gap', () => {
    const result = classifyDiscrepancy('missing_in_gstr2b', {
      purchase: {
        invoice_number: 'P-55',
        supplier_name: 'Local Vendor',
        taxable_value: 5000,
        cgst_amount: 450,
        sgst_amount: 450,
      },
      returnPeriod: '032026',
    });
    expect(result.category).toBe('data_entry_gap');
    expect(result.factors.some((f) => f.code === 'MISSING_GSTIN')).toBe(true);
  });

  it('classifies missing_in_gstr2b with GSTIN as supplier_not_filed', () => {
    const result = classifyDiscrepancy('missing_in_gstr2b', {
      purchase: {
        invoice_number: 'P-99',
        supplier_gstin: '24AABCU9603R1ZX',
        taxable_value: 20000,
        igst_amount: 3600,
      },
    });
    expect(result.category).toBe('supplier_not_filed');
    expect(result.factors.some((f) => f.code === 'SUPPLIER_GSTR1_CHAIN')).toBe(true);
  });

  it('classifies value_mismatch within tolerance as rounding_variance', () => {
    const result = classifyDiscrepancy('value_mismatch', {
      gstr2b: {
        invoice_number: 'M-1',
        supplier_gstin: '27AABCU9603R1ZM',
        taxable_value: 10000,
      },
      purchase: {
        invoice_number: 'M-1',
        supplier_gstin: '27AABCU9603R1ZM',
        taxable_value: 10000.5,
      },
      diff: { taxable: 0.5, tax: 0 },
    });
    expect(result.category).toBe('rounding_variance');
    expect(result.severity).toBe('low');
  });

  it('classifies material value_mismatch as amount_mismatch with higher severity', () => {
    const result = classifyDiscrepancy('value_mismatch', {
      gstr2b: {
        invoice_number: 'M-2',
        supplier_gstin: '27AABCU9603R1ZM',
        taxable_value: 10000,
        igst_amount: 1800,
      },
      purchase: {
        invoice_number: 'M-2',
        supplier_gstin: '27AABCU9603R1ZM',
        taxable_value: 15000,
        igst_amount: 2700,
      },
      diff: { taxable: 5000, tax: 900 },
    });
    expect(result.category).toBe('amount_mismatch');
    expect(['medium', 'high']).toContain(result.severity);
    expect(result.factors.some((f) => f.code === 'TAX_HEAD_DIFF')).toBe(true);
  });
});

describe('buildInsightCacheKey', () => {
  it('produces stable keys for same invoice context', () => {
    const a = buildInsightCacheKey({
      returnId: 'ret-1',
      discrepancyType: 'value_mismatch',
      gstr2b: { supplier_gstin: '27X', invoice_number: 'INV-1', taxable_value: 100 },
      purchase: { taxable_value: 110 },
      diff: { taxable: 10 },
    });
    const b = buildInsightCacheKey({
      returnId: 'ret-1',
      discrepancyType: 'value_mismatch',
      gstr2b: { supplier_gstin: '27X', invoice_number: 'INV-1', taxable_value: 100 },
      purchase: { taxable_value: 110 },
      diff: { taxable: 10 },
    });
    expect(a).toBe(b);
    expect(a.endsWith('|te42')).toBe(true);
  });
});
