import type { Gstr2bDocumentRow } from './types';

/** Columns that exist on public.gstr2b_data — omit parser-only fields (line_count, note_type, reverse_charge). */
export function toGstr2bDbRow(row: Gstr2bDocumentRow) {
  return {
    return_id: row.return_id,
    user_id: row.user_id,
    section: row.section,
    supplier_gstin: row.supplier_gstin,
    supplier_name: row.supplier_name,
    invoice_number: row.invoice_number,
    invoice_date: row.invoice_date,
    invoice_value: row.invoice_value,
    place_of_supply: row.place_of_supply,
    taxable_value: row.taxable_value,
    igst_amount: row.igst_amount,
    cgst_amount: row.cgst_amount,
    sgst_amount: row.sgst_amount,
    cess_amount: row.cess_amount,
    tax_rate: row.tax_rate,
    itc_eligible: row.itc_eligible,
    itc_igst: row.itc_igst,
    itc_cgst: row.itc_cgst,
    itc_sgst: row.itc_sgst,
    itc_cess: row.itc_cess,
    match_status: row.match_status ?? 'not_matched',
    matched_purchase_id: row.matched_purchase_id ?? null,
  };
}

export function toGstr2bDbRows(rows: Gstr2bDocumentRow[]) {
  return rows.map(toGstr2bDbRow);
}
