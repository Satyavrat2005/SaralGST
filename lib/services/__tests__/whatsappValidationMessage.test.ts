import { describe, it, expect } from 'vitest';
import type { ValidationError } from '../validationService';
import {
  categorizePurchaseErrors,
  buildPurchaseValidationMessage,
  appendMissingFromExtractedData,
} from '../whatsappValidationMessage';

describe('whatsappValidationMessage', () => {
  const screenshotLikeErrors: ValidationError[] = [
    {
      field: 'hsn_or_sac',
      issue_type: 'missing',
      detected_value: null,
      message: 'HSN/SAC Code is required for GST filing (GSTR-2B compliance)',
    },
    {
      field: 'quantity',
      issue_type: 'missing',
      detected_value: null,
      message: 'Quantity is recommended for complete invoice records',
    },
    {
      field: 'unit',
      issue_type: 'missing',
      detected_value: null,
      message: 'Unit of Measure is recommended for complete invoice records',
    },
    {
      field: 'rate_per_unit',
      issue_type: 'missing',
      detected_value: null,
      message: 'Rate per Unit is recommended for complete invoice records',
    },
    {
      field: 'supplier_gstin',
      issue_type: 'invalid_format',
      detected_value: '123',
      expected_value: '15 character GSTIN',
      message: 'supplier_gstin must be 15 characters long',
    },
  ];

  it('categorizes critical missing vs recommended vs other issues', () => {
    const cat = categorizePurchaseErrors(screenshotLikeErrors);
    expect(cat.missingCritical).toHaveLength(1);
    expect(cat.missingCritical[0].label).toBe('HSN/SAC Code');
    expect(cat.missingRecommended).toHaveLength(3);
    expect(cat.otherIssues).toHaveLength(1);
    expect(cat.otherIssues[0].issueType).toBe('invalid_format');
  });

  it('dedupes duplicate field entries', () => {
    const duped: ValidationError[] = [
      ...screenshotLikeErrors,
      {
        field: 'quantity',
        issue_type: 'missing',
        detected_value: null,
        message: 'Quantity is recommended for complete invoice records',
      },
    ];
    const cat = categorizePurchaseErrors(duped);
    expect(cat.missingRecommended.filter((i) => i.field === 'quantity')).toHaveLength(1);
  });

  it('formats WhatsApp message with sections and bullets', () => {
    const text = buildPurchaseValidationMessage(screenshotLikeErrors, {
      kind: 'purchase',
      invoiceNumber: 'INV-99',
    });

    expect(text).toContain('*Missing information*');
    expect(text).toContain('HSN/SAC Code');
    expect(text).toContain('This field is missing or empty in the invoice.');
    expect(text).toContain('*Recommended fields*');
    expect(text).toContain('Quantity');
    expect(text).toContain('Unit of Measure');
    expect(text).toContain('Rate per Unit');
    expect(text).toContain('*Validation issues*');
    expect(text).toContain('Vendor GSTIN');
    expect(text).toContain('invalid format');
    expect(text).toContain('INV-99');
    expect(text).toContain('Please correct the PDF and resend');
  });

  it('appendMissingFromExtractedData adds empty line items not in errors', () => {
    const onlyGstin: ValidationError[] = [
      {
        field: 'supplier_gstin',
        issue_type: 'invalid_format',
        detected_value: 'x',
        message: 'supplier_gstin format is invalid',
      },
    ];
    let cat = categorizePurchaseErrors(onlyGstin);
    cat = appendMissingFromExtractedData(
      cat,
      { hsn_or_sac: '', quantity: '', unit: '', rate_per_unit: '' },
      'purchase'
    );
    expect(cat.missingRecommended.some((i) => i.label === 'HSN/SAC Code')).toBe(true);
    expect(cat.missingRecommended.some((i) => i.label === 'Quantity')).toBe(true);
  });

  it('uses escalation footer when willEscalate', () => {
    const text = buildPurchaseValidationMessage(screenshotLikeErrors, {
      willEscalate: true,
    });
    expect(text).toContain('Our team will review this manually');
  });
});
