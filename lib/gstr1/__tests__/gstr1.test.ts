import { describe, it, expect } from 'vitest';
import { buildGstr1ReturnData } from '../buildSummaries';
import { classifySalesInvoice } from '../classifyInvoice';
import type { BusinessProfileContext, Gstr1InvoiceInsert } from '../types';

const dksProfile: BusinessProfileContext = {
  gstin: '27AATFD2632G1ZC',
  legal_name: 'DEV KAILASH STEEL',
  trade_name: 'DEV KAILASH STEEL',
  state_cd: '27',
  annual_turnover_range: 'Above 5 Cr',
};

/** Synthetic 35 B2B invoices matching DKS Mar 2025 PDF aggregate totals */
function buildDksMockInvoices(): Gstr1InvoiceInsert[] {
  const perInvoiceTaxable = 8335591.43 / 35;
  const perIgst = 50863.32 / 35;
  const perCgst = 499135.98 / 35;
  const perSgst = 499135.98 / 35;
  const rows: Gstr1InvoiceInsert[] = [];

  for (let i = 1; i <= 35; i++) {
    rows.push({
      return_id: 'test-return',
      user_id: 'test-user',
      section: 'b2b',
      invoice_number: `INV-${1000 + i}`,
      invoice_date: '2025-03-15',
      invoice_value: perInvoiceTaxable + perCgst + perSgst + perIgst,
      place_of_supply: '27',
      counterparty_gstin: '29AAACW3775F1Z2',
      counterparty_name: `Customer ${i}`,
      taxable_value: perInvoiceTaxable,
      igst_amount: perIgst,
      cgst_amount: perCgst,
      sgst_amount: perSgst,
      cess_amount: 0,
      tax_rate: 18,
      invoice_type: 'R',
      reverse_charge: false,
      hsn_code: i <= 20 ? '72142090' : '73089090',
      description: null,
      uqc: 'MTS',
      quantity: 1,
      validation_status: 'valid',
      validation_errors: null,
      source: 'sales_register',
      source_invoice_id: `inv-${i}`,
    });
  }
  return rows;
}

describe('GSTR-1 DKS Mar 2025 acceptance', () => {
  it('classifies B2B when customer GSTIN is present', () => {
    const section = classifySalesInvoice(
      {
        id: '1',
        invoice_number: 'X',
        invoice_date: '2025-03-01',
        invoice_type: 'B2B',
        customer_name: 'A',
        customer_gstin: '29AAACW3775F1Z2',
        place_of_supply: '27',
        hsn_sac_code: '7214',
        quantity: 1,
        uqc: 'MTS',
        taxable_value: 1000,
        cgst_amount: 90,
        sgst_amount: 90,
        igst_amount: 0,
        tcs_cess: 0,
        gross_total: 1180,
        reverse_charge: false,
        voucher_type: null,
      },
      dksProfile
    );
    expect(section).toBe('b2b');
  });

  it('summary matches DKS PDF totals for 35 B2B invoices', () => {
    const invoices = buildDksMockInvoices();
    const data = buildGstr1ReturnData(invoices, dksProfile, '2024-25', '032025');

    expect(data.sections['4A'].count).toBe(35);
    expect(Math.round(data.sections['4A'].value)).toBe(8335591);
    expect(Math.round(data.sections['4A'].igst)).toBe(50863);
    expect(Math.round(data.sections['4A'].cgst)).toBe(499136);
    expect(Math.round(data.sections['4A'].sgst)).toBe(499136);
    expect(data.sections['12_b2b'].hsn_rows).toBe(2);
    expect(data.sections['13'].net_issued).toBe(35);
  });

  it('uses B2CL threshold 1L for post-Aug-2024 invoices', () => {
    const section = classifySalesInvoice(
      {
        id: '2',
        invoice_number: 'R1',
        invoice_date: '2025-03-01',
        invoice_type: 'B2C',
        customer_name: 'Retail',
        customer_gstin: null,
        place_of_supply: '29',
        hsn_sac_code: null,
        quantity: null,
        uqc: null,
        taxable_value: 150000,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 27000,
        tcs_cess: 0,
        gross_total: 177000,
        reverse_charge: false,
        voucher_type: null,
      },
      dksProfile
    );
    expect(section).toBe('b2cl');
  });
});
