import type {
  DiscrepancyClassification,
  DiscrepancyType,
  InsightAuditMeta,
  InsightNarrative,
  ReconciliationInsightBundle,
} from './insightTypes';
import type { TaxEngineAnomaly, TaxEngineOutput, TaxEngineRuleId } from './taxEngineTypes';
import {
  fromTaxEngineSeverity,
  ruleIdForCategory,
  ruleIdForDiscrepancyType,
  toTaxEngineSeverity,
} from './taxEngineRules';
import type {
  InsightInvoicePayload,
  InsightPurchasePayload,
} from './insightTypes';

const VALID_RULES: TaxEngineRuleId[] = [
  'Rule_01_Value_Mismatch',
  'Rule_02_Missing_Supplier_Upload',
  'Rule_03_Unrecorded_Supplier_Invoice',
  'Rule_04_GSTIN_Mismatch',
];

function pickAnomaly(
  output: TaxEngineOutput,
  invoiceNumber?: string | null
): TaxEngineAnomaly | null {
  if (!output.anomalies?.length) return null;
  if (invoiceNumber) {
    const match = output.anomalies.find(
      (a) =>
        a.invoice_number?.toLowerCase() === invoiceNumber.toLowerCase()
    );
    if (match) return match;
  }
  return output.anomalies[0];
}

function normalizeRule(rule: string, fallback: TaxEngineRuleId): TaxEngineRuleId {
  if (VALID_RULES.includes(rule as TaxEngineRuleId)) {
    return rule as TaxEngineRuleId;
  }
  return fallback;
}

export function buildSyntheticTaxEngineOutput(
  discrepancyType: DiscrepancyType,
  classification: DiscrepancyClassification,
  context: {
    gstr2b?: InsightInvoicePayload | null;
    purchase?: InsightPurchasePayload | null;
    diff?: { taxable?: number; tax?: number };
  }
): TaxEngineOutput {
  const rule =
    classification.ruleTriggered ||
    ruleIdForCategory(classification.category) ||
    ruleIdForDiscrepancyType(discrepancyType);

  const bookVal =
    context.purchase?.taxable_value ??
    context.purchase?.total_invoice_value ??
    0;
  const g2bVal = context.gstr2b?.taxable_value ?? 0;
  const taxDisc =
    context.diff?.tax ??
    Math.abs(
      (context.purchase?.igst_amount || 0) +
        (context.purchase?.cgst_amount || 0) +
        (context.purchase?.sgst_amount || 0) -
        ((context.gstr2b?.igst_amount || 0) +
          (context.gstr2b?.cgst_amount || 0) +
          (context.gstr2b?.sgst_amount || 0))
    );

  const invoiceNumber =
    context.gstr2b?.invoice_number ||
    context.purchase?.invoice_number ||
    'UNKNOWN';
  const gstin =
    context.gstr2b?.supplier_gstin ||
    context.purchase?.supplier_gstin ||
    '';

  const primaryFactor = classification.factors[0]?.evidence || '';
  const xaiExplanation = `Rule execution triggered: ${rule}. ${primaryFactor} Variance detected between local purchase register and remote GSTR-2B feature set.`;

  const healthScore =
    classification.severity === 'high'
      ? 35
      : classification.severity === 'medium'
        ? 62
        : 88;
  const verdict =
    classification.severity === 'high'
      ? 'CRITICAL'
      : classification.severity === 'medium'
        ? 'ATTENTION_REQUIRED'
        : 'OPTIMAL';

  return {
    reconciliation_summary: {
      total_invoices_analyzed: 1,
      matched_count: 0,
      anomaly_count: 1,
      total_itc_at_risk: Math.round(taxDisc * 100) / 100,
      model_confidence_score: `${(88 + classification.factors.length * 2).toFixed(1)}%`,
    },
    anomalies: [
      {
        anomaly_id: `TE-${Date.now().toString(36).slice(-6).toUpperCase()}`,
        invoice_number: String(invoiceNumber),
        supplier_gstin: String(gstin),
        rule_triggered: rule,
        severity: toTaxEngineSeverity(classification.severity),
        confidence_delta: classification.severity === 'high' ? 0.94 : 0.82,
        variance_details: {
          purchase_register_val: bookVal,
          gstr_2b_val: g2bVal,
          tax_discrepancy: taxDisc,
        },
        xai_explanation: xaiExplanation,
        actionable_resolution:
          classification.suggestedActions[0]?.label ||
          'Verify portal data and align books before GSTR-3B filing.',
      },
    ],
    compliance_health_index: {
      score: healthScore,
      verdict: verdict as 'CRITICAL' | 'ATTENTION_REQUIRED' | 'OPTIMAL',
      mathematical_justification: `Single-invoice audit: ${classification.factors.length} contributing factor(s); severity weight ${classification.severity} applied to compliance health index.`,
    },
  };
}

