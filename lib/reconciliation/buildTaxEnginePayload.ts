import type {
  DiscrepancyClassification,
  DiscrepancyType,
  InsightInvoicePayload,
  InsightPurchasePayload,
} from './insightTypes';
import type { TaxEngineInputPackets } from './taxEngineTypes';
import { ruleIdForDiscrepancyType } from './taxEngineRules';

function rowTax(row: {
  igst_amount?: number | null;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  cess_amount?: number | null;
}): number {
  return (
    (row.igst_amount || 0) +
    (row.cgst_amount || 0) +
    (row.sgst_amount || 0) +
    (row.cess_amount || 0)
  );
}

export function buildTaxEngineInputPackets(
  discrepancyType: DiscrepancyType,
  classification: DiscrepancyClassification,
  context: {
    period?: string;
    gstr2b?: InsightInvoicePayload | null;
    purchase?: InsightPurchasePayload | null;
    diff?: { taxable?: number; tax?: number };
  }
): TaxEngineInputPackets {
  const purchase = context.purchase;
  const gstr2b = context.gstr2b;
  const bookVal =
    purchase?.taxable_value ?? purchase?.total_invoice_value ?? 0;
  const g2bVal = gstr2b?.taxable_value ?? 0;
  const taxDisc = context.diff?.tax ?? rowTax(purchase || {}) - rowTax(gstr2b || {});

  return {
    COMPANY_GSTR1_PURCHASE_DATA: purchase
      ? {
          invoice_number: purchase.invoice_number,
          invoice_date: purchase.invoice_date,
          supplier_gstin: purchase.supplier_gstin,
          supplier_name: purchase.supplier_name,
          taxable_value: purchase.taxable_value,
          total_invoice_value: purchase.total_invoice_value,
          igst_amount: purchase.igst_amount,
          cgst_amount: purchase.cgst_amount,
          sgst_amount: purchase.sgst_amount,
          cess_amount: purchase.cess_amount,
        }
      : null,
    GOVERNMENT_GSTR2B_DATA: gstr2b
      ? {
          invoice_number: gstr2b.invoice_number,
          invoice_date: gstr2b.invoice_date,
          supplier_gstin: gstr2b.supplier_gstin,
          supplier_name: gstr2b.supplier_name,
          taxable_value: gstr2b.taxable_value,
          igst_amount: gstr2b.igst_amount,
          cgst_amount: gstr2b.cgst_amount,
          sgst_amount: gstr2b.sgst_amount,
          cess_amount: gstr2b.cess_amount,
          place_of_supply: gstr2b.place_of_supply,
          itc_eligible: gstr2b.itc_eligible,
          section: gstr2b.section,
        }
      : null,
    PRE_MATCHED_DISCREPANCIES: {
      return_period: context.period,
      discrepancy_type: discrepancyType,
      rule_triggered: ruleIdForDiscrepancyType(discrepancyType),
      classification,
      variance: {
        purchase_register_val: bookVal,
        gstr_2b_val: g2bVal,
        taxable_discrepancy: context.diff?.taxable ?? bookVal - g2bVal,
        tax_discrepancy: taxDisc,
      },
      deterministic_factors: classification.factors,
    },
  };
}
