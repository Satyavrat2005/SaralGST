export type Gstr1Section =
  | 'b2b'
  | 'b2cl'
  | 'b2cs'
  | 'exp'
  | 'cdnr'
  | 'cdnur'
  | 'nil'
  | 'doc_issue';

export interface TaxTotals {
  count: number;
  value: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface HsnSummaryRow {
  hsn: string;
  uqc: string;
  qty: number;
  rate: number;
  taxable: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  count: number;
}

export interface DocumentSeries {
  doc_num: number;
  doc_type: string;
  from: string;
  to: string;
  totnum: number;
  cancel: number;
  net_issue: number;
}

export interface Gstr1ReturnData {
  header: {
    gstin: string;
    legal_name: string | null;
    trade_name: string | null;
    financial_year: string;
    return_period: string;
  };
  sections: {
    '4A': TaxTotals;
    '4B': TaxTotals;
    '5': TaxTotals;
    '6A': TaxTotals;
    '7': TaxTotals;
    '8': TaxTotals;
    '12_b2b': TaxTotals & { hsn_rows: number };
    '12_b2c': TaxTotals & { hsn_rows: number };
    '13': { net_issued: number; series: DocumentSeries[] };
  };
  hsn_b2b: HsnSummaryRow[];
  hsn_b2c: HsnSummaryRow[];
  total_liability: TaxTotals;
  validation_warnings: string[];
  validation?: {
    errors: { level: string; message: string }[];
    warnings: { level: string; message: string }[];
    validated_at?: string;
  };
}

export interface BusinessProfileContext {
  gstin: string;
  legal_name: string | null;
  trade_name: string | null;
  state_cd: string;
  annual_turnover_range: string | null;
}

export interface SalesInvoiceRow {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_type: string | null;
  customer_name: string | null;
  customer_gstin: string | null;
  place_of_supply: string | null;
  hsn_sac_code: string | null;
  quantity: number | null;
  uqc: string | null;
  taxable_value: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  tcs_cess: number | null;
  gross_total: number | null;
  reverse_charge: boolean | null;
  voucher_type: string | null;
}

export interface Gstr1InvoiceInsert {
  return_id: string;
  user_id: string;
  section: Gstr1Section;
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_value: number;
  place_of_supply: string;
  counterparty_gstin: string | null;
  counterparty_name: string | null;
  taxable_value: number;
  igst_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  cess_amount: number;
  tax_rate: number;
  invoice_type: string;
  reverse_charge: boolean;
  hsn_code: string | null;
  description: string | null;
  uqc: string | null;
  quantity: number | null;
  validation_status: 'pending' | 'valid' | 'warning' | 'error';
  validation_errors: Record<string, unknown> | null;
  source: string;
  source_invoice_id: string;
}