export function mapTaxEngineToInsightBundle(
  output: TaxEngineOutput,
  classification: DiscrepancyClassification,
  discrepancyType: DiscrepancyType,
  invoiceNumber?: string | null,
  source: 'enriched' | 'rules' = 'enriched'
): ReconciliationInsightBundle {
  const anomaly = pickAnomaly(output, invoiceNumber);
  const fallbackRule = ruleIdForDiscrepancyType(discrepancyType);

  if (!anomaly) {
    const narrative: InsightNarrative = {
      summary:
        'No material variance detected against configured audit thresholds for this invoice.',
      impact:
        output.compliance_health_index?.mathematical_justification ||
        'ITC position aligns with portal data within tolerance.',
      actions: classification.suggestedActions
        .sort((a, b) => a.priority - b.priority)
        .map((a) => a.label),
      confidenceNote: `Compliance health score: ${output.compliance_health_index?.score ?? 100}/100.`,
    };
    return {
      classification: {
        ...classification,
        severity: 'low',
        ruleTriggered: fallbackRule,
      },
      narrative,
      audit: {
        ruleTriggered: fallbackRule,
        modelConfidenceScore: output.reconciliation_summary?.model_confidence_score,
        complianceHealthScore: output.compliance_health_index?.score,
        complianceVerdict: output.compliance_health_index?.verdict,
      },
      source,
    };
  }

  const rule = normalizeRule(anomaly.rule_triggered, fallbackRule);
  const severity = fromTaxEngineSeverity(anomaly.severity);

  const extraActions = classification.suggestedActions
    .sort((a, b) => a.priority - b.priority)
    .map((a) => a.label)
    .filter((a) => a !== anomaly.actionable_resolution);

  const narrative: InsightNarrative = {
    summary: anomaly.xai_explanation,
    impact: `${output.compliance_health_index?.mathematical_justification || ''} ITC at risk (tax variance): ₹${Math.abs(anomaly.variance_details?.tax_discrepancy || 0).toLocaleString('en-IN')}.`.trim(),
    actions: [anomaly.actionable_resolution, ...extraActions].filter(Boolean),
    confidenceNote: `Audit confidence: ${(anomaly.confidence_delta * 100).toFixed(0)}%. Portal match score: ${output.reconciliation_summary?.model_confidence_score || '—'}.`,
  };

  const audit: InsightAuditMeta = {
    ruleTriggered: rule,
    anomalyId: anomaly.anomaly_id,
    confidenceDelta: anomaly.confidence_delta,
    modelConfidenceScore: output.reconciliation_summary?.model_confidence_score,
    varianceDetails: anomaly.variance_details,
    complianceHealthScore: output.compliance_health_index?.score,
    complianceVerdict: output.compliance_health_index?.verdict,
  };

  const factors = [...classification.factors];
  if (!factors.some((f) => f.code === 'RULE_EXEC')) {
    factors.unshift({
      code: 'RULE_EXEC',
      label: 'Audit rule triggered',
      evidence: `Rule execution: ${rule.replace(/_/g, ' ')}.`,
    });
  }

  return {
    classification: {
      ...classification,
      severity,
      ruleTriggered: rule,
      factors,
    },
    narrative,
    audit,
    source,
  };
}

export function parseTaxEngineJson(raw: string): TaxEngineOutput | null {
  try {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(cleaned) as TaxEngineOutput;
  } catch {
    return null;
  }
}
