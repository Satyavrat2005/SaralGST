import * as XLSX from 'xlsx';
import type { WorkBook } from 'xlsx';

export const GSTR2B_EXCEL_ASSET_PATH = "/DKS%20-%20GSTR-2B_MAR%2725%20-%20FINAL.xlsx";

export interface Gstr2bExcelMeta {
  financialYear: string;
  taxPeriod: string;
  gstin: string;
  legalName: string;
  tradeName: string;
  generatedOn: string;
}

export interface Gstr2bItcSummaryRow {
  heading: string;
  gstr3bTable: string;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  advisory: string;
}

export interface Gstr2bB2bInvoiceRow {
  supplierGstin: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceType: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  reverseCharge: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  returnPeriod: string;
  filingDate: string;
  itcAvailable: string;
  reason: string;
}

export interface Gstr2bExcelViewModel {
  meta: Gstr2bExcelMeta;
  itcAvailable: Gstr2bItcSummaryRow[];
  itcNotAvailable: Gstr2bItcSummaryRow[];
  b2b: Gstr2bB2bInvoiceRow[];
  b2ba: Gstr2bB2bInvoiceRow[];
}

function cell(rows: unknown[][], row: number, col: number): string {
  const v = rows[row]?.[col];
  if (v == null || v === '') return '';
  return String(v).trim();
}

function num(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

function parseMetaSheet(rows: unknown[][]): Gstr2bExcelMeta {
  return {
    financialYear: cell(rows, 3, 2) || cell(rows, 3, 1),
    taxPeriod: cell(rows, 4, 2) || cell(rows, 4, 1),
    gstin: cell(rows, 5, 2) || cell(rows, 5, 1),
    legalName: cell(rows, 6, 2) || cell(rows, 6, 1),
    tradeName: cell(rows, 7, 2) || cell(rows, 7, 1),
    generatedOn: cell(rows, 8, 2) || cell(rows, 8, 1),
  };
}

function parseItcSummarySheet(rows: unknown[][]): Gstr2bItcSummaryRow[] {
  const out: Gstr2bItcSummaryRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row[0] !== 'I') continue;
    const heading = cell(rows, i, 1);
    if (!heading || heading.includes('Credit which')) continue;
    out.push({
      heading,
      gstr3bTable: cell(rows, i, 2),
      igst: num(row[3]),
      cgst: num(row[4]),
      sgst: num(row[5]),
      cess: num(row[6]),
      advisory: cell(rows, i, 7),
    });
  }
  return out;
}

function isGstin(value: string): boolean {
  return /^[0-9]{2}[A-Z0-9]{13}$/.test(value);
}

function parseB2bSheet(rows: unknown[][]): Gstr2bB2bInvoiceRow[] {
  const out: Gstr2bB2bInvoiceRow[] = [];
  for (let i = 7; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const gstin = cell(rows, i, 0);
    if (!isGstin(gstin)) continue;
    out.push({
      supplierGstin: gstin,
      supplierName: cell(rows, i, 1),
      invoiceNumber: cell(rows, i, 2),
      invoiceType: cell(rows, i, 3),
      invoiceDate: cell(rows, i, 4),
      invoiceValue: num(row[5]),
      placeOfSupply: cell(rows, i, 6),
      reverseCharge: cell(rows, i, 7),
      taxableValue: num(row[8]),
      igst: num(row[9]),
      cgst: num(row[10]),
      sgst: num(row[11]),
      cess: num(row[12]),
      returnPeriod: cell(rows, i, 13),
      filingDate: cell(rows, i, 14),
      itcAvailable: cell(rows, i, 15),
      reason: cell(rows, i, 16),
    });
  }
  return out;
}

function parseB2baSheet(rows: unknown[][]): Gstr2bB2bInvoiceRow[] {
  const out: Gstr2bB2bInvoiceRow[] = [];
  for (let i = 7; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const gstin = cell(rows, i, 2);
    if (!isGstin(gstin)) continue;
    out.push({
      supplierGstin: gstin,
      supplierName: cell(rows, i, 3),
      invoiceNumber: cell(rows, i, 4),
      invoiceType: cell(rows, i, 5),
      invoiceDate: cell(rows, i, 6),
      invoiceValue: num(row[7]),
      placeOfSupply: cell(rows, i, 8),
      reverseCharge: cell(rows, i, 9),
      taxableValue: num(row[10]),
      igst: num(row[11]),
      cgst: num(row[12]),
      sgst: num(row[13]),
      cess: num(row[14]),
      returnPeriod: cell(rows, i, 15),
      filingDate: cell(rows, i, 16),
      itcAvailable: cell(rows, i, 17),
      reason: cell(rows, i, 18),
    });
  }
  return out;
}

export function parseGstr2bWorkbook(wb: WorkBook): Gstr2bExcelViewModel {
  const sheetRows = (name: string) =>
    XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' }) as unknown[][];

  return {
    meta: parseMetaSheet(sheetRows('Read me')),
    itcAvailable: parseItcSummarySheet(sheetRows('ITC Available')),
    itcNotAvailable: parseItcSummarySheet(sheetRows('ITC not available')),
    b2b: parseB2bSheet(sheetRows('B2B')),
    b2ba: parseB2baSheet(sheetRows('B2BA')),
  };
}

export function buildGstr2bDownloadFilename(
  periodLabel: string,
  meta: Gstr2bExcelMeta
): string {
  const period = (meta.taxPeriod || periodLabel)
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
  const company = (meta.legalName || meta.tradeName || 'Taxpayer')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const fy = (meta.financialYear || '').replace(/\//g, '-').replace(/\s+/g, '');
  const parts = ['GSTR-2B', period, company].filter(Boolean);
  if (fy) parts.push(fy);
  return `${parts.join('_')}.xlsx`;
}

export function sumItcAvailable(rows: Gstr2bItcSummaryRow[]) {
  return rows.reduce(
    (acc, r) => ({
      igst: acc.igst + r.igst,
      cgst: acc.cgst + r.cgst,
      sgst: acc.sgst + r.sgst,
      cess: acc.cess + r.cess,
    }),
    { igst: 0, cgst: 0, sgst: 0, cess: 0 }
  );
}
