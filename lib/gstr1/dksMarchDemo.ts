import type { Gstr1InvoiceInsert } from './types';

/** Synthetic 35 B2B invoices matching DKS Mar 2025 PDF aggregate totals */
export function buildDksMarchMockInvoices(
  returnId: string,
  userId: string
): Gstr1InvoiceInsert[] {
  const perInvoiceTaxable = 8335591.43 / 35;
  const perIgst = 50863.32 / 35;
  const perCgst = 499135.98 / 35;
  const perSgst = 499135.98 / 35;
  const rows: Gstr1InvoiceInsert[] = [];

  for (let i = 1; i <= 35; i++) {
    rows.push({
      return_id: returnId,
      user_id: userId,
      section: 'b2b',
      invoice_number: `INV-${1000 + i}`,
      invoice_date: '2025-03-15',
      invoice_value: perInvoiceTaxable + perCgst + perSgst + perIgst,
      place_of_supply: '27',
      counterparty_gstin: '29AAACW3775F1Z2',
      counterparty_name: `Customer ${i}`,
      taxable_value: perInvoiceTaxable,
      igst_amount: perIgst,
      cgst_amount: perCgst,
      sgst_amount: perSgst,
      cess_amount: 0,
      tax_rate: 18,
      invoice_type: 'R',
      reverse_charge: false,
      hsn_code: i <= 20 ? '72142090' : '73089090',
      description: null,
      uqc: 'MTS',
      quantity: 1,
      validation_status: 'valid',
      validation_errors: null,
      source: 'dks_march_demo',
      source_invoice_id: `dks-demo-${i}`,
    });
  }
  return rows;
}
