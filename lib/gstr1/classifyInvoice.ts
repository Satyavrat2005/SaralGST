import type { BusinessProfileContext, Gstr1Section, SalesInvoiceRow } from './types';
import {
  extractStateCode,
  getB2clThreshold,
  isExportInvoice,
  isValidGstin,
} from './utils';

export function classifySalesInvoice(
  inv: SalesInvoiceRow,
  profile: BusinessProfileContext
): Gstr1Section {
  if (isExportInvoice(inv)) return 'exp';

  const supplierState = profile.state_cd || extractStateCode(profile.gstin);
  const pos = extractStateCode(inv.place_of_supply, supplierState);
  const invoiceValue = inv.gross_total || inv.taxable_value || 0;
  const isInterState =
    (inv.igst_amount || 0) > 0 || (pos && supplierState && pos !== supplierState);

  const customerGstin = inv.customer_gstin?.trim().toUpperCase() || '';
  const filerGstin = profile.gstin?.trim().toUpperCase() || '';
  if (
    isValidGstin(customerGstin) &&
    customerGstin !== filerGstin
  ) {
    return 'b2b';
  }

  const threshold = getB2clThreshold(inv.invoice_date);
  if (isInterState && invoiceValue > threshold) {
    return 'b2cl';
  }

  return 'b2cs';
}
