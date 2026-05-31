const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function extractStateCode(placeOrGstin: string | null | undefined, fallback = '27'): string {
  if (!placeOrGstin) return fallback;
  const raw = placeOrGstin.toString().trim();
  const prefix = raw.substring(0, 2).replace(/\D/g, '');
  if (prefix.length === 2) return prefix;
  if (raw.length >= 2 && /^\d{2}/.test(raw)) return raw.substring(0, 2);
  return fallback;
}

const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Normalize to 15-char uppercase GSTIN or null if empty/invalid length. */
export function normalizeGstin(gstin: string | null | undefined): string | null {
  if (!gstin) return null;
  const clean = gstin.replace(/\s/g, '').toUpperCase();
  return clean.length === 15 ? clean : null;
}

export function isValidGstinChecksum(gstin: string): boolean {
  const g = gstin.trim().toUpperCase();
  if (g.length !== 15) return false;
  let sum = 0;
  let factor = 1;
  for (let i = 0; i < 14; i++) {
    const codePoint = GSTIN_CHARS.indexOf(g[i]);
    if (codePoint < 0) return false;
    let product = codePoint * factor;
    product = Math.floor(product / 36) + (product % 36);
    sum += product;
    factor = factor === 2 ? 1 : 2;
  }
  const check = GSTIN_CHARS[(36 - (sum % 36)) % 36];
  return g[14] === check;
}

export function isValidGstin(gstin: string | null | undefined): boolean {
  const normalized = normalizeGstin(gstin);
  if (!normalized) return false;
  return GSTIN_REGEX.test(normalized) && isValidGstinChecksum(normalized);
}

/** B2CL threshold: ₹1L from Aug 2024; ₹2.5L before */
export function getB2clThreshold(invoiceDate: string | null): number {
  if (!invoiceDate) return 100000;
  const d = new Date(invoiceDate);
  const aug2024 = new Date('2024-08-01');
  return d >= aug2024 ? 100000 : 250000;
}

export function isExportInvoice(inv: {
  invoice_type?: string | null;
  place_of_supply?: string | null;
  customer_gstin?: string | null;
}): boolean {
  const type = (inv.invoice_type || '').toLowerCase();
  if (type.includes('export') || type === 'exp') return true;
  const pos = extractStateCode(inv.place_of_supply);
  return pos === '96' || pos === '97';
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function sumTaxTotals(
  rows: Array<{
    invoice_value?: number;
    taxable_value?: number;
    igst_amount?: number;
    cgst_amount?: number;
    sgst_amount?: number;
    cess_amount?: number;
  }>
) {
  return rows.reduce(
    (acc, r) => ({
      count: acc.count + 1,
      // Portal summary "Value" column is taxable value, not gross invoice value
      value: acc.value + (r.taxable_value ?? 0),
      igst: acc.igst + (r.igst_amount || 0),
      cgst: acc.cgst + (r.cgst_amount || 0),
      sgst: acc.sgst + (r.sgst_amount || 0),
      cess: acc.cess + (r.cess_amount || 0),
    }),
    { count: 0, value: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }
  );
}

export function emptyTaxTotals(): import('./types').TaxTotals {
  return { count: 0, value: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 };
}

export function formatDateForGSTN(date: string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
}

export function getRequiredHsnDigits(annualTurnoverRange: string | null): number {
  if (!annualTurnoverRange) return 4;
  const lower = annualTurnoverRange.toLowerCase();
  if (lower.includes('5 cr') && !lower.includes('above') && !lower.includes('>')) {
    if (lower.includes('below') || lower.includes('upto') || lower.includes('up to')) return 4;
  }
  if (
    lower.includes('above 5') ||
    lower.includes('> 5') ||
    lower.includes('more than 5') ||
    lower.includes('exceed')
  ) {
    return 6;
  }
  return 4;
}

export function isB2bSection(section: string): boolean {
  return ['b2b', 'cdnr', 'exp'].includes(section);
}

export function isB2cSection(section: string): boolean {
  return ['b2cl', 'b2cs', 'cdnur'].includes(section);
}
