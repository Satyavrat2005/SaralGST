import type {
  Gstr2bDocumentRow,
  Gstr2bReconciliationStats,
  PurchaseRegisterRow,
  ReconcileMatchResult,
} from './types';
import { normalizeDocNumber, normalizeGstin, round2, taxTotal } from './utils';

const TAX_TOLERANCE = 1;
const DATE_TOLERANCE_DAYS = 3;
const AMOUNT_TOLERANCE_PCT = 0.005;

function parseDate(d: string | null | undefined): number | null {
  if (!d) return null;
  const t = Date.parse(d.slice(0, 10));
  return Number.isNaN(t) ? null : t;
}

function daysDiff(a: string | null | undefined, b: string | null | undefined): number {
  const ta = parseDate(a);
  const tb = parseDate(b);
  if (ta == null || tb == null) return 999;
  return Math.abs(ta - tb) / (1000 * 60 * 60 * 24);
}

function purchaseTax(p: PurchaseRegisterRow): number {
  return taxTotal({
    igst_amount: p.igst_amount ?? 0,
    cgst_amount: p.cgst_amount ?? 0,
    sgst_amount: p.sgst_amount ?? 0,
    cess_amount: p.cess_amount ?? 0,
  });
}

function gstr2bTax(g: Gstr2bDocumentRow): number {
  return taxTotal(g);
}

function matchKey(gstin: string, num: string): string {
  return `${normalizeGstin(gstin)}|${normalizeDocNumber(num)}`;
}

function normalizeDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const s = String(d).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function isExactMatch(g: Gstr2bDocumentRow, p: PurchaseRegisterRow): boolean {
  if (normalizeGstin(g.supplier_gstin) !== normalizeGstin(p.supplier_gstin)) return false;
  if (normalizeDocNumber(g.invoice_number) !== normalizeDocNumber(p.invoice_number)) return false;
  if (normalizeDate(g.invoice_date) !== normalizeDate(p.invoice_date)) return false;
  if (Math.abs((g.taxable_value || 0) - (p.taxable_value || 0)) > TAX_TOLERANCE) return false;
  if (Math.abs(gstr2bTax(g) - purchaseTax(p)) > TAX_TOLERANCE) return false;
  return true;
}

function isFuzzyMatch(g: Gstr2bDocumentRow, p: PurchaseRegisterRow): boolean {
  if (normalizeGstin(g.supplier_gstin) !== normalizeGstin(p.supplier_gstin)) return false;
  if (normalizeDocNumber(g.invoice_number) !== normalizeDocNumber(p.invoice_number)) return false;
  if (daysDiff(g.invoice_date, p.invoice_date ?? null) > DATE_TOLERANCE_DAYS) return false;
  const bookVal = p.taxable_value || p.total_invoice_value || 0;
  const gVal = g.taxable_value || 0;
  if (bookVal > 0 && Math.abs(gVal - bookVal) / bookVal > AMOUNT_TOLERANCE_PCT) return false;
  return true;
}

function isPartialMatch(g: Gstr2bDocumentRow, p: PurchaseRegisterRow): boolean {
  const gGstin = normalizeGstin(g.supplier_gstin);
  const pGstin = normalizeGstin(p.supplier_gstin);
  if (!gGstin && !pGstin) {
    return normalizeDocNumber(g.invoice_number) === normalizeDocNumber(p.invoice_number);
  }
  if (gGstin !== pGstin) return false;
  if (normalizeDocNumber(g.invoice_number) !== normalizeDocNumber(p.invoice_number)) return false;
  return true;
}

export interface ReconcileOutput {
  gstr2bUpdates: Array<{ id: string; match_status: string; matched_purchase_id: string | null }>;
  results: ReconcileMatchResult[];
  stats: Gstr2bReconciliationStats;
  matchedPairs: Array<{ gstr2b: Gstr2bDocumentRow & { id?: string }; purchase: PurchaseRegisterRow }>;
  missingInGstr2b: PurchaseRegisterRow[];
  missingInBooks: Array<Gstr2bDocumentRow & { id?: string }>;
  partialMatches: Array<{ gstr2b: Gstr2bDocumentRow & { id?: string }; purchase: PurchaseRegisterRow; diff: { taxable: number; tax: number } }>;
}

