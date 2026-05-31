import type {
  BusinessProfileContext,
  Gstr1InvoiceInsert,
  SalesInvoiceRow,
} from './types';
import { classifySalesInvoice } from './classifyInvoice';
import { validateForGstr1Mapping } from './gstr1InvoiceValidation';
import { normalizeSalesInvoiceRow } from './normalizeSales';
import { extractStateCode, normalizeGstin } from './utils';

export function mapSalesInvoiceToGstr1(
  raw: SalesInvoiceRow | Record<string, unknown>,
  profile: BusinessProfileContext,
  returnId: string,
  userId: string
): Gstr1InvoiceInsert {
  const inv =
    'id' in raw && typeof raw.id === 'string'
      ? (raw as SalesInvoiceRow)
      : normalizeSalesInvoiceRow(raw as Record<string, unknown>);

  const section = classifySalesInvoice(inv, profile);
  const placeOfSupply = extractStateCode(
    inv.place_of_supply,
    profile.state_cd || extractStateCode(profile.gstin)
  );
  const taxable = inv.taxable_value || 0;
  const taxSum =
    (inv.igst_amount || 0) + (inv.cgst_amount || 0) + (inv.sgst_amount || 0);
  const taxRate =
    taxable > 0 ? Math.round((taxSum / taxable) * 100) : 0;

  const validation = validateForGstr1Mapping({
    invoice_number: inv.invoice_number,
    invoice_date: inv.invoice_date,
    taxable_value: taxable,
    gross_total: inv.gross_total || 0,
    customer_gstin: inv.customer_gstin,
    section,
  });

  const validation_status = validation.status;

  return {
    return_id: returnId,
    user_id: userId,
    section,
    invoice_number: inv.invoice_number,
    invoice_date: inv.invoice_date,
    invoice_value: inv.gross_total || 0,
    place_of_supply: placeOfSupply,
    counterparty_gstin: normalizeGstin(inv.customer_gstin),
    counterparty_name: inv.customer_name,
    taxable_value: taxable,
    igst_amount: inv.igst_amount || 0,
    cgst_amount: inv.cgst_amount || 0,
    sgst_amount: inv.sgst_amount || 0,
    cess_amount: inv.tcs_cess || 0,
    tax_rate: taxRate,
    invoice_type: 'R',
    reverse_charge: inv.reverse_charge || false,
    hsn_code: inv.hsn_sac_code,
    description: inv.voucher_type,
    uqc: inv.uqc || 'NOS',
    quantity: inv.quantity,
    validation_status,
    validation_errors:
      validation.errors.length || validation.warnings.length
        ? { errors: validation.errors, warnings: validation.warnings }
        : null,
    source: 'sales_register',
    source_invoice_id: inv.id,
  };
}
