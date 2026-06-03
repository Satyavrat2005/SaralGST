import { reconcileGstr2bWithPurchase } from '@/lib/gstr2b/reconcileWithPurchase';
import type { Gstr2bDocumentRow, PurchaseRegisterRow } from '@/lib/gstr2b/types';
import type { ReconcileOutput } from '@/lib/gstr2b/reconcileWithPurchase';
import {
  DKS_MARCH_PERIOD,
  gstr2bRowToPurchaseRow,
  loadDksGstr1PdfText,
  loadDksGstr2bFromExcel,
  parseDksGstr1PdfMeta,
} from './parseDksGstr2bFile';

/**
 * Build purchase-register rows from GSTR-2B lines for DKS demo.
 * Represents books / purchase data paired with portal GSTR-2B (supplier GSTR-1 chain).
 * Applies light deterministic variance so matched + discrepancy views are meaningful.
 */
export function buildDksMarchPurchaseBooks(
  gstr2bRows: Array<Gstr2bDocumentRow & { id: string }>
): PurchaseRegisterRow[] {
  const books: PurchaseRegisterRow[] = gstr2bRows.map((g, i) => gstr2bRowToPurchaseRow(g, i));

  if (books.length < 5) return books;

  // ~8% only in GSTR-2B (omit from books)
  const omitCount = Math.max(1, Math.floor(books.length * 0.08));
  const omitIndices = new Set<number>();
  let seed = 42;
  while (omitIndices.size < omitCount) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    omitIndices.add(seed % books.length);
  }
  const filtered = books.filter((_, i) => !omitIndices.has(i));

  // ~5% value mismatch on books side
  const mismatchCount = Math.max(1, Math.floor(filtered.length * 0.05));
  for (let m = 0; m < mismatchCount; m++) {
    const idx = (m * 7 + 3) % filtered.length;
    const row = filtered[idx];
    if (row.taxable_value) {
      row.taxable_value = Math.round(row.taxable_value * 1.02 * 100) / 100;
    }
  }

  // Synthetic purchase-only rows (missing in GSTR-2B)
  filtered.push({
    id: 'book-synthetic-1',
    supplier_gstin: '27AABCU9603R1Z5',
    supplier_name: 'SYNTHETIC VENDOR (BOOKS ONLY)',
    invoice_number: 'DKS/BOOK-ONLY-001',
    invoice_date: '2025-03-18',
    taxable_value: 25000,
    cgst_amount: 2250,
    sgst_amount: 2250,
    igst_amount: 0,
    cess_amount: 0,
    total_invoice_value: 29500,
    is_itc_eligible: true,
  });

  return filtered;
}

export interface DksMarchReconciliationResult {
  period: string;
  gstr2bRows: Array<Gstr2bDocumentRow & { id: string }>;
  purchaseRows: PurchaseRegisterRow[];
  recon: ReconcileOutput;
  gstr1Meta: ReturnType<typeof parseDksGstr1PdfMeta> | null;
  sources: {
    gstr2bFile: string;
    gstr1File: string;
  };
}

export function loadDksMarchReconciliationSources(): DksMarchReconciliationResult | null {
  const gstr2b = loadDksGstr2bFromExcel();
  if (!gstr2b || gstr2b.rows.length === 0) return null;

  const purchaseRows = buildDksMarchPurchaseBooks(gstr2b.rows);
  const recon = reconcileGstr2bWithPurchase(gstr2b.rows, purchaseRows);

  const pdfText = loadDksGstr1PdfText();
  const gstr1Meta = pdfText ? parseDksGstr1PdfMeta(pdfText) : null;

  return {
    period: DKS_MARCH_PERIOD,
    gstr2bRows: gstr2b.rows,
    purchaseRows,
    recon,
    gstr1Meta,
    sources: {
      gstr2bFile: "DKS - GSTR-2B_MAR'25 - FINAL.xlsx",
      gstr1File: "DKS - GSTR1_MAR'25 - OK.pdf",
    },
  };
}
