import type { DiscrepancyCategory, DiscrepancyType } from './insightTypes';
import type { TaxEngineRuleId, TaxEngineSeverity } from './taxEngineTypes';
import type { InsightSeverity } from './insightTypes';

export function ruleIdForDiscrepancyType(type: DiscrepancyType): TaxEngineRuleId {
  switch (type) {
    case 'missing_in_books':
      return 'Rule_03_Unrecorded_Supplier_Invoice';
    case 'missing_in_gstr2b':
      return 'Rule_02_Missing_Supplier_Upload';
    case 'value_mismatch':
      return 'Rule_01_Value_Mismatch';
    case 'matched':
      return 'Rule_01_Value_Mismatch';
    default:
      return 'Rule_01_Value_Mismatch';
  }
}

export function ruleIdForCategory(category: DiscrepancyCategory): TaxEngineRuleId {
  switch (category) {
    case 'in_gstr2b_not_in_books':
      return 'Rule_03_Unrecorded_Supplier_Invoice';
    case 'supplier_not_filed':
    case 'timing_cutoff':
    case 'data_entry_gap':
      return 'Rule_02_Missing_Supplier_Upload';
    case 'gstin_or_document_mismatch':
      return 'Rule_04_GSTIN_Mismatch';
    case 'amount_mismatch':
    case 'rounding_variance':
      return 'Rule_01_Value_Mismatch';
    default:
      return 'Rule_01_Value_Mismatch';
  }
}

export function toTaxEngineSeverity(severity: InsightSeverity): TaxEngineSeverity {
  return severity === 'high' ? 'HIGH' : severity === 'medium' ? 'MEDIUM' : 'LOW';
}

export function fromTaxEngineSeverity(severity: TaxEngineSeverity): InsightSeverity {
  return severity === 'HIGH' ? 'high' : severity === 'MEDIUM' ? 'medium' : 'low';
}

/** User-facing rule label (no engine branding). */
export function ruleDisplayLabel(rule: TaxEngineRuleId): string {
  switch (rule) {
    case 'Rule_01_Value_Mismatch':
      return 'Value mismatch';
    case 'Rule_02_Missing_Supplier_Upload':
      return 'Missing supplier upload';
    case 'Rule_03_Unrecorded_Supplier_Invoice':
      return 'Unrecorded supplier invoice';
    case 'Rule_04_GSTIN_Mismatch':
      return 'GSTIN mismatch';
    default:
      return 'Compliance rule';
  }
}
