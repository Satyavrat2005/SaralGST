import type { Gstr2bDocumentRow, Gstr2bReturnData, Gstr2bSectionTotals } from './types';
import { itcTotal, taxTotal } from './utils';

const SECTION_KEYS = ['b2b', 'b2ba', 'cdnr', 'cdnra', 'isd', 'isda', 'impg', 'impgsez'] as const;

function emptySection(): Gstr2bSectionTotals {
  return { count: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0, itc: 0, eligible_count: 0 };
}

function sectionTotals(rows: Gstr2bDocumentRow[]): Gstr2bSectionTotals {
  return rows.reduce(
    (acc, r) => ({
      count: acc.count + 1,
      taxable: acc.taxable + (r.taxable_value || 0),
      igst: acc.igst + (r.igst_amount || 0),
      cgst: acc.cgst + (r.cgst_amount || 0),
      sgst: acc.sgst + (r.sgst_amount || 0),
      cess: acc.cess + (r.cess_amount || 0),
      itc: acc.itc + itcTotal(r),
      eligible_count: acc.eligible_count + (r.itc_eligible ? 1 : 0),
    }),
    emptySection()
  );
}

export function buildGstr2bReturnData(
  rows: Gstr2bDocumentRow[],
  period: string,
  portalSummary?: unknown
): Gstr2bReturnData {
  const sections: Record<string, Gstr2bSectionTotals> = {};
  for (const key of SECTION_KEYS) {
    sections[key] = sectionTotals(rows.filter((r) => r.section === key));
  }

  const eligible = rows.filter((r) => r.itc_eligible);
  const ineligible = rows.filter((r) => !r.itc_eligible);

  const sumRows = (list: Gstr2bDocumentRow[]) =>
    list.reduce(
      (acc, r) => ({
        taxable: acc.taxable + Math.abs(r.taxable_value || 0),
        igst: acc.igst + Math.abs(r.igst_amount || 0),
        cgst: acc.cgst + Math.abs(r.cgst_amount || 0),
        sgst: acc.sgst + Math.abs(r.sgst_amount || 0),
        cess: acc.cess + Math.abs(r.cess_amount || 0),
        itc: acc.itc + Math.abs(itcTotal(r)),
        count: acc.count + 1,
      }),
      { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0, itc: 0, count: 0 }
    );

  const cdnrReversal = rows.filter((r) => (r.section === 'cdnr' || r.section === 'cdnra') && !r.itc_eligible);

  return {
    period,
    fetched_at: new Date().toISOString(),
    sections,
    summary_table3: sumRows(eligible),
    summary_table4: sumRows(ineligible),
    portal_summary: portalSummary,
    diagnostics: {
      recordsParsed: rows.length,
      emptyPortal: rows.length === 0,
    },
    reconciliation: undefined,
  };
}

/** Tab counts for UI (group isd+isda, impg+impgsez). */
export function getUiSectionCounts(sections: Record<string, Gstr2bSectionTotals>) {
  return {
    b2b: (sections.b2b?.count || 0) + (sections.b2ba?.count || 0),
    cdnr: (sections.cdnr?.count || 0) + (sections.cdnra?.count || 0),
    isd: (sections.isd?.count || 0) + (sections.isda?.count || 0),
    impg: (sections.impg?.count || 0) + (sections.impgsez?.count || 0),
  };
}

export function computeDocumentTotals(rows: Gstr2bDocumentRow[]) {
  return rows.reduce(
    (acc, r) => ({
      taxable: acc.taxable + (r.taxable_value || 0),
      tax: acc.tax + taxTotal(r),
      itc: acc.itc + itcTotal(r),
    }),
    { taxable: 0, tax: 0, itc: 0 }
  );
}
