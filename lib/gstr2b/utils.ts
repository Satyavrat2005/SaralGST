export function parseGstnDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length <= 2) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
  return dateStr;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Infer ITC eligibility from portal document flags. */
export function isItcEligible(doc: {
  itc_avl?: string | boolean;
  itcavl?: string | boolean;
  itc_elg?: string;
  inv_typ?: string;
  rchrg?: string;
  table4?: boolean;
}): boolean {
  if (doc.table4 === true) return false;
  const avl = doc.itc_avl ?? doc.itcavl ?? doc.itc_elg;
  if (avl === 'N' || avl === 'No' || avl === false) return false;
  if (avl === 'Y' || avl === 'Yes' || avl === true) return true;
  return true;
}

export function isReverseCharge(doc: { rchrg?: string; inv_typ?: string }): boolean {
  return doc.rchrg === 'Y' || doc.inv_typ === 'RCM' || doc.inv_typ === 'R';
}

export function normalizeDocNumber(num: string | null | undefined): string {
  return (num || '').trim().toUpperCase();
}

export function normalizeGstin(gstin: string | null | undefined): string {
  return (gstin || '').trim().toUpperCase();
}

export function taxTotal(row: {
  igst_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  cess_amount?: number;
}): number {
  return (row.igst_amount || 0) + (row.cgst_amount || 0) + (row.sgst_amount || 0) + (row.cess_amount || 0);
}

export function itcTotal(row: {
  itc_igst?: number;
  itc_cgst?: number;
  itc_sgst?: number;
  itc_cess?: number;
}): number {
  return (row.itc_igst || 0) + (row.itc_cgst || 0) + (row.itc_sgst || 0) + (row.itc_cess || 0);
}
