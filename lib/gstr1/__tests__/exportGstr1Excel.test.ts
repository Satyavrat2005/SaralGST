import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { buildGstr1ReturnData } from '../buildSummaries';
import { buildDksMarchMockInvoices } from '../dksMarchDemo';
import {
  buildGstr1Workbook,
  formatGstr1PortalDate,
  buildGstr1DownloadFilename,
} from '../exportGstr1Excel';
import type { BusinessProfileContext } from '../types';

const dksProfile: BusinessProfileContext = {
  gstin: '27AATFD2632G1ZC',
  legal_name: 'DEV KAILASH STEEL',
  trade_name: 'DEV KAILASH STEEL',
  state_cd: '27',
  annual_turnover_range: 'Above 5 Cr',
};

describe('exportGstr1Excel', () => {
  it('formats portal dates as DD-MMM-YYYY', () => {
    expect(formatGstr1PortalDate('2025-03-15')).toBe('15-Mar-2025');
  });

  it('builds workbook with expected sheets and B2B row count', () => {
    const invoices = buildDksMarchMockInvoices('ret-1', 'user-1');
    const returnData = buildGstr1ReturnData(invoices, dksProfile, '2024-25', '032025');
    const wb = buildGstr1Workbook(returnData, invoices, 'March 2025');

    expect(wb.SheetNames).toContain('Read me');
    expect(wb.SheetNames).toContain('b2b');
    expect(wb.SheetNames).toContain('hsn(b2b)');
    expect(wb.SheetNames).toContain('Return Summary');
    expect(wb.SheetNames.indexOf('Return Summary')).toBe(1);

    const b2bRows = XLSX.utils.sheet_to_json(wb.Sheets['b2b'], { header: 1 }) as unknown[][];
    expect(b2bRows.length).toBe(36); // header + 35 invoices

    const summaryRows = XLSX.utils.sheet_to_json(wb.Sheets['Return Summary'], { header: 1 }) as unknown[][];
    expect(summaryRows.some((r) => r[0] === 'GSTR-1 RETURN SUMMARY')).toBe(true);
    expect(summaryRows.some((r) => r[0] === 'GSTIN' && r[1] === '27AATFD2632G1ZC')).toBe(true);
    const totalRow = summaryRows.find((r) => r[0] === 'Total Liability');
    expect(totalRow).toBeDefined();
    expect(Math.round(Number(totalRow?.[3]))).toBe(8335591);
    const section4a = summaryRows.find((r) => r[0] === '4A' && r[1] === 'B2B Regular');
    expect(section4a).toBeDefined();
    expect(section4a?.[2]).toBe(35);
  });

  it('builds download filename with company and period', () => {
    const invoices = buildDksMarchMockInvoices('ret-1', 'user-1');
    const returnData = buildGstr1ReturnData(invoices, dksProfile, '2024-25', '032025');
    const name = buildGstr1DownloadFilename(returnData, 'March 2025');
    expect(name).toMatch(/^GSTR-1_March-2025_DEV-KAILASH-STEEL/);
    expect(name.endsWith('.xlsx')).toBe(true);
  });
});
