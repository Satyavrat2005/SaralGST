/**
 * Groq-based Sales Invoice Extraction Service
 *
 * Uses Groq's free tier LLM API — much more generous than Gemini free tier:
 *   • llama-3.3-70b-versatile  → 6,000 req/day  (text from PDF)
 *   • meta-llama/llama-4-scout-17b-16e-instruct → 500 req/day (vision for images)
 *
 * Sign up free at https://console.groq.com → API Keys → Create Key
 * Add GROQ_API_KEY=gsk_... to .env.local
 */

import type { GeminiSalesData } from './geminiSalesExtractionService';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEXT_MODEL   = 'llama-3.3-70b-versatile';                         // 6000 req/day free
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';       // 500 req/day free, supports images

const SYSTEM_PROMPT = `You are a GST compliance expert for Indian tax invoices. 
Extract structured data and return ONLY valid JSON — no markdown, no explanation.
If a field is absent, return null (never "N/A", never empty string, never 0 for amounts).
All monetary amounts must be plain numbers without currency symbols or commas.
Date format: YYYY-MM-DD. GSTIN is exactly 15 alphanumeric characters.`;

const JSON_SCHEMA = `{
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

const USER_PROMPT_TEXT = (text: string) => `
Extract all invoice fields from this Indian GST sales invoice text.

RULES:
1. invoice_type: "B2B" if buyer has GSTIN, "B2C Small" if no GSTIN + value < 2.5L, "B2C Large" if no GSTIN + value >= 2.5L
2. voucher_type: one of "Sales", "Credit Note", "Debit Note"
3. place_of_supply: "XX-StateName" format e.g. "27-Maharashtra"
4. IRN is a 64-char alphanumeric hash (not the invoice number)
5. For numbers: extract exact values visible in the document

Invoice text:
\`\`\`
${text}
\`\`\`

Return ONLY this JSON (fill in the values, keep null for missing fields):
${JSON_SCHEMA}`;

const USER_PROMPT_IMAGE = `
Extract all invoice fields from this Indian GST sales invoice image.

RULES:
1. invoice_type: "B2B" if buyer has GSTIN, "B2C Small" if no GSTIN + value < 2.5L, "B2C Large" if no GSTIN + value >= 2.5L  
2. voucher_type: one of "Sales", "Credit Note", "Debit Note"
3. place_of_supply: "XX-StateName" format e.g. "27-Maharashtra"
4. IRN is a 64-char alphanumeric hash (not the invoice number)
5. For numbers: extract exact values visible in the document

Return ONLY this JSON (fill in the values, keep null for missing fields):
${JSON_SCHEMA}`;

/* ─── Exported functions ───────────────────────────────────────────────────── */

/**
 * Extract invoice data from raw OCR/PDF text using Groq text model.
 * Use this for PDFs (after text extraction).
 */
export async function extractSalesInvoiceWithGroqText(
  pdfText: string
): Promise<{ data: GeminiSalesData | null; error: string | null }> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return { data: null, error: 'GROQ_API_KEY not set' };

  return callGroq(TEXT_MODEL, [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: USER_PROMPT_TEXT(pdfText.substring(0, 12000)) },
  ], apiKey);
}

/**
 * Extract invoice data from an image (JPG/PNG) using Groq vision model.
 * Use this for scanned invoice images.
 */
export async function extractSalesInvoiceWithGroqVision(
  imageBuffer: Buffer,
  mimeType: string
): Promise<{ data: GeminiSalesData | null; error: string | null }> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return { data: null, error: 'GROQ_API_KEY not set' };

  const supported = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const mime = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
  if (!supported.includes(mime)) {
    return { data: null, error: `Groq vision does not support ${mimeType}` };
  }

  const base64 = imageBuffer.toString('base64');
  return callGroq(VISION_MODEL, [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: USER_PROMPT_IMAGE },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
      ],
    },
  ], apiKey);
}

/* ─── Internal ─────────────────────────────────────────────────────────────── */

async function callGroq(
  model: string,
  messages: object[],
  apiKey: string
): Promise<{ data: GeminiSalesData | null; error: string | null }> {
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Groq API error ${res.status}: ${body.substring(0, 300)}`);
    }

    const json = await res.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? '';
    if (!raw) return { data: null, error: 'Groq returned empty response' };

    // Strip markdown fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned) as GeminiSalesData;
    return { data: sanitize(parsed), error: null };
  } catch (err: any) {
    console.error('[GroqExtraction] Error:', err.message);
    return { data: null, error: err.message };
  }
}

function sanitize(d: GeminiSalesData): GeminiSalesData {
  const EMPTIES = new Set(['', 'n/a', 'na', 'null', 'none', 'not found', 'not available', '-', 'unknown']);
  const str = (v: string | null): string | null => {
    if (v === null || v === undefined) return null;
    const t = String(v).trim();
    return EMPTIES.has(t.toLowerCase()) ? null : t;
  };
  const num = (v: number | null): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };
  return {
    invoice_date:            str(d.invoice_date),
    voucher_type:            str(d.voucher_type),
    invoice_number:          str(d.invoice_number),
    invoice_type:            str(d.invoice_type),
    customer_name:           str(d.customer_name),
    customer_gstin:          str(d.customer_gstin),
    place_of_supply:         str(d.place_of_supply),
    hsn_sac_code:            str(d.hsn_sac_code),
    quantity:                num(d.quantity),
    uqc:                     str(d.uqc),
    rate:                    num(d.rate),
    local_sales_taxable_18:  num(d.local_sales_taxable_18),
    local_sales_taxable_12:  num(d.local_sales_taxable_12),
    oms_sales_taxable_12:    num(d.oms_sales_taxable_12),
    taxable_value:           num(d.taxable_value),
    cgst_amount:             num(d.cgst_amount),
    sgst_amount:             num(d.sgst_amount),
    igst_amount:             num(d.igst_amount),
    tcs_cess:                num(d.tcs_cess),
    round_off:               num(d.round_off),
    gross_total:             num(d.gross_total),
    reverse_charge:          typeof d.reverse_charge === 'boolean' ? d.reverse_charge : null,
    eway_bill_number:        str(d.eway_bill_number),
    irn:                     str(d.irn),
  };
}
