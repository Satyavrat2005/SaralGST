import type { Gstr2bDocumentRow, Gstr2bSection } from './types';
import { isItcEligible, isReverseCharge, parseGstnDate, round2 } from './utils';

interface LineAgg {
  taxable: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  rates: number[];
  lineCount: number;
}

function sumLines(itms: unknown[]): LineAgg {
  const agg: LineAgg = { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0, rates: [], lineCount: 0 };
  (itms || []).forEach((itm) => {
    const item = itm as { itm_det?: Record<string, number> };
    const det = item.itm_det || {};
    agg.taxable += det.txval || 0;
    agg.igst += det.iamt || 0;
    agg.cgst += det.camt || 0;
    agg.sgst += det.samt || 0;
    agg.cess += det.csamt || 0;
    if (det.rt != null) agg.rates.push(det.rt);
    agg.lineCount += 1;
  });
  return agg;
}

function buildRow(
  base: Omit<Gstr2bDocumentRow, 'taxable_value' | 'igst_amount' | 'cgst_amount' | 'sgst_amount' | 'cess_amount' | 'tax_rate' | 'itc_igst' | 'itc_cgst' | 'itc_sgst' | 'itc_cess' | 'line_count'>,
  agg: LineAgg,
  eligible: boolean
): Gstr2bDocumentRow {
  const sign = base.section === 'cdnr' || base.section === 'cdnra' ? -1 : 1;
  const mul = (n: number) => round2(n * sign);
  return {
    ...base,
    taxable_value: mul(agg.taxable),
    igst_amount: mul(agg.igst),
    cgst_amount: mul(agg.cgst),
    sgst_amount: mul(agg.sgst),
    cess_amount: mul(agg.cess),
    tax_rate: agg.rates.length ? agg.rates[0] : 0,
    itc_eligible: eligible,
    itc_igst: eligible ? mul(agg.igst) : 0,
    itc_cgst: eligible ? mul(agg.cgst) : 0,
    itc_sgst: eligible ? mul(agg.sgst) : 0,
    itc_cess: eligible ? mul(agg.cess) : 0,
    line_count: agg.lineCount,
    match_status: 'not_matched',
  };
}

function parseB2bLike(
  suppliers: unknown[],
  section: Gstr2bSection,
  returnId: string,
  userId: string,
  table4 = false
): Gstr2bDocumentRow[] {
  const rows: Gstr2bDocumentRow[] = [];
  (suppliers || []).forEach((s) => {
    const supplier = s as { ctin?: string; trdnm?: string; inv?: unknown[] };
    (supplier.inv || []).forEach((invRaw) => {
      const inv = invRaw as {
        inum?: string;
        idt?: string;
        val?: number;
        pos?: string;
        itms?: unknown[];
        itc_avl?: string;
        itcavl?: string;
        rchrg?: string;
        inv_typ?: string;
      };
      const agg = sumLines(inv.itms || []);
      const eligible = table4 ? false : isItcEligible(inv);
      rows.push(
        buildRow(
          {
            return_id: returnId,
            user_id: userId,
            section,
            supplier_gstin: supplier.ctin || null,
            supplier_name: supplier.trdnm || supplier.ctin || null,
            invoice_number: inv.inum || null,
            invoice_date: parseGstnDate(inv.idt),
            invoice_value: inv.val || 0,
            place_of_supply: inv.pos || null,
            reverse_charge: isReverseCharge(inv),
          },
          agg,
          eligible
        )
      );
    });
  });
  return rows;
}

function parseCdnrLike(
  suppliers: unknown[],
  section: Gstr2bSection,
  returnId: string,
  userId: string,
  table4 = false
): Gstr2bDocumentRow[] {
  const rows: Gstr2bDocumentRow[] = [];
  (suppliers || []).forEach((s) => {
    const supplier = s as { ctin?: string; trdnm?: string; nt?: unknown[] };
    (supplier.nt || []).forEach((noteRaw) => {
      const note = noteRaw as {
        nt_num?: string;
        nt_dt?: string;
        ntty?: string;
        val?: number;
        pos?: string;
        itms?: unknown[];
        itc_avl?: string;
        rchrg?: string;
      };
      const agg = sumLines(note.itms || []);
      const eligible = table4 ? false : isItcEligible(note);
      rows.push(
        buildRow(
          {
            return_id: returnId,
            user_id: userId,
            section,
            supplier_gstin: supplier.ctin || null,
            supplier_name: supplier.trdnm || supplier.ctin || null,
            invoice_number: note.nt_num || null,
            invoice_date: parseGstnDate(note.nt_dt),
            invoice_value: note.val || 0,
            place_of_supply: note.pos || null,
            note_type: note.ntty || null,
            reverse_charge: isReverseCharge(note),
          },
          agg,
          eligible
        )
      );
    });
  });
  return rows;
}

