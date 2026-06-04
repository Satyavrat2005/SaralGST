import { describe, it, expect } from 'vitest';
import { buildGstr1ReturnData } from '../buildSummaries';
import { classifySalesInvoice } from '../classifyInvoice';
import { buildDksMarchMockInvoices } from '../dksMarchDemo';
import {
  buildGstnPayload,
  mapHsnRowToGstn,
  usesBifurcatedHsnFormat,
} from '../buildGstnPayload';
import type { BusinessProfileContext } from '../types';

const dksProfile: BusinessProfileContext = {
  gstin: '27AATFD2632G1ZC',
  legal_name: 'DEV KAILASH STEEL',
  trade_name: 'DEV KAILASH STEEL',
  state_cd: '27',
  annual_turnover_range: 'Above 5 Cr',
};

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
    const invoices = buildDksMarchMockInvoices('test-return', 'test-user');
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

  it('maps intra-state HSN without iamt (CGST+SGST only)', () => {
    const row = mapHsnRowToGstn(
      {
        hsn: '72142090',
        uqc: 'MTS',
        qty: 10,
        rate: 18,
        taxable: 1000,
        igst: 0,
        cgst: 90,
        sgst: 90,
        cess: 0,
        count: 1,
      },
      0
    );
    expect(row).not.toHaveProperty('iamt');
    expect(row.camt).toBe(90);
    expect(row.samt).toBe(90);
  });

  it('maps inter-state HSN with iamt only (no CGST/SGST)', () => {
    const row = mapHsnRowToGstn(
      {
        hsn: '72142090',
        uqc: 'MTS',
        qty: 1,
        rate: 18,
        taxable: 1000,
        igst: 180,
        cgst: 0,
        sgst: 0,
        cess: 0,
        count: 1,
      },
      0
    );
    expect(row.iamt).toBe(180);
    expect(row).not.toHaveProperty('camt');
    expect(row).not.toHaveProperty('samt');
  });

  it('uses legacy hsn.data for March 2025 and bifurcated arrays for May 2025', () => {
    const invoices = buildDksMarchMockInvoices('r', 'u');
    const data = buildGstr1ReturnData(invoices, dksProfile, '2024-25', '032025');
    const intraOnly: typeof data = {
      ...data,
      hsn_b2b: [
        {
          hsn: '72142090',
          uqc: 'MTS',
          qty: 20,
          rate: 18,
          taxable: 100000,
          igst: 0,
          cgst: 9000,
          sgst: 9000,
          cess: 0,
          count: 20,
        },
      ],
      hsn_b2c: [],
    };

    expect(usesBifurcatedHsnFormat('032025')).toBe(false);
    expect(usesBifurcatedHsnFormat('052025')).toBe(true);

    const marchPayload = buildGstnPayload(invoices, intraOnly, '032025', dksProfile.gstin);
    const hsnMarch = marchPayload.hsn as { data?: Record<string, unknown>[]; hsn_b2b?: unknown[] };
    expect(hsnMarch.data).toHaveLength(1);
    expect(hsnMarch).not.toHaveProperty('hsn_b2b');
    expect(hsnMarch.data![0]).not.toHaveProperty('iamt');
    expect(hsnMarch.data![0].camt).toBe(9000);

    const mayPayload = buildGstnPayload(invoices, intraOnly, '052025', dksProfile.gstin);
    const hsnMay = mayPayload.hsn as { data?: unknown[]; hsn_b2b?: unknown[]; hsn_b2c?: unknown[] };
    expect(hsnMay.hsn_b2b).toHaveLength(1);
    expect(hsnMay.hsn_b2c).toEqual([]);
    expect(hsnMay).not.toHaveProperty('data');
    expect(hsnMay.hsn_b2b![0]).not.toHaveProperty('iamt');
  });
});
