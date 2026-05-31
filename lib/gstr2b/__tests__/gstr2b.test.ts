import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseGstr2bResponse } from '../parseGstr2bResponse';
import { buildGstr2bReturnData, getUiSectionCounts } from '../buildSummaries';
import { reconcileGstr2bWithPurchase } from '../reconcileWithPurchase';
import { checkGstr2bPeriodFetchable, SANDBOX_GSTR2B_PERIOD } from '../periodValidation';
import { toGstr2bDbRow } from '../dbRow';
import type { Gstr2bDocumentRow, PurchaseRegisterRow } from '../types';

const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'sample-gstr2b.json'), 'utf-8')
);

describe('GSTR-2B parse and summarize', () => {
  it('parses B2B, CDNR, ISD, IMPG at invoice level', () => {
    const rows = parseGstr2bResponse(fixture, 'ret-1', 'user-1');
    expect(rows).toHaveLength(4);
    expect(rows.filter((r) => r.section === 'b2b')).toHaveLength(1);
    expect(rows.filter((r) => r.section === 'cdnr')).toHaveLength(1);
    expect(rows.filter((r) => r.section === 'isd')).toHaveLength(1);
    expect(rows.filter((r) => r.section === 'impg')).toHaveLength(1);

    const b2b = rows.find((r) => r.section === 'b2b')!;
    expect(b2b.taxable_value).toBe(100000);
    expect(b2b.cgst_amount).toBe(9000);
    expect(b2b.itc_eligible).toBe(true);
    expect(b2b.line_count).toBe(1);

    const cdnr = rows.find((r) => r.section === 'cdnr')!;
    expect(cdnr.taxable_value).toBe(-5000);
    expect(cdnr.note_type).toBe('C');
  });

  it('builds Table 3/4 summaries', () => {
    const rows = parseGstr2bResponse(fixture, 'ret-1', 'user-1');
    const data = buildGstr2bReturnData(rows, '032025');
    expect(data.summary_table3.count).toBe(4);
    expect(data.summary_table3.taxable).toBeGreaterThan(0);
    expect(getUiSectionCounts(data.sections).b2b).toBe(1);
    expect(getUiSectionCounts(data.sections).cdnr).toBe(1);
    expect(getUiSectionCounts(data.sections).isd).toBe(1);
    expect(getUiSectionCounts(data.sections).impg).toBe(1);
  });
});

describe('GSTR-2B reconciliation', () => {
  const gstr2bRows: Array<Gstr2bDocumentRow & { id: string }> = [
    {
      id: 'g1',
      return_id: 'r1',
      user_id: 'u1',
      section: 'b2b',
      supplier_gstin: '27AABCU9603R1ZM',
      supplier_name: 'Test',
      invoice_number: 'INV-1001',
      invoice_date: '2025-03-15',
      invoice_value: 118000,
      place_of_supply: '27',
      taxable_value: 100000,
      igst_amount: 0,
      cgst_amount: 9000,
      sgst_amount: 9000,
      cess_amount: 0,
      tax_rate: 18,
      itc_eligible: true,
      itc_igst: 0,
      itc_cgst: 9000,
      itc_sgst: 9000,
      itc_cess: 0,
    },
  ];

  const purchaseRows: PurchaseRegisterRow[] = [
    {
      id: 'p1',
      supplier_gstin: '27AABCU9603R1ZM',
      invoice_number: 'INV-1001',
      invoice_date: '2025-03-15',
      taxable_value: 100000,
      cgst_amount: 9000,
      sgst_amount: 9000,
      igst_amount: 0,
      cess_amount: 0,
    },
    {
      id: 'p2',
      supplier_gstin: '27AAAAA0000A1Z5',
      invoice_number: 'INV-MISSING',
      invoice_date: '2025-03-16',
      taxable_value: 5000,
      cgst_amount: 450,
      sgst_amount: 450,
    },
  ];

  it('matches exact purchase rows and finds missing in GSTR-2B', () => {
    const out = reconcileGstr2bWithPurchase(gstr2bRows, purchaseRows);
    expect(out.stats.matched).toBe(1);
    expect(out.stats.missing_in_gstr2b).toBe(1);
    expect(out.missingInGstr2b).toHaveLength(1);
    expect(out.gstr2bUpdates[0].matched_purchase_id).toBe('p1');
  });
});

describe('GSTR-2B db row mapping', () => {
  it('strips parser-only fields before insert', () => {
    const rows = parseGstr2bResponse(fixture, 'ret-1', 'user-1');
    const dbRow = toGstr2bDbRow(rows[0]);
    expect(dbRow).not.toHaveProperty('line_count');
    expect(dbRow).not.toHaveProperty('note_type');
    expect(dbRow).not.toHaveProperty('reverse_charge');
    expect(dbRow.section).toBe('b2b');
    expect(dbRow.taxable_value).toBe(100000);
  });
});

describe('GSTR-2B period validation', () => {
  it('blocks current month before 14th of next month', () => {
    const check = checkGstr2bPeriodFetchable('052026', new Date('2026-05-31'));
    expect(check.blocked).toBe(true);
    expect(check.code).toBe('IMS2B009');
    expect(check.suggestedPeriod).toBe(SANDBOX_GSTR2B_PERIOD);
  });

  it('allows past periods after cut-off', () => {
    const check = checkGstr2bPeriodFetchable('042026', new Date('2026-05-31'));
    expect(check.blocked).toBe(false);
  });
});