function parseIsdLike(
  entries: unknown[],
  section: Gstr2bSection,
  returnId: string,
  userId: string,
  table4 = false
): Gstr2bDocumentRow[] {
  const rows: Gstr2bDocumentRow[] = [];
  (entries || []).forEach((entryRaw) => {
    const entry = entryRaw as {
      ctin?: string;
      trdnm?: string;
      docnum?: string;
      docdt?: string;
      igst?: number;
      cgst?: number;
      sgst?: number;
      cess?: number;
      itc_avl?: string;
    };
    const agg: LineAgg = {
      taxable: 0,
      igst: entry.igst || 0,
      cgst: entry.cgst || 0,
      sgst: entry.sgst || 0,
      cess: entry.cess || 0,
      rates: [],
      lineCount: 1,
    };
    const eligible = table4 ? false : isItcEligible(entry);
    rows.push(
      buildRow(
        {
          return_id: returnId,
          user_id: userId,
          section,
          supplier_gstin: entry.ctin || null,
          supplier_name: entry.trdnm || entry.ctin || 'ISD',
          invoice_number: entry.docnum || null,
          invoice_date: parseGstnDate(entry.docdt),
          invoice_value: agg.igst + agg.cgst + agg.sgst + agg.cess,
          place_of_supply: null,
        },
        agg,
        eligible
      )
    );
  });
  return rows;
}

function parseImpgLike(
  entries: unknown[],
  section: Gstr2bSection,
  returnId: string,
  userId: string
): Gstr2bDocumentRow[] {
  const rows: Gstr2bDocumentRow[] = [];
  (entries || []).forEach((entryRaw) => {
    const entry = entryRaw as {
      boenum?: string;
      boedt?: string;
      portcode?: string;
      txval?: number;
      igst?: number;
      cess?: number;
      sgstin?: string;
      trdnm?: string;
    };
    const agg: LineAgg = {
      taxable: entry.txval || 0,
      igst: entry.igst || 0,
      cgst: 0,
      sgst: 0,
      cess: entry.cess || 0,
      rates: [],
      lineCount: 1,
    };
    rows.push(
      buildRow(
        {
          return_id: returnId,
          user_id: userId,
          section,
          supplier_gstin: entry.sgstin || null,
          supplier_name: entry.trdnm || entry.portcode || 'Import',
          invoice_number: entry.boenum || null,
          invoice_date: parseGstnDate(entry.boedt),
          invoice_value: (entry.txval || 0) + (entry.igst || 0) + (entry.cess || 0),
          place_of_supply: entry.portcode || null,
        },
        agg,
        true
      )
    );
  });
  return rows;
}

function getDocdata(response: unknown): Record<string, unknown> {
  const root = response as { data?: Record<string, unknown> };
  const data = root?.data || (response as Record<string, unknown>);
  const docdata = (data as { docdata?: Record<string, unknown> }).docdata || data;
  return docdata as Record<string, unknown>;
}

export function parseGstr2bResponse(
  response: unknown,
  returnId: string,
  userId: string
): Gstr2bDocumentRow[] {
  const doc = getDocdata(response);
  const rows: Gstr2bDocumentRow[] = [];

  const sections: Array<{ key: string; section: Gstr2bSection; table4?: boolean; parser: 'b2b' | 'cdnr' | 'isd' | 'impg' }> = [
    { key: 'b2b', section: 'b2b', parser: 'b2b' },
    { key: 'b2ba', section: 'b2ba', parser: 'b2b' },
    { key: 'cdnr', section: 'cdnr', parser: 'cdnr' },
    { key: 'cdnra', section: 'cdnra', parser: 'cdnr' },
    { key: 'isd', section: 'isd', parser: 'isd' },
    { key: 'isda', section: 'isda', parser: 'isd' },
    { key: 'impg', section: 'impg', parser: 'impg' },
    { key: 'impgsez', section: 'impgsez', parser: 'impg' },
    { key: 'b2b_table4', section: 'b2b', table4: true, parser: 'b2b' },
    { key: 'cdnr_table4', section: 'cdnr', table4: true, parser: 'cdnr' },
  ];

  for (const cfg of sections) {
    const block = doc[cfg.key];
    if (!block) continue;
    if (cfg.parser === 'b2b') {
      rows.push(...parseB2bLike(block as unknown[], cfg.section, returnId, userId, cfg.table4));
    } else if (cfg.parser === 'cdnr') {
      rows.push(...parseCdnrLike(block as unknown[], cfg.section, returnId, userId, cfg.table4));
    } else if (cfg.parser === 'isd') {
      rows.push(...parseIsdLike(block as unknown[], cfg.section, returnId, userId, cfg.table4));
    } else if (cfg.parser === 'impg') {
      rows.push(...parseImpgLike(block as unknown[], cfg.section, returnId, userId));
    }
  }

  return rows;
}
