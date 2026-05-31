import type {
  DocumentSeries,
  Gstr1InvoiceInsert,
  Gstr1ReturnData,
  HsnSummaryRow,
  TaxTotals,
} from './types';
import type { BusinessProfileContext } from './types';
import {
  emptyTaxTotals,
  getRequiredHsnDigits,
  isB2bSection,
  isB2cSection,
  round2,
  sumTaxTotals,
} from './utils';

function buildHsnSummary(
  invoices: Gstr1InvoiceInsert[],
  filterB2b: boolean
): HsnSummaryRow[] {
  const map = new Map<string, HsnSummaryRow>();
  invoices
    .filter((inv) => {
      if (!inv.hsn_code) return false;
      return filterB2b ? isB2bSection(inv.section) : isB2cSection(inv.section);
    })
    .forEach((inv) => {
      const key = `${inv.hsn_code}_${inv.tax_rate}`;
      if (!map.has(key)) {
        map.set(key, {
          hsn: inv.hsn_code!,
          uqc: inv.uqc || 'NOS',
          qty: 0,
          rate: inv.tax_rate || 0,
          taxable: 0,
          igst: 0,
          cgst: 0,
          sgst: 0,
          cess: 0,
          count: 0,
        });
      }
      const row = map.get(key)!;
      row.qty += inv.quantity || 0;
      row.taxable += inv.taxable_value || 0;
      row.igst += inv.igst_amount || 0;
      row.cgst += inv.cgst_amount || 0;
      row.sgst += inv.sgst_amount || 0;
      row.cess += inv.cess_amount || 0;
      row.count += 1;
    });
  return Array.from(map.values()).map((r) => ({
    ...r,
    taxable: round2(r.taxable),
    igst: round2(r.igst),
    cgst: round2(r.cgst),
    sgst: round2(r.sgst),
    cess: round2(r.cess),
  }));
}

function hsnToTotals(rows: HsnSummaryRow[]): TaxTotals {
  return rows.reduce(
    (acc, r) => ({
      count: acc.count + 1,
      value: acc.value + r.taxable,
      igst: acc.igst + r.igst,
      cgst: acc.cgst + r.cgst,
      sgst: acc.sgst + r.sgst,
      cess: acc.cess + r.cess,
    }),
    emptyTaxTotals()
  );
}

/** Parse numeric suffix from invoice numbers for document series */
function parseInvoiceSerial(invoiceNumber: string): number | null {
  const match = invoiceNumber.match(/(\d+)\s*$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

export function buildDocumentSeries(
  invoices: Gstr1InvoiceInsert[]
): DocumentSeries[] {
  const outward = invoices.filter(
    (i) => i.section === 'b2b' || i.section === 'b2cl' || i.section === 'b2cs'
  );
  if (outward.length === 0) return [];

  const serials = outward
    .map((i) => i.invoice_number)
    .filter((n): n is string => Boolean(n))
    .map(parseInvoiceSerial)
    .filter((n): n is number => n !== null);

  const totnum = outward.length;
  const cancel = 0;
  const net_issue = totnum - cancel;

  if (serials.length > 0) {
    const from = String(Math.min(...serials));
    const to = String(Math.max(...serials));
    return [
      {
        doc_num: 1,
        doc_type: 'Invoices for outward supply',
        from,
        to,
        totnum,
        cancel,
        net_issue,
      },
    ];
  }

  return [
    {
      doc_num: 1,
      doc_type: 'Invoices for outward supply',
      from: '1',
      to: String(totnum),
      totnum,
      cancel,
      net_issue,
    },
  ];
}

export function buildGstr1ReturnData(
  invoices: Gstr1InvoiceInsert[],
  profile: BusinessProfileContext,
  financialYear: string,
  returnPeriod: string
): Gstr1ReturnData {
  const b2b = invoices.filter((i) => i.section === 'b2b' && !i.reverse_charge);
  const b2bRc = invoices.filter((i) => i.section === 'b2b' && i.reverse_charge);
  const b2cl = invoices.filter((i) => i.section === 'b2cl');
  const b2cs = invoices.filter((i) => i.section === 'b2cs');
  const exp = invoices.filter((i) => i.section === 'exp');

  const t4A = sumTaxTotals(b2b);
  const t4B = sumTaxTotals(b2bRc);
  const t5 = sumTaxTotals(b2cl);
  const t6A = sumTaxTotals(exp);
  const t7 = sumTaxTotals(b2cs);

  const hsn_b2b = buildHsnSummary(invoices, true);
  const hsn_b2c = buildHsnSummary(invoices, false);
  const t12b2b = hsnToTotals(hsn_b2b);
  const t12b2c = hsnToTotals(hsn_b2c);

  const docSeries = buildDocumentSeries(invoices);
  const netIssued = docSeries.reduce((s, d) => s + d.net_issue, 0);

  const warnings: string[] = [];
  const hsnDigits = getRequiredHsnDigits(profile.annual_turnover_range);
  [...hsn_b2b, ...hsn_b2c].forEach((row) => {
    const len = (row.hsn || '').replace(/\D/g, '').length;
    if (len > 0 && len < hsnDigits) {
      warnings.push(`HSN ${row.hsn} has fewer than ${hsnDigits} digits required for your turnover.`);
    }
  });

  if (Math.abs(t12b2b.value - t4A.value) > 1 && t4A.count > 0) {
    warnings.push(
      `Table 12 B2B taxable (₹${t12b2b.value.toLocaleString('en-IN')}) differs from Table 4A (₹${t4A.value.toLocaleString('en-IN')}).`
    );
  }

  if (netIssued > 0 && t4A.count + t5.count + t7.count > 0 && netIssued !== t4A.count + t5.count + t7.count) {
    warnings.push(
      `Table 13 net issued (${netIssued}) differs from outward invoice count (${t4A.count + t5.count + t7.count}).`
    );
  }

  const total_liability: TaxTotals = {
    count: t4A.count + t5.count + t7.count + t6A.count,
    value: round2(t4A.value + t5.value + t7.value + t6A.value),
    igst: round2(t4A.igst + t5.igst + t7.igst + t6A.igst),
    cgst: round2(t4A.cgst + t5.cgst + t7.cgst + t6A.cgst),
    sgst: round2(t4A.sgst + t5.sgst + t7.sgst + t6A.sgst),
    cess: round2(t4A.cess + t5.cess + t7.cess + t6A.cess),
  };

  return {
    header: {
      gstin: profile.gstin,
      legal_name: profile.legal_name,
      trade_name: profile.trade_name,
      financial_year: financialYear,
      return_period: returnPeriod,
    },
    sections: {
      '4A': { ...t4A, value: round2(t4A.value) },
      '4B': { ...t4B, value: round2(t4B.value) },
      '5': { ...t5, value: round2(t5.value) },
      '6A': { ...t6A, value: round2(t6A.value) },
      '7': { ...t7, value: round2(t7.value) },
      '8': emptyTaxTotals(),
      '12_b2b': { ...t12b2b, hsn_rows: hsn_b2b.length },
      '12_b2c': { ...t12b2c, hsn_rows: hsn_b2c.length },
      '13': { net_issued: netIssued, series: docSeries },
    },
    hsn_b2b,
    hsn_b2c,
    total_liability,
    validation_warnings: warnings,
  };
}
