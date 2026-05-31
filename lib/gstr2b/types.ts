export type Gstr2bSection = 'b2b' | 'b2ba' | 'cdnr' | 'cdnra' | 'isd' | 'isda' | 'impg' | 'impgsez';

export interface Gstr2bDocumentRow {
  return_id: string;
  user_id: string;
  section: Gstr2bSection;
  supplier_gstin: string | null;
  supplier_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_value: number;
  place_of_supply: string | null;
  taxable_value: number;
  igst_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  cess_amount: number;
  tax_rate: number;
  itc_eligible: boolean;
  itc_igst: number;
  itc_cgst: number;
  itc_sgst: number;
  itc_cess: number;
  reverse_charge?: boolean;
  note_type?: string | null;
  line_count?: number;
  match_status?: string;
  matched_purchase_id?: string | null;
}

export interface Gstr2bSectionTotals {
  count: number;
  taxable: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  itc: number;
  eligible_count: number;
}

export interface Gstr2bItcSummary {
  available: { taxable: number; igst: number; cgst: number; sgst: number; cess: number; itc: number; count: number };
  not_available: { taxable: number; igst: number; cgst: number; sgst: number; cess: number; itc: number; count: number };
  reversal: { igst: number; cgst: number; sgst: number; cess: number; count: number };
}

export interface Gstr2bReconciliationStats {
  total_gstr2b: number;
  total_purchase: number;
  matched: number;
  partial: number;
  unmatched_gstr2b: number;
  missing_in_gstr2b: number;
  match_pct: number;
  ran_at: string;
}

export interface Gstr2bReturnData {
  period: string;
  fetched_at: string;
  sections: Record<string, Gstr2bSectionTotals>;
  summary_table3: Gstr2bItcSummary['available'];
  summary_table4: Gstr2bItcSummary['not_available'];
  reconciliation?: Gstr2bReconciliationStats;
  portal_summary?: unknown;
  diagnostics?: {
    recordsParsed: number;
    generationRequested?: boolean;
    emptyPortal?: boolean;
    source?: 'portal' | 'sandbox_fixture';
    portalErrorCode?: string;
    portalErrorMessage?: string;
    requestedPeriod?: string;
  };
}

export interface PurchaseRegisterRow {
  id: string;
  supplier_gstin?: string | null;
  supplier_name?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  taxable_value?: number | null;
  igst_amount?: number | null;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  cess_amount?: number | null;
  total_invoice_value?: number | null;
  is_itc_eligible?: boolean | null;
}

export interface ReconcileMatchResult {
  gstr2b_id?: string;
  purchase_id?: string;
  match_status: 'matched' | 'partial' | 'not_matched' | 'missing_in_gstr2b' | 'missing_in_books';
  match_type?: 'exact' | 'fuzzy' | 'none';
  diff?: { taxable?: number; tax?: number };
}
