/**
 * Formats validation errors for WhatsApp replies (mirrors dashboard Validation Results).
 */

import type { ValidationError as PurchaseValidationError } from './validationService';
import type { ValidationError as SalesValidationError } from './salesValidationService';

export const PURCHASE_FIELD_LABELS: Record<string, string> = {
  supplier_name: 'Vendor Name',
  supplier_gstin: 'Vendor GSTIN',
  supplier_state_code: 'Vendor State',
  buyer_gstin: 'Buyer GSTIN',
  invoice_number: 'Invoice Number',
  invoice_date: 'Invoice Date',
  invoice_type: 'Invoice Type (B2B/Import/RCM/SEZ)',
  place_of_supply: 'Place of Supply',
  place_of_supply_state_code: 'Place of Supply',
  taxable_value: 'Taxable Value',
  hsn_or_sac: 'HSN/SAC Code',
  hsn_or_sac_code: 'HSN/SAC Code',
  description: 'Description of Goods/Services',
  description_of_goods_services: 'Description of Goods/Services',
  quantity: 'Quantity',
  unit: 'Unit of Measure',
  unit_of_measure: 'Unit of Measure',
  rate: 'Rate per Unit',
  rate_per_unit: 'Rate per Unit',
};

export const SALES_FIELD_LABELS: Record<string, string> = {
  seller_gstin: 'Seller GSTIN',
  seller_state_code: 'Seller State Code',
  customer_name: 'Customer Name',
  customer_gstin: 'Customer GSTIN',
  customer_state_code: 'Customer State Code',
  invoice_number: 'Invoice Number',
  invoice_date: 'Invoice Date',
  invoice_type: 'Invoice Type',
  supply_type: 'Supply Type',
  place_of_supply_state_code: 'Place of Supply',
  hsn_or_sac: 'HSN/SAC Code',
  description: 'Description',
  quantity: 'Quantity',
  unit: 'Unit of Measure',
  rate: 'Rate',
  taxable_value: 'Taxable Value',
  cgst: 'CGST Amount',
  sgst: 'SGST Amount',
  igst: 'IGST Amount',
  cess: 'CESS Amount',
};

export type FeedbackItem = {
  field: string;
  label: string;
  issueType: string;
  detail: string;
  detected?: string | null;
  expected?: string | null;
};

export type CategorizedFeedback = {
  missingCritical: FeedbackItem[];
  missingRecommended: FeedbackItem[];
  otherIssues: FeedbackItem[];
};

const MISSING_EMPTY_DETAIL =
  'This field is missing or empty in the invoice.';

const EXTRACTED_EMPTY_FIELD_KEYS: {
  fields: string[];
  label: string;
}[] = [
  { fields: ['hsn_or_sac', 'hsn_or_sac_code'], label: 'HSN/SAC Code' },
  { fields: ['quantity'], label: 'Quantity' },
  { fields: ['unit', 'unit_of_measure'], label: 'Unit of Measure' },
  { fields: ['rate', 'rate_per_unit'], label: 'Rate per Unit' },
];

const MAX_BULLETS_PER_SECTION = 15;

function labelForField(
  field: string,
  kind: 'purchase' | 'sales',
  override?: string
): string {
  if (override) return override;
  const map = kind === 'sales' ? SALES_FIELD_LABELS : PURCHASE_FIELD_LABELS;
  return map[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function dedupeKey(item: FeedbackItem): string {
  return `${item.field}:${item.issueType}`;
}

function dedupeItems(items: FeedbackItem[]): FeedbackItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = dedupeKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isEmptyValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'number' && value === 0)
  );
}

/** Scan extracted/invoice record for empty line-item fields (UI parity). */
export function appendMissingFromExtractedData(
  categorized: CategorizedFeedback,
  extractedData: Record<string, unknown> | null | undefined,
  kind: 'purchase' | 'sales'
): CategorizedFeedback {
  if (!extractedData) return categorized;

  const listedFields = new Set([
    ...categorized.missingCritical.map((i) => i.field),
    ...categorized.missingRecommended.map((i) => i.field),
    ...categorized.otherIssues.map((i) => i.field),
  ]);

  const extra: FeedbackItem[] = [];

  for (const { fields, label } of EXTRACTED_EMPTY_FIELD_KEYS) {
    const primaryField = fields[0];
    if (fields.some((f) => listedFields.has(f))) continue;

    const value = fields
      .map((f) => extractedData[f])
      .find((v) => v !== undefined);

    if (!isEmptyValue(value)) continue;

    extra.push({
      field: primaryField,
      label,
      issueType: 'missing',
      detail: MISSING_EMPTY_DETAIL,
    });
    fields.forEach((f) => listedFields.add(f));
  }

  if (extra.length === 0) return categorized;

  return {
    ...categorized,
    missingRecommended: dedupeItems([
      ...categorized.missingRecommended,
      ...extra,
    ]),
  };
}

export function categorizePurchaseErrors(
  errors: PurchaseValidationError[]
): CategorizedFeedback {
  const missingCritical: FeedbackItem[] = [];
  const missingRecommended: FeedbackItem[] = [];
  const otherIssues: FeedbackItem[] = [];

  for (const err of errors) {
    const label = labelForField(err.field, 'purchase');
    const item: FeedbackItem = {
      field: err.field,
      label,
      issueType: err.issue_type,
      detail: err.message,
      detected: err.detected_value,
      expected: err.expected_value,
    };

    if (err.issue_type === 'missing') {
      if (err.message.includes('required for GST')) {
        missingCritical.push({
          ...item,
          detail: MISSING_EMPTY_DETAIL,
        });
      } else if (err.message.includes('recommended')) {
        missingRecommended.push({
          ...item,
          detail: err.message,
        });
      } else {
        missingCritical.push(item);
      }
    } else {
      otherIssues.push(item);
    }
  }

  return {
    missingCritical: dedupeItems(missingCritical),
    missingRecommended: dedupeItems(missingRecommended),
    otherIssues: dedupeItems(otherIssues),
  };
}

