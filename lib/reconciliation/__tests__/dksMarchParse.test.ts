import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as XLSX from 'xlsx';
import { parseGstr2bWorkbook } from '@/lib/gstr2b/parseGstr2bExcel';
import { loadDksMarchReconciliationSources } from '../dksMarchReconciliation';

describe('DKS March file reconciliation sources', () => {
  it('parses GSTR-2B excel B2B rows', () => {
    const xlsxPath = join(process.cwd(), 'public', "DKS - GSTR-2B_MAR'25 - FINAL.xlsx");
    if (!existsSync(xlsxPath)) return;
    const buf = readFileSync(xlsxPath);
    const wb = XLSX.read(buf, { type: 'buffer' });
    const model = parseGstr2bWorkbook(wb);
    expect(model.b2b.length).toBeGreaterThan(0);
    expect(model.meta.taxPeriod.toLowerCase()).toContain('march');
  });

  it('loads both DKS sources and runs reconciliation', () => {
    const result = loadDksMarchReconciliationSources();
    if (!result) return;
    expect(result.gstr2bRows.length).toBeGreaterThan(0);
    expect(result.purchaseRows.length).toBeGreaterThan(0);
    expect(result.period).toBe('032025');
    expect(result.recon.stats.total_gstr2b).toBe(result.gstr2bRows.length);
  });
});
