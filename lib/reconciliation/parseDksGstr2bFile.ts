import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as XLSX from 'xlsx';
import { parseGstr2bWorkbook } from '@/lib/gstr2b/parseGstr2bExcel';
import type { Gstr2bDocumentRow } from '@/lib/gstr2b/types';
import type { PurchaseRegisterRow } from '@/lib/gstr2b/types';

export const DKS_GSTR2B_FILENAME = "DKS - GSTR-2B_MAR'25 - FINAL.xlsx";
export const DKS_GSTR1_PDF_FILENAME = "DKS - GSTR1_MAR'25 - OK.pdf";
import { DKS_MARCH_PERIOD } from './dksMarchConstants';

export { DKS_MARCH_PERIOD };

const RETURN_ID = 'dks-mar25-2b';
const USER_ID = 'dks-mar25-user';

function resolveProjectPath(...segments: string[]): string | null {
  const candidates = [
    join(process.cwd(), ...segments),
    join(process.cwd(), 'public', ...segments.slice(-1)),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function parseInvoiceDate(raw: string): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

function excelRowToGstr2b(
  row: {
    supplierGstin: string;
    supplierName: string;
    invoiceNumber: string;
    invoiceDate: string;
    invoiceValue: number;
    placeOfSupply: string;
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    itcAvailable: string;
  },
  section: 'b2b' | 'b2ba',
  index: number
): Gstr2bDocumentRow & { id: string } {
  const itcEligible =
    !row.itcAvailable || /yes|y|eligible|available/i.test(row.itcAvailable);
  return {
    id: `${section}-${index}`,
    return_id: RETURN_ID,
    user_id: USER_ID,
    section,
    supplier_gstin: row.supplierGstin,
    supplier_name: row.supplierName,
    invoice_number: row.invoiceNumber,
    invoice_date: parseInvoiceDate(row.invoiceDate),
    invoice_value: row.invoiceValue,
    place_of_supply: row.placeOfSupply,
    taxable_value: row.taxableValue,
    igst_amount: row.igst,
    cgst_amount: row.cgst,
    sgst_amount: row.sgst,
    cess_amount: row.cess,
    tax_rate: 0,
    itc_eligible: itcEligible,
    itc_igst: row.igst,
    itc_cgst: row.cgst,
    itc_sgst: row.sgst,
    itc_cess: row.cess,
  };
}

export function gstr2bRowToPurchaseRow(
  g: Gstr2bDocumentRow & { id?: string },
  index: number
): PurchaseRegisterRow {
  return {
    id: `book-${g.id || index}`,
    supplier_gstin: g.supplier_gstin,
    supplier_name: g.supplier_name,
    invoice_number: g.invoice_number,
    invoice_date: g.invoice_date,
    taxable_value: g.taxable_value,
    igst_amount: g.igst_amount,
    cgst_amount: g.cgst_amount,
    sgst_amount: g.sgst_amount,
    cess_amount: g.cess_amount,
    total_invoice_value: g.invoice_value,
    is_itc_eligible: g.itc_eligible,
  };
}

export function loadDksGstr2bFromExcel(): {
  rows: Array<Gstr2bDocumentRow & { id: string }>;
  meta: ReturnType<typeof parseGstr2bWorkbook>['meta'];
} | null {
  const path = resolveProjectPath(DKS_GSTR2B_FILENAME);
  if (!path) return null;

  const buf = readFileSync(path);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const model = parseGstr2bWorkbook(wb);

  const rows: Array<Gstr2bDocumentRow & { id: string }> = [];
  model.b2b.forEach((r, i) => rows.push(excelRowToGstr2b(r, 'b2b', i)));
  model.b2ba.forEach((r, i) => rows.push(excelRowToGstr2b(r, 'b2ba', i)));

  return { rows, meta: model.meta };
}

export interface DksGstr1PdfMeta {
  gstin: string;
  legalName: string;
  tradeName: string;
  taxPeriod: string;
  financialYear: string;
  arn: string;
  arnDate: string;
  b2bInvoiceCount: number;
  b2bTaxableValue: number;
  b2bIgst: number;
  b2bCgst: number;
  b2bSgst: number;
}

/** Parse summary fields from DKS GSTR-1 PDF text export. */
export function parseDksGstr1PdfMeta(pdfText: string): DksGstr1PdfMeta {
  const gstin = pdfText.match(/GSTIN\s+(\d{2}[A-Z0-9]{13})/i)?.[1] || '';
  const legalName =
    pdfText.match(/Legal name of the registered person\s+(.+)/i)?.[1]?.trim() ||
    pdfText.match(/\(a\)\s*Legal name[^\n]*\n\s*(.+)/i)?.[1]?.trim() ||
    '';
  const arn = pdfText.match(/ARN\s+([A-Z0-9]+)/i)?.[1] || '';
  const arnDate = pdfText.match(/ARN date\s+(\d{2}\/\d{2}\/\d{4})/i)?.[1] || '';

  const b2bLine = pdfText.match(
    /4A[^\n]*\nTotal\s+(\d+)\s+Invoice\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/
  );

  const parseNum = (s?: string) =>
    s ? parseFloat(s.replace(/,/g, '')) : 0;

  return {
    gstin,
    legalName,
    tradeName: legalName,
    taxPeriod: 'March',
    financialYear: pdfText.match(/Financial year\s+([\d-]+)/i)?.[1] || '2024-25',
    arn,
    arnDate,
    b2bInvoiceCount: b2bLine ? parseInt(b2bLine[1], 10) : 0,
    b2bTaxableValue: parseNum(b2bLine?.[2]),
    b2bIgst: parseNum(b2bLine?.[3]),
    b2bCgst: parseNum(b2bLine?.[4]),
    b2bSgst: parseNum(b2bLine?.[5]),
  };
}

export function loadDksGstr1PdfText(): string | null {
  const path = resolveProjectPath(DKS_GSTR1_PDF_FILENAME);
  if (!path) return null;
  return readFileSync(path, 'utf-8');
}
