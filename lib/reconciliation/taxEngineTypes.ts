/** Server-side TaxEngine audit schema (not exposed to clients as branded product). */

export type TaxEngineRuleId =
  | 'Rule_01_Value_Mismatch'
  | 'Rule_02_Missing_Supplier_Upload'
  | 'Rule_03_Unrecorded_Supplier_Invoice'
  | 'Rule_04_GSTIN_Mismatch';

export type TaxEngineSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type ComplianceVerdict = 'CRITICAL' | 'ATTENTION_REQUIRED' | 'OPTIMAL';

export interface TaxEngineVarianceDetails {
  purchase_register_val: number;
  gstr_2b_val: number;
  tax_discrepancy: number;
}

export interface TaxEngineAnomaly {
  anomaly_id: string;
  invoice_number: string;
  supplier_gstin: string;
  rule_triggered: TaxEngineRuleId;
  severity: TaxEngineSeverity;
  confidence_delta: number;
  variance_details: TaxEngineVarianceDetails;
  xai_explanation: string;
  actionable_resolution: string;
}

export interface TaxEngineOutput {
  reconciliation_summary: {
    total_invoices_analyzed: number;
    matched_count: number;
    anomaly_count: number;
    total_itc_at_risk: number;
    model_confidence_score: string;
  };
  anomalies: TaxEngineAnomaly[];
  compliance_health_index: {
    score: number;
    verdict: ComplianceVerdict;
    mathematical_justification: string;
  };
}

export interface TaxEngineInputPackets {
  COMPANY_GSTR1_PURCHASE_DATA: Record<string, unknown> | null;
  GOVERNMENT_GSTR2B_DATA: Record<string, unknown> | null;
  PRE_MATCHED_DISCREPANCIES: Record<string, unknown>;
}
