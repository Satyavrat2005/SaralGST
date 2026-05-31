import type { SalesInvoiceRow } from './types';

/** Align sales_invoices row for GSTR-1 (taxable from slabs, gross fallback). */
export function normalizeSalesInvoiceRow(inv: Record<string, unknown>): SalesInvoiceRow {
  const slabTaxable =
    (Number(inv.local_sales_taxable_18) || 0) +
    (Number(inv.local_sales_taxable_12) || 0) +
    (Number(inv.oms_sales_taxable_12) || 0);

  let taxable = Number(inv.taxable_value) || 0;
  if (taxable <= 0 && slabTaxable > 0) taxable = slabTaxable;

  const cgst = Number(inv.cgst_amount) || 0;
  const sgst = Number(inv.sgst_amount) || 0;
  const igst = Number(inv.igst_amount) || 0;
  const cess = Number(inv.tcs_cess) || 0;
  const roundOff = Number(inv.round_off) || 0;

  let gross = Number(inv.gross_total) || 0;
  if (gross <= 0 && (taxable > 0 || cgst + sgst + igst > 0)) {
    gross = taxable + cgst + sgst + igst + cess + roundOff;
  }

  return {
    id: String(inv.id),
    invoice_number: (inv.invoice_number as string) ?? null,
    invoice_date: inv.invoice_date ? String(inv.invoice_date).slice(0, 10) : null,
    invoice_type: (inv.invoice_type as string) ?? null,
    customer_name: (inv.customer_name as string) ?? null,
    customer_gstin: (inv.customer_gstin as string) ?? null,
    place_of_supply: (inv.place_of_supply as string) ?? null,
    hsn_sac_code: (inv.hsn_sac_code as string) ?? null,
    quantity: inv.quantity != null ? Number(inv.quantity) : null,
    uqc: (inv.uqc as string) ?? null,
    taxable_value: taxable,
    cgst_amount: cgst,
    sgst_amount: sgst,
    igst_amount: igst,
    tcs_cess: cess,
    gross_total: gross,
    reverse_charge: Boolean(inv.reverse_charge),
    voucher_type: (inv.voucher_type as string) ?? null,
  };
}
