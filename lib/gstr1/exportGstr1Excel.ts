import * as XLSX from 'xlsx';
import type { WorkBook } from 'xlsx';
import type { Gstr1InvoiceInsert, Gstr1ReturnData } from './types';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Format YYYY-MM-DD as DD-MMM-YYYY for GST offline tool columns */
export function formatGstr1PortalDate(isoDate: string | null): string {
  if (!isoDate) return '';
  const s = isoDate.slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s;
  const monthIdx = parseInt(m[2], 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return s;
  return `${m[3]}-${MONTH_NAMES[monthIdx]}-${m[1]}`;
}

export function formatPeriodLabel(period: string): string {
  const month = parseInt(period.slice(0, 2), 10);
  const year = parseInt(period.slice(2), 10);
  if (!month || !year) return period;
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function aoaToStyledSheet(rows: unknown[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const colWidths = rows[0]?.map((_, colIdx) => {
    let max = 10;
    for (const row of rows) {
      const len = String(row[colIdx] ?? '').length;
      if (len > max) max = Math.min(len + 2, 48);
    }
    return { wch: max };
  });
  if (colWidths?.length) ws['!cols'] = colWidths;
  return ws;
}

function addSheet(wb: WorkBook, name: string, rows: unknown[][]): void {
  const safeName = name.slice(0, 31);
  XLSX.utils.book_append_sheet(wb, aoaToStyledSheet(rows), safeName);
}

function buildReadMeSheet(returnData: Gstr1ReturnData, periodLabel: string): unknown[][] {
  const { header } = returnData;
  const generatedOn = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return [
    ['FORM GSTR-1 — Draft (SaralGST)'],
    [],
    ['Field', 'Value'],
    ['Financial Year', header.financial_year],
    ['Tax Period', periodLabel || header.return_period],
    ['GSTIN', header.gstin],
    ['Legal Name', header.legal_name || ''],
    ['Trade Name', header.trade_name || ''],
    ['Generated On', generatedOn],
  ];
}

function buildB2bSheet(invoices: Gstr1InvoiceInsert[]): unknown[][] {
  const headers = [
    'GSTIN/UIN of Recipient',
    'Receiver Name',
    'Invoice Number',
    'Invoice Date',
    'Invoice Value',
    'Place Of Supply',
    'Reverse Charge',
    'Invoice Type',
    'Rate',
    'Taxable Value',
    'Integrated Tax',
    'Central Tax',
    'State/UT Tax',
    'Cess Amount',
    'HSN',
  ];
  const rows = invoices
    .filter((i) => i.section === 'b2b')
    .map((i) => [
      i.counterparty_gstin || '',
      i.counterparty_name || '',
      i.invoice_number || '',
      formatGstr1PortalDate(i.invoice_date),
      round2(i.invoice_value),
      i.place_of_supply || '',
      i.reverse_charge ? 'Y' : 'N',
      i.invoice_type || 'R',
      i.tax_rate ?? '',
      round2(i.taxable_value),
      round2(i.igst_amount),
      round2(i.cgst_amount),
      round2(i.sgst_amount),
      round2(i.cess_amount),
      i.hsn_code || '',
    ]);
  return [headers, ...rows];
}

function buildB2clSheet(invoices: Gstr1InvoiceInsert[]): unknown[][] {
  const headers = [
    'Invoice Number',
    'Invoice Date',
    'Invoice Value',
    'Place Of Supply',
    'Rate',
    'Taxable Value',
    'Integrated Tax',
    'Central Tax',
    'State/UT Tax',
    'Cess Amount',
    'HSN',
  ];
  const rows = invoices
    .filter((i) => i.section === 'b2cl')
    .map((i) => [
      i.invoice_number || '',
      formatGstr1PortalDate(i.invoice_date),
      round2(i.invoice_value),
      i.place_of_supply || '',
      i.tax_rate ?? '',
      round2(i.taxable_value),
      round2(i.igst_amount),
      round2(i.cgst_amount),
      round2(i.sgst_amount),
      round2(i.cess_amount),
      i.hsn_code || '',
    ]);
  return [headers, ...rows];
}

function buildB2csSheet(invoices: Gstr1InvoiceInsert[]): unknown[][] {
  const headers = [
    'Type',
    'Place Of Supply',
    'Rate',
    'Taxable Value',
    'Integrated Tax',
    'Central Tax',
    'State/UT Tax',
    'Cess Amount',
  ];
  const rows = invoices
    .filter((i) => i.section === 'b2cs')
    .map((i) => [
      i.invoice_type || 'OE',
      i.place_of_supply || '',
      i.tax_rate ?? '',
      round2(i.taxable_value),
      round2(i.igst_amount),
      round2(i.cgst_amount),
      round2(i.sgst_amount),
      round2(i.cess_amount),
    ]);
  return [headers, ...rows];
}

function buildExpSheet(invoices: Gstr1InvoiceInsert[]): unknown[][] {
  const headers = [
    'Export Type',
    'Invoice Number',
    'Invoice Date',
    'Invoice Value',
    'Port Code',
    'Shipping Bill Number',
    'Shipping Bill Date',
    'Rate',
    'Taxable Value',
    'Integrated Tax',
    'Cess Amount',
  ];
  const rows = invoices
    .filter((i) => i.section === 'exp')
    .map((i) => [
      i.invoice_type || 'WPAY',
      i.invoice_number || '',
      formatGstr1PortalDate(i.invoice_date),
      round2(i.invoice_value),
      '',
      '',
      '',
      i.tax_rate ?? '',
      round2(i.taxable_value),
      round2(i.igst_amount),
      round2(i.cess_amount),
    ]);
  return [headers, ...rows];
}

function buildHsnSheet(
  title: string,
  rows: Gstr1ReturnData['hsn_b2b']
): unknown[][] {
  const headers = [
    'HSN',
    'UQC',
    'Total Quantity',
    'Rate',
    'Taxable Value',
    'Integrated Tax',
    'Central Tax',
    'State/UT Tax',
    'Cess Amount',
    'No. of records',
  ];
  const dataRows = rows.map((r) => [
    r.hsn,
    r.uqc,
    round2(r.qty),
    r.rate,
    round2(r.taxable),
    round2(r.igst),
    round2(r.cgst),
    round2(r.sgst),
    round2(r.cess),
    r.count,
  ]);
  return [[`${title} — HSN Summary`], [], headers, ...dataRows];
}

function buildDocsSheet(returnData: Gstr1ReturnData): unknown[][] {
  const headers = [
    'Nature of Document',
    'Sr. No. From',
    'Sr. No. To',
    'Total Number',
    'Cancelled',
    'Net Issued',
  ];
  const series = returnData.sections['13']?.series || [];
  const rows = series.map((s) => [
    s.doc_type,
    s.from,
    s.to,
    s.totnum,
    s.cancel,
    s.net_issue,
  ]);
  return [headers, ...rows];
}

/** Portal-style return summary — mirrors Gstr1SummaryPanel in the app */
export function buildReturnSummarySheet(
  returnData: Gstr1ReturnData,
  periodLabel?: string,
  invoices?: Gstr1InvoiceInsert[]
): unknown[][] {
  const { header, sections, total_liability, validation_warnings } = returnData;
  const label = periodLabel || formatPeriodLabel(header.return_period);
  const generatedOn = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rows: unknown[][] = [
    ['GSTR-1 RETURN SUMMARY'],
    [],
    ['Taxpayer Details'],
    ['Legal Name', header.legal_name || '—'],
    ['Trade Name', header.trade_name || '—'],
    ['GSTIN', header.gstin],
    ['Financial Year', header.financial_year],
    ['Return Period', label],
    ['Return Period (MMYYYY)', header.return_period],
    ['Generated On', generatedOn],
  ];

  if (validation_warnings.length > 0) {
    rows.push([], ['Validation Warnings']);
    validation_warnings.forEach((w) => rows.push(['', w]));
  }

  const sectionTableHeader = [
    'Section',
    'Description',
    'Records',
    'Taxable Value (₹)',
    'IGST (₹)',
    'CGST (₹)',
    'SGST (₹)',
    'Cess (₹)',
  ];

  const addSectionRow = (
    section: string,
    description: string,
    count: number,
    value: number,
    igst: number,
    cgst: number,
    sgst: number,
    cess: number
  ) => {
    rows.push([
      section,
      description,
      count,
      round2(value),
      round2(igst),
      round2(cgst),
      round2(sgst),
      round2(cess),
    ]);
  };

  rows.push([], ['Outward Supplies — Section-wise Summary (FORM GSTR-1)'], sectionTableHeader);

  addSectionRow(
    '4A',
    'B2B Regular',
    sections['4A'].count,
    sections['4A'].value,
    sections['4A'].igst,
    sections['4A'].cgst,
    sections['4A'].sgst,
    sections['4A'].cess
  );
  addSectionRow(
    '4B',
    'B2B Reverse Charge',
    sections['4B'].count,
    sections['4B'].value,
    sections['4B'].igst,
    sections['4B'].cgst,
    sections['4B'].sgst,
    sections['4B'].cess
  );
  addSectionRow(
    '5',
    'B2C Large (B2CL)',
    sections['5'].count,
    sections['5'].value,
    sections['5'].igst,
    sections['5'].cgst,
    sections['5'].sgst,
    sections['5'].cess
  );
  addSectionRow(
    '6A',
    'Exports',
    sections['6A'].count,
    sections['6A'].value,
    sections['6A'].igst,
    sections['6A'].cgst,
    sections['6A'].sgst,
    sections['6A'].cess
  );
  addSectionRow(
    '7',
    'B2C Others (B2CS)',
    sections['7'].count,
    sections['7'].value,
    sections['7'].igst,
    sections['7'].cgst,
    sections['7'].sgst,
    sections['7'].cess
  );
  addSectionRow(
    '8',
    'Nil / Exempt / Non-GST',
    sections['8'].count,
    sections['8'].value,
    sections['8'].igst,
    sections['8'].cgst,
    sections['8'].sgst,
    sections['8'].cess
  );
  addSectionRow(
    '12',
    'HSN Summary — B2B',
    sections['12_b2b'].hsn_rows,
    sections['12_b2b'].value,
    sections['12_b2b'].igst,
    sections['12_b2b'].cgst,
    sections['12_b2b'].sgst,
    sections['12_b2b'].cess
  );
  addSectionRow(
    '12',
    'HSN Summary — B2C',
    sections['12_b2c'].hsn_rows,
    sections['12_b2c'].value,
    sections['12_b2c'].igst,
    sections['12_b2c'].cgst,
    sections['12_b2c'].sgst,
    sections['12_b2c'].cess
  );
  addSectionRow('13', 'Documents Issued (net)', sections['13'].net_issued, 0, 0, 0, 0, 0);

  rows.push(
    [],
    [
      'Total Liability',
      '',
      total_liability.count,
      round2(total_liability.value),
      round2(total_liability.igst),
      round2(total_liability.cgst),
      round2(total_liability.sgst),
      round2(total_liability.cess),
    ]
  );

  const series = sections['13']?.series || [];
  if (series.length > 0) {
    rows.push(
      [],
      ['Table 13 — Document Series'],
      ['Document Type', 'From', 'To', 'Total', 'Cancelled', 'Net Issued']
    );
    series.forEach((s) => {
      rows.push([s.doc_type, s.from, s.to, s.totnum, s.cancel, s.net_issue]);
    });
  }

  if (invoices && invoices.length > 0) {
    const bySection = new Map<string, number>();
    invoices.forEach((inv) => {
      bySection.set(inv.section, (bySection.get(inv.section) || 0) + 1);
    });
    rows.push([], ['Invoice Lines by Section (detail sheets)'], ['Section', 'Invoice Count']);
    [...bySection.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([section, count]) => rows.push([section, count]));
    rows.push(['Total invoice lines', invoices.length]);
  }

  return rows;
}

export function buildGstr1Workbook(
  returnData: Gstr1ReturnData,
  invoices: Gstr1InvoiceInsert[],
  periodLabel?: string
): WorkBook {
  const label = periodLabel || formatPeriodLabel(returnData.header.return_period);
  const wb = XLSX.utils.book_new();

  addSheet(wb, 'Read me', buildReadMeSheet(returnData, label));
  addSheet(wb, 'Return Summary', buildReturnSummarySheet(returnData, label, invoices));
  addSheet(wb, 'b2b', buildB2bSheet(invoices));
  addSheet(wb, 'b2cl', buildB2clSheet(invoices));
  addSheet(wb, 'b2cs', buildB2csSheet(invoices));
  addSheet(wb, 'exp', buildExpSheet(invoices));
  addSheet(wb, 'hsn(b2b)', buildHsnSheet('B2B', returnData.hsn_b2b));
  addSheet(wb, 'hsn(b2c)', buildHsnSheet('B2C', returnData.hsn_b2c));
  addSheet(wb, 'docs', buildDocsSheet(returnData));

  return wb;
}

export function workbookToBlob(wb: WorkBook): Blob {
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function buildGstr1DownloadFilename(
  returnData: Gstr1ReturnData,
  periodLabel: string
): string {
  const period = (periodLabel || formatPeriodLabel(returnData.header.return_period))
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
  const company = (returnData.header.legal_name || returnData.header.trade_name || 'Taxpayer')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const fy = (returnData.header.financial_year || '').replace(/\//g, '-').replace(/\s+/g, '');
  const parts = ['GSTR-1', period, company].filter(Boolean);
  if (fy) parts.push(fy);
  return `${parts.join('_')}.xlsx`;
}

export function triggerGstr1ExcelDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Build workbook and return blob + filename for download */
export function buildGstr1ExcelDownload(
  returnData: Gstr1ReturnData,
  invoices: Gstr1InvoiceInsert[],
  periodLabel?: string
): { blob: Blob; filename: string } {
  const label = periodLabel || formatPeriodLabel(returnData.header.return_period);
  const wb = buildGstr1Workbook(returnData, invoices, label);
  return {
    blob: workbookToBlob(wb),
    filename: buildGstr1DownloadFilename(returnData, label),
  };
}
