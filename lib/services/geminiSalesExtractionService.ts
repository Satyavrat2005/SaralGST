/**
 * Gemini-based Sales Invoice Extraction Service
 *
 * Sends the PDF/image file directly to Gemini — no OCR step required.
 * Gemini reads the document natively and returns structured JSON.
 *
 * CRITICAL: Missing fields are returned as null (never empty string or 0).
 */

export interface GeminiSalesData {
  // 1. Basic Invoice Information
  invoice_date: string | null;          // YYYY-MM-DD
  voucher_type: string | null;          // Sales | Credit Note | Debit Note
  invoice_number: string | null;
  invoice_type: string | null;          // B2B | B2C Small | B2C Large | Export

  // 2. Customer Details
  customer_name: string | null;
  customer_gstin: string | null;        // 15-char GSTIN
  place_of_supply: string | null;       // e.g. "27-Maharashtra"

  // 3. Product & Pricing
  hsn_sac_code: string | null;
  quantity: number | null;
  uqc: string | null;                   // KGS | MTR | PCS | NOS | LTR | BAG | BOX
  rate: number | null;

  // 4. Financial & Tax Breakdown
  local_sales_taxable_18: number | null;  // Taxable value for LOCAL SALES @ 18%
  local_sales_taxable_12: number | null;  // Taxable value for LOCAL SALES @ 12%
  oms_sales_taxable_12: number | null;    // Taxable value for OMS/Inter-state @ 12%
  taxable_value: number | null;           // Total taxable value
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  tcs_cess: number | null;
  round_off: number | null;
  gross_total: number | null;             // Final invoice value

  // 5. Advanced Compliance
  reverse_charge: boolean | null;
  eway_bill_number: string | null;
  irn: string | null;                     // 64-char Invoice Reference Number
}

const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Models tried in order. Each Gemini model has its own separate free-tier
 * quota, so when the primary model is rate-limited (HTTP 429) we transparently
 * fall back to the next one instead of failing the whole extraction.
 * Can be overridden with GEMINI_SALES_MODELS (comma-separated) in env.
 */
const DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

function getModelCandidates(): string[] {
  const override = process.env.GEMINI_SALES_MODELS;
  if (override) {
    const list = override
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return DEFAULT_MODELS;
}

function readGeminiApiKey(): string | null {
  const rawValue = 
    process.env.GEMINI_API_KEY ??
    process.env.API_KEY ??
    null;

  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  const unquoted =
    trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  return unquoted || null;
}

const EXTRACTION_PROMPT = `You are a GST compliance expert analyzing an Indian sales invoice.

Extract the following fields from this invoice document.

CRITICAL RULES:
1. If a field is NOT clearly visible or present in the document, return null — NOT empty string, NOT 0, NOT "N/A".
2. Do NOT guess or invent any value. Only return what you can actually read.
3. All monetary amounts must be plain numbers (no "Rs.", no commas, no currency symbols).
4. Date format must be YYYY-MM-DD.
5. GSTIN must be exactly 15 alphanumeric characters (e.g., 27AABCU9603R1ZX).
6. Place of supply format: "XX-StateName" (e.g., "27-Maharashtra", "24-Gujarat").
7. UQC must be an official GST unit code: KGS, MTR, PCS, NOS, LTR, BAG, BOX, DZN, GMS, etc.
8. invoice_type: Use "B2B" if buyer has a GSTIN. Use "B2C Small" if no GSTIN and value < 2,50,000. Use "B2C Large" if no GSTIN and value >= 2,50,000. Use "Export" for export invoices.
9. voucher_type: Must be exactly one of "Sales", "Credit Note", or "Debit Note".
10. For tax slab breakdown, look for sections labeled "LOCAL SALES @ 18%", "LOCAL SALES @ 12%", "OMS @ 12%", or similar. These are the taxable amounts before tax.
11. IRN is a 64-character alphanumeric hash (e-invoice reference). It is different from invoice number.
12. E-Way Bill number is typically 12 digits.

Return ONLY valid JSON in this exact structure (no markdown, no explanation):

{
  "invoice_date": null,
  "voucher_type": null,
  "invoice_number": null,
  "invoice_type": null,
  "customer_name": null,
  "customer_gstin": null,
  "place_of_supply": null,
  "hsn_sac_code": null,
  "quantity": null,
  "uqc": null,
  "rate": null,
  "local_sales_taxable_18": null,
  "local_sales_taxable_12": null,
  "oms_sales_taxable_12": null,
  "taxable_value": null,
  "cgst_amount": null,
  "sgst_amount": null,
  "igst_amount": null,
  "tcs_cess": null,
  "round_off": null,
  "gross_total": null,
  "reverse_charge": null,
  "eway_bill_number": null,
  "irn": null
}`;

/**
 * Extract structured sales invoice data directly from a PDF or image using Gemini.
 */
export async function extractSalesInvoiceWithGemini(
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ data: GeminiSalesData | null; error: string | null }> {
  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    return {
      data: null,
      error: 'Gemini API key is not configured. Set GEMINI_API_KEY, GOOGLE_API_KEY, or API_KEY.',
    };
  }

  const base64Data = fileBuffer.toString('base64');

  // Normalise MIME type — Gemini supports application/pdf, image/jpeg, image/png
  const supportedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const normalizedMime = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
  if (!supportedTypes.includes(normalizedMime)) {
    return { data: null, error: `Unsupported file type: ${mimeType}` };
  }

  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: normalizedMime,
              data: base64Data,
            },
          },
          { text: EXTRACTION_PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      // Raised from 2048: the 2.5 models reserve part of the output budget for
      // internal "thinking" tokens, which previously starved the JSON output
      // and produced an empty/truncated response.
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      // Disable thinking so the whole output budget goes to the JSON answer
      // (and to make extraction faster/cheaper). Ignored by non-thinking models.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const models = getModelCandidates();
  let lastError = 'Unknown error';
  let rateLimited = false;

  for (const model of models) {
    try {
      const requestUrl = new URL(`${GEMINI_API_BASE}/${model}:generateContent`);
      requestUrl.searchParams.set('key', apiKey);

      const response = await fetch(requestUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `Gemini API error ${response.status} (${model}): ${errorText}`;
        // 429 = quota/rate limit, 503 = overloaded → try the next model.
        if (response.status === 429 || response.status === 503) {
          rateLimited = rateLimited || response.status === 429;
          console.warn(`[GeminiSalesExtraction] ${model} unavailable (${response.status}), trying fallback model...`);
          continue;
        }
        // Any other status is a hard error (bad key, bad request) — stop.
        console.error('[GeminiSalesExtraction] Error:', lastError);
        return { data: null, error: lastError };
      }

      const result = await response.json();
      const candidate = result?.candidates?.[0];
      const rawText: string | undefined =
        candidate?.content?.parts?.find((p: any) => typeof p?.text === 'string')?.text;

      if (!rawText) {
        // Truncated/blocked response — try the next model rather than saving blanks.
        lastError = `Empty response from Gemini (${model}, finishReason: ${candidate?.finishReason ?? 'unknown'})`;
        console.warn(`[GeminiSalesExtraction] ${lastError}, trying fallback model...`);
        continue;
      }

      // Strip markdown code fences if present
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const extracted: GeminiSalesData = JSON.parse(cleaned);

      // Sanitise: convert empty strings to null, remove stray "N/A" strings
      const sanitized = sanitizeExtractedData(extracted);

      return { data: sanitized, error: null };
    } catch (err: any) {
      lastError = `${err.message} (${model})`;
      console.warn(`[GeminiSalesExtraction] ${lastError}, trying fallback model...`);
      continue;
    }
  }

  console.error('[GeminiSalesExtraction] All models failed:', lastError);
  return {
    data: null,
    error: rateLimited
      ? 'Gemini extraction is rate-limited — the API quota is exhausted. Please wait a few minutes and try again, or upgrade the Gemini API plan.'
      : lastError,
  };
}

