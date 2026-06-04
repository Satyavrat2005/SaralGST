import type { Gstr1InvoiceInsert, Gstr1ReturnData, HsnSummaryRow } from './types';
import { formatDateForGSTN, round2 } from './utils';

function parseReturnPeriodFromFp(period: string): { month: number; year: number } {
  return {
    month: parseInt(period.substring(0, 2), 10),
    year: parseInt(period.substring(2), 10),
  };
}

/** May 2025+ returns use bifurcated Table 12 (hsn_b2b / hsn_b2c); earlier periods use legacy hsn.data. */
export function usesBifurcatedHsnFormat(period: string): boolean {
  const { month, year } = parseReturnPeriodFromFp(period);
  return year > 2025 || (year === 2025 && month >= 5);
}

const VALID_UQC = new Set([
  'BAG', 'BAL', 'BDL', 'BKL', 'BOU', 'BOX', 'BTL', 'BUN', 'CAN', 'CBM', 'CCM', 'CMS', 'CTN',
  'DOZ', 'DRM', 'GGK', 'GMS', 'GRS', 'GYD', 'KGS', 'KLR', 'KME', 'LTR', 'MLT', 'MTR', 'MTS',
  'NOS', 'OTH', 'PAC', 'PCS', 'PRS', 'QTL', 'ROL', 'SET', 'SQF', 'SQM', 'SQY', 'TBS', 'TGM',
  'THD', 'TON', 'TUB', 'UGS', 'UNT', 'YDS', 'NA',
]);

/** GSTN HSN rows: inter-state uses iamt only; intra-state uses camt+samt (never both). */
export function mapHsnRowToGstn(row: HsnSummaryRow, idx: number): Record<string, string | number> {
  const uqc = VALID_UQC.has((row.uqc || 'NOS').toUpperCase()) ? (row.uqc || 'NOS').toUpperCase() : 'NOS';
  const txval = round2(Number(row.taxable) || 0);
  const iamt = round2(Number(row.igst) || 0);
  const camt = round2(Number(row.cgst) || 0);
  const samt = round2(Number(row.sgst) || 0);
  const csamt = round2(Number(row.cess) || 0);
  const isInterState = iamt > 0;

  const entry: Record<string, string | number> = {
    num: idx + 1,
    hsn_sc: String(row.hsn).trim(),
    desc: 'Outward supply',
    uqc,
    qty: Number(row.qty) || 0,
    rt: Number(row.rate) || 0,
    txval,
  };

  if (isInterState) {
    entry.iamt = iamt;
  } else {
    entry.camt = camt;
    entry.samt = samt;
  }
  if (csamt > 0) entry.csamt = csamt;

  return entry;
}

