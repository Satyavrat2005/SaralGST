import type { Gstr2bDocumentRow, PurchaseRegisterRow } from '@/lib/gstr2b/types';
import type { ComplianceVerdict, TaxEngineRuleId, TaxEngineVarianceDetails } from './taxEngineTypes';

export type DiscrepancyType =
  | 'missing_in_books'
  | 'missing_in_gstr2b'
  | 'value_mismatch'
  | 'matched';

export type DiscrepancyCategory =
  | 'in_gstr2b_not_in_books'
  | 'supplier_not_filed'
  | 'timing_cutoff'
  | 'amount_mismatch'
  | 'rounding_variance'
  | 'gstin_or_document_mismatch'
  | 'data_entry_gap';

export type InsightSeverity = 'low' | 'medium' | 'high';

export interface InsightFactor {
  code: string;
  label: string;
  evidence: string;
}

export interface SuggestedAction {
  priority: number;
  label: string;
}

export interface DiscrepancyClassification {
  category: DiscrepancyCategory;
  severity: InsightSeverity;
  factors: InsightFactor[];
  suggestedActions: SuggestedAction[];
  ruleTriggered?: TaxEngineRuleId;
}

export interface InsightAuditMeta {
  ruleTriggered: TaxEngineRuleId;
  anomalyId?: string;
  confidenceDelta?: number;
  modelConfidenceScore?: string;
  varianceDetails?: TaxEngineVarianceDetails;
  complianceHealthScore?: number;
  complianceVerdict?: ComplianceVerdict;
}

export interface InsightNarrative {
  summary: string;
  impact: string;
  actions: string[];
  confidenceNote?: string;
}

export interface ReconciliationInsightBundle {
  classification: DiscrepancyClassification;
  narrative: InsightNarrative;
  audit?: InsightAuditMeta;
  source: 'enriched' | 'rules';
}

export type InsightInvoicePayload = Partial<
  Pick<
    Gstr2bDocumentRow,
    | 'invoice_number'
    | 'invoice_date'
    | 'supplier_gstin'
    | 'supplier_name'
    | 'taxable_value'
    | 'igst_amount'
    | 'cgst_amount'
    | 'sgst_amount'
    | 'cess_amount'
    | 'place_of_supply'
    | 'section'
    | 'itc_eligible'
    | 'reverse_charge'
  >
> & { id?: string };

export type InsightPurchasePayload = Partial<
  Pick<
    PurchaseRegisterRow,
    | 'id'
    | 'invoice_number'
    | 'invoice_date'
    | 'supplier_gstin'
    | 'supplier_name'
    | 'taxable_value'
    | 'igst_amount'
    | 'cgst_amount'
    | 'sgst_amount'
    | 'cess_amount'
    | 'total_invoice_value'
  >
>;

export interface InsightRequestBody {
  returnId?: string;
  dksMarch?: boolean;
  discrepancyType: DiscrepancyType;
  period?: string;
  gstr2b?: InsightInvoicePayload | null;
  purchase?: InsightPurchasePayload | null;
  diff?: { taxable?: number; tax?: number };
  matchType?: 'exact' | 'fuzzy';
}

export interface CachedReconciliationInsight extends ReconciliationInsightBundle {
  cacheKey: string;
  createdAt: string;
}