export function reconcileGstr2bWithPurchase(
  gstr2bRows: Array<Gstr2bDocumentRow & { id?: string }>,
  purchaseRows: PurchaseRegisterRow[]
): ReconcileOutput {
  const usedPurchase = new Set<string>();
  const usedGstr2b = new Set<string>();
  const gstr2bUpdates: ReconcileOutput['gstr2bUpdates'] = [];
  const results: ReconcileMatchResult[] = [];
  const matchedPairs: ReconcileOutput['matchedPairs'] = [];
  const partialMatches: ReconcileOutput['partialMatches'] = [];

  for (const g of gstr2bRows) {
    if (!g.id) continue;
    let matched: PurchaseRegisterRow | null = null;
    let matchType: 'exact' | 'fuzzy' | 'none' = 'none';
    let status: 'matched' | 'partial' | 'not_matched' = 'not_matched';

    for (const p of purchaseRows) {
      if (usedPurchase.has(p.id)) continue;
      if (isExactMatch(g, p)) {
        matched = p;
        matchType = 'exact';
        status = 'matched';
        break;
      }
    }

    if (!matched) {
      for (const p of purchaseRows) {
        if (usedPurchase.has(p.id)) continue;
        if (isFuzzyMatch(g, p)) {
          matched = p;
          matchType = 'fuzzy';
          status = 'matched';
          break;
        }
      }
    }

    if (!matched) {
      for (const p of purchaseRows) {
        if (usedPurchase.has(p.id)) continue;
        if (isPartialMatch(g, p)) {
          matched = p;
          matchType = 'none';
          status = 'partial';
          break;
        }
      }
    }

    if (matched) {
      usedPurchase.add(matched.id);
      usedGstr2b.add(g.id);
      gstr2bUpdates.push({ id: g.id, match_status: status, matched_purchase_id: matched.id });
      results.push({ gstr2b_id: g.id, purchase_id: matched.id, match_status: status, match_type: matchType });
      if (status === 'matched') {
        matchedPairs.push({ gstr2b: g, purchase: matched });
      } else {
        partialMatches.push({
          gstr2b: g,
          purchase: matched,
          diff: {
            taxable: round2((g.taxable_value || 0) - (matched.taxable_value || 0)),
            tax: round2(gstr2bTax(g) - purchaseTax(matched)),
          },
        });
      }
    } else {
      gstr2bUpdates.push({ id: g.id, match_status: 'not_matched', matched_purchase_id: null });
      results.push({ gstr2b_id: g.id, match_status: 'not_matched', match_type: 'none' });
    }
  }

  const missingInGstr2b = purchaseRows.filter((p) => !usedPurchase.has(p.id));
  const missingInBooks = gstr2bRows.filter((g) => g.id && !usedGstr2b.has(g.id));

  for (const p of missingInGstr2b) {
    results.push({ purchase_id: p.id, match_status: 'missing_in_gstr2b' });
  }
  for (const g of missingInBooks) {
    results.push({ gstr2b_id: g.id, match_status: 'missing_in_books' });
  }

  const matched = gstr2bUpdates.filter((u) => u.match_status === 'matched').length;
  const partial = gstr2bUpdates.filter((u) => u.match_status === 'partial').length;
  const total = gstr2bRows.length;

  const stats: Gstr2bReconciliationStats = {
    total_gstr2b: total,
    total_purchase: purchaseRows.length,
    matched,
    partial,
    unmatched_gstr2b: total - matched - partial,
    missing_in_gstr2b: missingInGstr2b.length,
    match_pct: total > 0 ? Math.round((matched / total) * 100) : 0,
    ran_at: new Date().toISOString(),
  };

  return {
    gstr2bUpdates,
    results,
    stats,
    matchedPairs,
    missingInGstr2b,
    missingInBooks,
    partialMatches,
  };
}