export function buildGstnPayload(
  invoices: Gstr1InvoiceInsert[],
  returnData: Gstr1ReturnData,
  period: string,
  gstin: string
): Record<string, unknown> {
  const b2bMap = new Map<string, Gstr1InvoiceInsert[]>();
  const b2clMap = new Map<string, Gstr1InvoiceInsert[]>();
  const b2csItems: Gstr1InvoiceInsert[] = [];
  const expItems: Gstr1InvoiceInsert[] = [];

  invoices.forEach((inv) => {
    if (inv.section === 'b2b' && inv.counterparty_gstin) {
      if (!b2bMap.has(inv.counterparty_gstin)) b2bMap.set(inv.counterparty_gstin, []);
      b2bMap.get(inv.counterparty_gstin)!.push(inv);
    } else if (inv.section === 'b2cl') {
      const pos = inv.place_of_supply || '27';
      if (!b2clMap.has(pos)) b2clMap.set(pos, []);
      b2clMap.get(pos)!.push(inv);
    } else if (inv.section === 'b2cs') {
      b2csItems.push(inv);
    } else if (inv.section === 'exp') {
      expItems.push(inv);
    }
  });

  const b2b = Array.from(b2bMap.entries()).map(([ctin, invs]) => ({
    ctin,
    inv: invs.map((inv) => ({
      inum: inv.invoice_number,
      idt: formatDateForGSTN(inv.invoice_date),
      val: inv.invoice_value || 0,
      pos: inv.place_of_supply || '27',
      rchrg: inv.reverse_charge ? 'Y' : 'N',
      inv_typ: inv.invoice_type || 'R',
      itms: [
        {
          num: 1,
          itm_det: {
            rt: inv.tax_rate || 18,
            txval: inv.taxable_value || 0,
            iamt: inv.igst_amount || 0,
            camt: inv.cgst_amount || 0,
            samt: inv.sgst_amount || 0,
            csamt: inv.cess_amount || 0,
          },
        },
      ],
    })),
  }));

  const b2cl = Array.from(b2clMap.entries()).map(([pos, invs]) => ({
    pos,
    inv: invs.map((inv) => ({
      inum: inv.invoice_number,
      idt: formatDateForGSTN(inv.invoice_date),
      val: inv.invoice_value || 0,
      itms: [
        {
          num: 1,
          itm_det: {
            rt: inv.tax_rate || 18,
            txval: inv.taxable_value || 0,
            iamt: inv.igst_amount || 0,
            csamt: inv.cess_amount || 0,
          },
        },
      ],
    })),
  }));

  const b2csAgg = new Map<string, Record<string, number | string>>();
  b2csItems.forEach((inv) => {
    const key = `${inv.place_of_supply || '27'}_${inv.tax_rate || 18}_${(inv.igst_amount || 0) > 0 ? 'INTER' : 'INTRA'}`;
    if (!b2csAgg.has(key)) {
      b2csAgg.set(key, {
        sply_ty: (inv.igst_amount || 0) > 0 ? 'INTER' : 'INTRA',
        pos: inv.place_of_supply || '27',
        rt: inv.tax_rate || 18,
        txval: 0,
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0,
      });
    }
    const entry = b2csAgg.get(key)!;
    entry.txval = (entry.txval as number) + (inv.taxable_value || 0);
    entry.iamt = (entry.iamt as number) + (inv.igst_amount || 0);
    entry.camt = (entry.camt as number) + (inv.cgst_amount || 0);
    entry.samt = (entry.samt as number) + (inv.sgst_amount || 0);
    entry.csamt = (entry.csamt as number) + (inv.cess_amount || 0);
  });

  const exp = expItems.length
    ? [
        {
          exp_typ: 'WPAY',
          inv: expItems.map((inv) => ({
            inum: inv.invoice_number,
            idt: formatDateForGSTN(inv.invoice_date),
            val: inv.invoice_value || 0,
            sbpcode: '96',
            sbnum: '',
            sbdt: formatDateForGSTN(inv.invoice_date),
            itms: [
              {
                num: 1,
                itm_det: {
                  rt: inv.tax_rate || 0,
                  txval: inv.taxable_value || 0,
                  iamt: inv.igst_amount || 0,
                  csamt: inv.cess_amount || 0,
                },
              },
            ],
          })),
        },
      ]
    : undefined;

  const hsnB2bData = (returnData.hsn_b2b ?? []).map(mapHsnRowToGstn);
  const hsnB2cData = (returnData.hsn_b2c ?? []).map(mapHsnRowToGstn);

  const doc_det = returnData.sections['13'].series.map((s) => ({
    doc_num: s.doc_num,
    docs: [
      {
        num: 1,
        from: s.from,
        to: s.to,
        totnum: s.totnum,
        cancel: s.cancel,
        net_issue: s.net_issue,
      },
    ],
  }));

  const payload: Record<string, unknown> = {
    gstin,
    fp: period,
  };

  if (b2b.length > 0) payload.b2b = b2b;
  if (b2cl.length > 0) payload.b2cl = b2cl;
  if (b2csAgg.size > 0) payload.b2cs = Array.from(b2csAgg.values());
  if (exp) payload.exp = exp;

  // GSTN schema oneOf: legacy { data: [] } OR May'25+ { hsn_b2b: [], hsn_b2c: [] } — never both shapes.
  if (hsnB2bData.length > 0 || hsnB2cData.length > 0) {
    if (usesBifurcatedHsnFormat(period)) {
      payload.hsn = {
        hsn_b2b: hsnB2bData,
        hsn_b2c: hsnB2cData,
      };
    } else {
      payload.hsn = {
        data: [...hsnB2bData, ...hsnB2cData].map((row, idx) => ({ ...row, num: idx + 1 })),
      };
    }
  }

  if (doc_det.length > 0) {
    payload.doc_issue = { doc_det };
  }

  return payload;
}