export function categorizeSalesErrors(
  errors: SalesValidationError[]
): CategorizedFeedback {
  const missingCritical: FeedbackItem[] = [];
  const missingRecommended: FeedbackItem[] = [];
  const otherIssues: FeedbackItem[] = [];

  for (const err of errors) {
    const label = err.userFriendlyLabel || labelForField(err.field, 'sales');
    const issueType =
      err.severity === 'critical' ? 'missing' : err.severity || 'error';
    const item: FeedbackItem = {
      field: err.field,
      label,
      issueType,
      detail: err.message,
    };

    if (err.severity === 'critical') {
      missingCritical.push({
        ...item,
        detail: err.message.includes('mandatory')
          ? MISSING_EMPTY_DETAIL
          : err.message,
      });
    } else {
      otherIssues.push(item);
    }
  }

  return {
    missingCritical: dedupeItems(missingCritical),
    missingRecommended: dedupeItems(missingRecommended),
    otherIssues: dedupeItems(otherIssues),
  };
}

function formatBullet(item: FeedbackItem, style: 'missing' | 'issue'): string {
  if (style === 'missing') {
    return `• ${item.label} — ${item.detail}`;
  }

  const typeLabel = item.issueType.replace(/_/g, ' ');
  let line = `• ${item.label} (${typeLabel}) — ${item.detail}`;
  if (item.detected) {
    line += `\n  Detected: ${item.detected}`;
  }
  if (item.expected) {
    line += `\n  Expected: ${item.expected}`;
  }
  return line;
}

function truncateSection(
  items: FeedbackItem[],
  style: 'missing' | 'issue'
): { lines: string[]; omitted: number } {
  const shown = items.slice(0, MAX_BULLETS_PER_SECTION);
  const omitted = Math.max(0, items.length - shown.length);
  return {
    lines: shown.map((item) => formatBullet(item, style)),
    omitted,
  };
}

export type FormatValidationFeedbackOpts = {
  kind?: 'purchase' | 'sales';
  invoiceNumber?: string | null;
  willEscalate?: boolean;
  extractedData?: Record<string, unknown> | null;
  warnings?: { field?: string; message: string }[];
};

export function formatValidationFeedback(
  categorized: CategorizedFeedback,
  opts: FormatValidationFeedbackOpts = {}
): string {
  const kind = opts.kind || 'purchase';
  const kindLabel = kind === 'sales' ? 'sales invoice' : 'invoice';
  const invRef = opts.invoiceNumber ? ` (${opts.invoiceNumber})` : '';

  const lines: string[] = [
    `We could not accept this ${kindLabel}${invRef}.`,
    '',
  ];

  const { missingCritical, missingRecommended, otherIssues } = categorized;
  let totalOmitted = 0;

  if (missingCritical.length > 0) {
    lines.push('*Missing information* (please add on the PDF):');
    const { lines: bullets, omitted } = truncateSection(
      missingCritical,
      'missing'
    );
    lines.push(...bullets);
    totalOmitted += omitted;
    lines.push('');
  }

  const recommended = missingRecommended.filter(
    (r) => !missingCritical.some((c) => c.field === r.field)
  );
  if (recommended.length > 0) {
    lines.push('*Recommended fields* (for a complete record):');
    const { lines: bullets, omitted } = truncateSection(
      recommended,
      'missing'
    );
    lines.push(...bullets);
    totalOmitted += omitted;
    lines.push('');
  }

  if (otherIssues.length > 0) {
    lines.push('*Validation issues*:');
    const { lines: bullets, omitted } = truncateSection(otherIssues, 'issue');
    lines.push(...bullets);
    totalOmitted += omitted;
    lines.push('');
  }

  if (opts.warnings?.length) {
    const warnMsgs = opts.warnings
      .map((w) => w.message)
      .filter(Boolean)
      .filter((m, i, arr) => arr.indexOf(m) === i);
    if (warnMsgs.length > 0) {
      lines.push('*Notes*:');
      warnMsgs.slice(0, 5).forEach((m) => lines.push(`• ${m}`));
      lines.push('');
    }
  }

  if (totalOmitted > 0) {
    lines.push(
      `…and ${totalOmitted} more issue(s). Our team can help if needed.`,
      ''
    );
  }

  const footer = opts.willEscalate
    ? 'Our team will review this manually and get back to you.'
    : 'Please correct the PDF and resend.';

  lines.push(footer);
  return lines.join('\n').trim();
}

export function buildPurchaseValidationMessage(
  errors: PurchaseValidationError[],
  opts: FormatValidationFeedbackOpts = {}
): string {
  let categorized = categorizePurchaseErrors(errors);
  categorized = appendMissingFromExtractedData(
    categorized,
    opts.extractedData,
    'purchase'
  );
  return formatValidationFeedback(categorized, opts);
}

export function buildSalesValidationMessage(
  errors: SalesValidationError[],
  opts: FormatValidationFeedbackOpts = {}
): string {
  let categorized = categorizeSalesErrors(errors);
  categorized = appendMissingFromExtractedData(
    categorized,
    opts.extractedData,
    'sales'
  );
  return formatValidationFeedback(categorized, { ...opts, kind: 'sales' });
}