/**
 * Ensure missing/placeholder values become null rather than empty strings.
 */
function sanitizeExtractedData(data: GeminiSalesData): GeminiSalesData {
  const EMPTY_STRINGS = ['', 'n/a', 'na', 'null', 'none', 'not found', 'not available', '-'];

  const sanitizeString = (v: string | null): string | null => {
    if (v === null || v === undefined) return null;
    const trimmed = String(v).trim();
    return EMPTY_STRINGS.includes(trimmed.toLowerCase()) ? null : trimmed;
  };

  const sanitizeNumber = (v: number | null): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  return {
    invoice_date: sanitizeString(data.invoice_date),
    voucher_type: sanitizeString(data.voucher_type),
    invoice_number: sanitizeString(data.invoice_number),
    invoice_type: sanitizeString(data.invoice_type),
    customer_name: sanitizeString(data.customer_name),
    customer_gstin: sanitizeString(data.customer_gstin),
    place_of_supply: sanitizeString(data.place_of_supply),
    hsn_sac_code: sanitizeString(data.hsn_sac_code),
    quantity: sanitizeNumber(data.quantity),
    uqc: sanitizeString(data.uqc),
    rate: sanitizeNumber(data.rate),
    local_sales_taxable_18: sanitizeNumber(data.local_sales_taxable_18),
    local_sales_taxable_12: sanitizeNumber(data.local_sales_taxable_12),
    oms_sales_taxable_12: sanitizeNumber(data.oms_sales_taxable_12),
    taxable_value: sanitizeNumber(data.taxable_value),
    cgst_amount: sanitizeNumber(data.cgst_amount),
    sgst_amount: sanitizeNumber(data.sgst_amount),
    igst_amount: sanitizeNumber(data.igst_amount),
    tcs_cess: sanitizeNumber(data.tcs_cess),
    round_off: sanitizeNumber(data.round_off),
    gross_total: sanitizeNumber(data.gross_total),
    reverse_charge: typeof data.reverse_charge === 'boolean' ? data.reverse_charge : null,
    eway_bill_number: sanitizeString(data.eway_bill_number),
    irn: sanitizeString(data.irn),
  };
}
