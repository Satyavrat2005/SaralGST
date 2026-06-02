import type {
  DiscrepancyClassification,
  DiscrepancyType,
  InsightInvoicePayload,
  InsightPurchasePayload,
  InsightSeverity,
} from './insightTypes';
import { ruleIdForCategory } from './taxEngineRules';

const TAX_TOLERANCE = 1;
const MATERIAL_DIFF_PCT = 0.005;

function formatInr(n: number): string {
  return `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function taxTotal(row: {
  igst_amount?: number | null;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  cess_amount?: number | null;
}): number {
  return (
    (row.igst_amount || 0) +
    (row.cgst_amount || 0) +
    (row.sgst_amount || 0) +
    (row.cess_amount || 0)
  );
}

function invoiceLabel(g?: InsightInvoicePayload | null, p?: InsightPurchasePayload | null): string {
  const num = g?.invoice_number || p?.invoice_number || 'Unknown invoice';
  const gstin = g?.supplier_gstin || p?.supplier_gstin;
  return gstin ? `${num} (${gstin})` : num;
}

function classifyMissingInBooks(
  gstr2b: InsightInvoicePayload,
  returnPeriod?: string
): DiscrepancyClassification {
  const itc = taxTotal(gstr2b);
  const factors = [
    {
      code: 'IN_2B_NOT_BOOKS',
      label: 'Present in GSTR-2B only',
      evidence: `Invoice ${invoiceLabel(gstr2b)} appears on the portal ITC statement but has no matching purchase register entry for ${returnPeriod || 'this period'}.`,
    },
    {
      code: 'SUPPLIER_REPORTED',
      label: 'Supplier outward supply reported',
      evidence: `Supplier ${gstr2b.supplier_name || 'vendor'} filed this in their outward return (GSTR-1), which flows into your GSTR-2B.`,
    },
  ];

  if (gstr2b.itc_eligible === false) {
    factors.push({
      code: 'ITC_INELIGIBLE',
      label: 'Marked ineligible on GSTR-2B',
      evidence: 'Portal shows this line as not eligible for ITC — verify Section 17(5) or place-of-supply before booking.',
    });
  }

  const actions = [
    { priority: 1, label: 'Locate the original tax invoice and GRN; confirm the purchase is genuine.' },
    { priority: 2, label: 'Add the invoice to your purchase register with matching GSTIN, number, date, and tax break-up.' },
    { priority: 3, label: 'If you did not receive the goods/services, reject or dispute via IMS before filing GSTR-3B.' },
    { priority: 4, label: 'Re-run reconciliation after updating books to claim eligible ITC in GSTR-3B.' },
  ];

  const category = 'in_gstr2b_not_in_books' as const;
  return {
    category,
    severity: itc > 50000 ? 'high' : itc > 10000 ? 'medium' : 'low',
    factors,
    suggestedActions: actions,
    ruleTriggered: ruleIdForCategory(category),
  };
}

function classifyMissingInGstr2b(
  purchase: InsightPurchasePayload,
  returnPeriod?: string
): DiscrepancyClassification {
  const itc = taxTotal(purchase);
  const hasGstin = Boolean(purchase.supplier_gstin?.trim());

  const factors = [
    {
      code: 'IN_BOOKS_NOT_2B',
      label: 'Present in books only',
      evidence: `Invoice ${invoiceLabel(undefined, purchase)} is in your purchase register but absent from GSTR-2B for ${returnPeriod || 'this period'}.`,
    },
    {
      code: 'SUPPLIER_GSTR1_CHAIN',
      label: 'Supplier GSTR-1 → GSTR-2B gap',
      evidence: hasGstin
        ? 'GSTR-2B is built from supplier GSTR-1 filings accepted in IMS. If the supplier has not filed, filed late, or used wrong details, ITC will not appear here.'
        : 'No supplier GSTIN on the book entry — B2B ITC cannot auto-populate until a valid GSTIN is recorded and the supplier files correctly.',
    },
  ];

  if (!hasGstin) {
    factors.push({
      code: 'MISSING_GSTIN',
      label: 'Missing supplier GSTIN',
      evidence: 'Update the purchase entry with the correct 15-character GSTIN before following up with the vendor.',
    });
  }

  const actions = [
    { priority: 1, label: 'Ask the supplier to confirm GSTR-1 filing for this invoice and your GSTIN as recipient.' },
    { priority: 2, label: 'Check IMS on the GST portal for a pending invoice awaiting Accept/Reject.' },
    { priority: 3, label: 'If filed after the 11th/13th cut-off, expect ITC in the next month’s GSTR-2B.' },
    { priority: 4, label: 'Do not claim this ITC in GSTR-3B until it appears in GSTR-2B (Rule 36(4)).' },
  ];

  const category = hasGstin ? ('supplier_not_filed' as const) : ('data_entry_gap' as const);
  return {
    category,
    severity: itc > 50000 ? 'high' : itc > 10000 ? 'medium' : 'low',
    factors,
    suggestedActions: actions,
    ruleTriggered: ruleIdForCategory(category),
  };
}

function classifyValueMismatch(
  gstr2b: InsightInvoicePayload,
  purchase: InsightPurchasePayload,
  diff?: { taxable?: number; tax?: number }
): DiscrepancyClassification {
  const taxableDiff = diff?.taxable ?? 0;
  const taxDiff = diff?.tax ?? 0;
  const bookTaxable = purchase.taxable_value ?? purchase.total_invoice_value ?? 0;
  const g2bTaxable = gstr2b.taxable_value ?? 0;
  const absTaxable = Math.abs(taxableDiff);
  const isRounding = absTaxable <= TAX_TOLERANCE && Math.abs(taxDiff) <= TAX_TOLERANCE;

  const pct =
    bookTaxable > 0 ? absTaxable / bookTaxable : absTaxable > 0 ? 1 : 0;

  let severity: InsightSeverity = 'low';
  if (!isRounding) {
    if (pct > MATERIAL_DIFF_PCT || absTaxable > 1000) severity = 'high';
    else if (absTaxable > 10) severity = 'medium';
  }

  const factors = [
    {
      code: 'DOC_MATCH_VALUE_DIFF',
      label: 'Invoice matched, values differ',
      evidence: `${invoiceLabel(gstr2b, purchase)}: books taxable ${formatInr(bookTaxable)} vs GSTR-2B ${formatInr(g2bTaxable)} (difference ${formatInr(taxableDiff)}).`,
    },
  ];

  if (isRounding) {
    factors.push({
      code: 'ROUNDING',
      label: 'Within rounding tolerance',
      evidence: `Taxable difference ${formatInr(taxableDiff)} is within the ₹${TAX_TOLERANCE} reconciliation tolerance.`,
    });
  } else if (Math.abs(taxDiff) > TAX_TOLERANCE) {
    factors.push({
      code: 'TAX_HEAD_DIFF',
      label: 'Tax component mismatch',
      evidence: `Total tax difference ${formatInr(taxDiff)} — check IGST/CGST/SGST split or rate applied by supplier in GSTR-1.`,
    });
  }

  const actions = isRounding
    ? [
        { priority: 1, label: 'Accept portal values for GSTR-3B if within your policy tolerance.' },
        { priority: 2, label: 'Optionally align book entry to match GSTR-2B for cleaner month-end books.' },
      ]
    : [
        { priority: 1, label: 'Compare the original invoice PDF with supplier GSTR-1 figures.' },
        { priority: 2, label: 'Request a GSTR-1 amendment if the supplier reported wrong taxable value or tax.' },
        { priority: 3, label: 'Claim ITC only for the amount reflected in GSTR-2B when filing GSTR-3B.' },
      ];

  const category = isRounding ? ('rounding_variance' as const) : ('amount_mismatch' as const);
  return {
    category,
    severity,
    factors,
    suggestedActions: actions,
    ruleTriggered: ruleIdForCategory(category),
  };
}

function classifyMatched(
  gstr2b: InsightInvoicePayload,
  purchase: InsightPurchasePayload,
  matchType?: 'exact' | 'fuzzy'
): DiscrepancyClassification {
  const isExact = matchType === 'exact';
  const factors = [
    {
      code: 'DOC_MATCH',
      label: isExact ? 'Exact document match' : 'Fuzzy document match',
      evidence: `Invoice ${invoiceLabel(gstr2b, purchase)} matched on GSTIN and invoice number${isExact ? ' with aligned taxable value and tax.' : ' within date/amount tolerance.'}`,
    },
    {
      code: 'SUPPLIER_GSTR1_IN_2B',
      label: 'Supplier filing reflected in GSTR-2B',
      evidence:
        'Portal GSTR-2B line confirms supplier outward return (GSTR-1) data reached your ITC statement for this period.',
    },
  ];
  return {
    category: 'rounding_variance',
    severity: 'low',
    factors,
    suggestedActions: [
      { priority: 1, label: 'Mark as reviewed and include ITC in GSTR-3B Table 4.' },
      { priority: 2, label: 'Archive the matched tax invoice with this reconciliation audit trail.' },
    ],
    ruleTriggered: ruleIdForCategory('rounding_variance'),
  };
}

export function classifyDiscrepancy(
  discrepancyType: DiscrepancyType,
  options: {
    gstr2b?: InsightInvoicePayload | null;
    purchase?: InsightPurchasePayload | null;
    diff?: { taxable?: number; tax?: number };
    returnPeriod?: string;
    matchType?: 'exact' | 'fuzzy';
  }
): DiscrepancyClassification {
  const { gstr2b, purchase, diff, returnPeriod, matchType } = options;

  switch (discrepancyType) {
    case 'missing_in_books':
      return classifyMissingInBooks(gstr2b || {}, returnPeriod);
    case 'missing_in_gstr2b':
      return classifyMissingInGstr2b(purchase || {}, returnPeriod);
    case 'value_mismatch':
      return classifyValueMismatch(gstr2b || {}, purchase || {}, diff);
    case 'matched':
      return classifyMatched(gstr2b || {}, purchase || {}, matchType);
    default:
      return classifyMissingInBooks(gstr2b || {}, returnPeriod);
  }
}

export function buildInsightCacheKey(body: {
  returnId: string;
  discrepancyType: DiscrepancyType;
  gstr2b?: InsightInvoicePayload | null;
  purchase?: InsightPurchasePayload | null;
  diff?: { taxable?: number; tax?: number };
}): string {
  const parts = [
    body.returnId,
    body.discrepancyType,
    body.gstr2b?.supplier_gstin || body.purchase?.supplier_gstin || '',
    body.gstr2b?.invoice_number || body.purchase?.invoice_number || '',
    String(body.gstr2b?.taxable_value ?? ''),
    String(body.purchase?.taxable_value ?? ''),
    String(body.diff?.taxable ?? ''),
    String(body.diff?.tax ?? ''),
  ];
  return `${parts.join('|').toLowerCase()}|te42`;
}
