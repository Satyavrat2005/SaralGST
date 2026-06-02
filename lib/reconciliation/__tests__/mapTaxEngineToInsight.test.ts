import { describe, it, expect } from 'vitest';
import { classifyDiscrepancy } from '../classifyDiscrepancy';
import {
  buildSyntheticTaxEngineOutput,
  mapTaxEngineToInsightBundle,
} from '../mapTaxEngineToInsight';

describe('TaxEngine insight mapping', () => {
  it('maps missing_in_gstr2b to Rule_02', () => {
    const classification = classifyDiscrepancy('missing_in_gstr2b', {
      purchase: {
        invoice_number: 'P-1',
        supplier_gstin: '27AABCU9603R1ZM',
        taxable_value: 5000,
        igst_amount: 900,
      },
    });
    expect(classification.ruleTriggered).toBe('Rule_02_Missing_Supplier_Upload');

    const output = buildSyntheticTaxEngineOutput('missing_in_gstr2b', classification, {
      purchase: {
        invoice_number: 'P-1',
        supplier_gstin: '27AABCU9603R1ZM',
        taxable_value: 5000,
      },
    });
    const bundle = mapTaxEngineToInsightBundle(
      output,
      classification,
      'missing_in_gstr2b',
      'P-1',
      'rules'
    );
    expect(bundle.audit?.ruleTriggered).toBe('Rule_02_Missing_Supplier_Upload');
    expect(bundle.narrative.summary).toContain('Rule execution triggered');
    expect(bundle.narrative.actions.length).toBeGreaterThan(0);
  });

  it('maps value mismatch to Rule_01 with variance details', () => {
    const classification = classifyDiscrepancy('value_mismatch', {
      gstr2b: { invoice_number: 'V-1', supplier_gstin: '27X', taxable_value: 9500 },
      purchase: { invoice_number: 'V-1', supplier_gstin: '27X', taxable_value: 10000 },
      diff: { taxable: 500, tax: 90 },
    });
    expect(classification.ruleTriggered).toBe('Rule_01_Value_Mismatch');

    const output = buildSyntheticTaxEngineOutput('value_mismatch', classification, {
      gstr2b: { invoice_number: 'V-1', taxable_value: 9500 },
      purchase: { invoice_number: 'V-1', taxable_value: 10000 },
      diff: { taxable: 500, tax: 90 },
    });
    const bundle = mapTaxEngineToInsightBundle(
      output,
      classification,
      'value_mismatch',
      'V-1',
      'rules'
    );
    expect(bundle.audit?.varianceDetails?.purchase_register_val).toBe(10000);
    expect(bundle.audit?.varianceDetails?.gstr_2b_val).toBe(9500);
  });
});
