import { buildTaxEngineInputPackets } from '@/lib/reconciliation/buildTaxEnginePayload';
import {
  buildSyntheticTaxEngineOutput,
  mapTaxEngineToInsightBundle,
  parseTaxEngineJson,
} from '@/lib/reconciliation/mapTaxEngineToInsight';
import { buildTaxEngineSystemPrompt } from '@/lib/reconciliation/taxEnginePrompt';
import type {
  DiscrepancyClassification,
  DiscrepancyType,
  InsightInvoicePayload,
  InsightPurchasePayload,
  ReconciliationInsightBundle,
} from '@/lib/reconciliation/insightTypes';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function readGeminiApiKey(): string | null {
  const rawValue =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.API_KEY ?? null;
  if (!rawValue) return null;
  const trimmed = rawValue.trim();
  const unquoted =
    trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  return unquoted || null;
}

export async function generateReconciliationInsight(
  discrepancyType: DiscrepancyType,
  classification: DiscrepancyClassification,
  context: {
    period?: string;
    gstr2b?: InsightInvoicePayload | null;
    purchase?: InsightPurchasePayload | null;
    diff?: { taxable?: number; tax?: number };
  }
): Promise<ReconciliationInsightBundle> {
  const invoiceNumber =
    context.gstr2b?.invoice_number || context.purchase?.invoice_number || null;

  const synthetic = buildSyntheticTaxEngineOutput(discrepancyType, classification, context);
  const ruleFallback = mapTaxEngineToInsightBundle(
    synthetic,
    classification,
    discrepancyType,
    invoiceNumber,
    'rules'
  );

  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    return ruleFallback;
  }

  const packets = buildTaxEngineInputPackets(discrepancyType, classification, context);
  const prompt = buildTaxEngineSystemPrompt(packets);

  try {
    const requestUrl = new URL(GEMINI_API_URL);
    requestUrl.searchParams.set('key', apiKey);

    const response = await fetch(requestUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          response_mime_type: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      console.error('[ReconciliationInsight] API error', response.status);
      return ruleFallback;
    }

    const result = await response.json();
    const rawText: string | undefined = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return ruleFallback;
    }

    const parsed = parseTaxEngineJson(rawText);
    if (!parsed) {
      return ruleFallback;
    }

    const bundle = mapTaxEngineToInsightBundle(
      parsed,
      classification,
      discrepancyType,
      invoiceNumber,
      'enriched'
    );

    if (!bundle.narrative.summary) {
      return ruleFallback;
    }

    return bundle;
  } catch (err) {
    console.error('[ReconciliationInsight] Error:', err);
    return ruleFallback;
  }
}
