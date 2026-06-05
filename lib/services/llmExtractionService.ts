/**
 * LLM Extraction Service using Gemini API
 * Converts OCR text to structured GST invoice data
 */

export interface ExtractedInvoiceData {
  supplier_name: string;
  supplier_gstin: string;
  buyer_gstin: string;
  invoice_number: string;
  invoice_date: string;
  place_of_supply: string;
  invoice_type: string;
  hsn_or_sac: string;
  description: string;
  quantity: string;
  unit: string;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total_invoice_value: number;
  is_reverse_charge: boolean;
  is_itc_eligible: boolean;
  confidence: {
    supplier_gstin: number;
    invoice_number: number;
    tax_values: number;
  };
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Models tried in order. Each Gemini model has its OWN free-tier quota, so when
 * the primary model is rate-limited (HTTP 429, quota exhausted) we transparently
 * fall back to the next one instead of failing the whole extraction — which
 * previously made the WhatsApp webhook reply "couldn't read / please resend" to
 * vendors who had actually sent a perfectly valid invoice.
 * Override with GEMINI_EXTRACTION_MODELS (comma-separated) in env.
 */
const DEFAULT_EXTRACTION_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

function getExtractionModels(): string[] {
  const override = process.env.GEMINI_EXTRACTION_MODELS;
  if (override) {
    const list = override.split(',').map((m) => m.trim()).filter(Boolean);
    if (list.length > 0) return list;
  }
  return DEFAULT_EXTRACTION_MODELS;
}

/**
 * POST to Gemini's generateContent with model fallback + retry on transient errors.
 *
 * Strategy:
 *   - Try each candidate model in order.
 *   - 429 (quota/rate limit) → move straight to the next model (a per-day quota
 *     won't recover within a short backoff, so don't waste time retrying it).
 *   - 500/503 (transient overload) → a couple of spaced retries on the SAME model.
 *   - Any other 4xx (bad key/request) → fail fast.
 */
async function geminiGenerateContent(
  body: Record<string, any>,
  apiKey: string
): Promise<any> {
  const models = getExtractionModels();
  const maxAttemptsPerModel = 3;
  let lastErr = 'Gemini request failed';

  for (const model of models) {
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) return response.json();

      const errorData = await response.text();
      lastErr = `Gemini API error (${model}): ${response.status} ${response.statusText} - ${errorData}`;

      // Quota/rate limit → this model is unavailable; try the next model.
      if (response.status === 429) {
        console.warn(`[llmExtraction] ${model} quota/rate-limited (429), trying fallback model...`);
        break;
      }

      // Transient overload → retry the same model with linear backoff (1.5s, 3s).
      if ((response.status === 500 || response.status === 503) && attempt < maxAttemptsPerModel) {
        await new Promise((r) => setTimeout(r, attempt * 1500));
        continue;
      }

      // 500/503 on the final attempt → try the next model instead of giving up.
      if (response.status === 500 || response.status === 503) {
        console.warn(`[llmExtraction] ${model} overloaded (${response.status}), trying fallback model...`);
        break;
      }

      // Any other status (bad key, malformed request) is a hard error — stop.
      throw new Error(lastErr);
    }
  }

  throw new Error(lastErr);
}

/**
 * Extract structured data from OCR text using LLM
 */
export async function extractInvoiceData(ocrText: string): Promise<{
  data: ExtractedInvoiceData | null;
  error: string | null;
}> {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return {
        data: null,
        error: 'Gemini API key not configured',
      };
    }

    const prompt = `Convert the following OCR text of a GST invoice into structured JSON following this schema.
Infer missing labels, normalize vendor-specific wording, and map fields to GST requirements.

OCR Text:
${ocrText}

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "supplier_name": "",
  "supplier_gstin": "",
  "buyer_gstin": "",
  "invoice_number": "",
  "invoice_date": "",
  "place_of_supply": "",
  "invoice_type": "B2B",
  "hsn_or_sac": "",
  "description": "",
  "quantity": "",
  "unit": "",
  "taxable_value": 0,
  "cgst": 0,
  "sgst": 0,
  "igst": 0,
  "cess": 0,
  "total_invoice_value": 0,
  "is_reverse_charge": false,
  "is_itc_eligible": true,
  "confidence": {
    "supplier_gstin": 0,
    "invoice_number": 0,
    "tax_values": 0
  }
}

Important instructions:
1. Extract GSTIN in format: 22AAAAA0000A1Z5 (15 characters)
2. Date format: YYYY-MM-DD
3. Invoice type: B2B, B2C, Import, Export, SEZ, RCM
4. All amounts as numbers (not strings)
5. Confidence scores between 0-1 based on clarity of extracted data
6. If a field is not found, use empty string for text fields, 0 for numbers, false for booleans
7. place_of_supply should be state name (e.g., "Maharashtra", "Delhi")
8. CRITICAL: All string values must be on a single line - replace any line breaks with spaces`;

    const data = await geminiGenerateContent(
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          // Higher cap + thinking disabled so the full JSON fits in the output
          // (gemini-2.5-flash otherwise spends output tokens "thinking" and the
          // JSON gets truncated → "Unterminated string" parse errors).
          maxOutputTokens: 4096,
          response_mime_type: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
      geminiApiKey
    );

    if (data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content?.parts?.[0]?.text || '';

      // Robust JSON cleaning function
      let cleanedText = text.trim();
      
      // Remove markdown code blocks
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Fix line breaks inside string values - more aggressive approach
      // Replace any newline character that appears between quotes with a space
      cleanedText = cleanedText.replace(/"([^"]*?)\n([^"]*?)"/g, (_match: string, p1: string, p2: string) => {
        return `"${p1} ${p2}"`;
      });
      
      // Run it multiple times to catch nested line breaks
      for (let i = 0; i < 5; i++) {
        const before = cleanedText;
        cleanedText = cleanedText.replace(/"([^"]*?)\n([^"]*?)"/g, '"$1 $2"');
        if (before === cleanedText) break;
      }
      
      try {
        const extractedData: ExtractedInvoiceData = JSON.parse(cleanedText);
        
        // Validate the structure
        if (!isValidExtractedData(extractedData)) {
          return {
            data: null,
            error: 'Invalid data structure returned from LLM',
          };
        }
        
        return {
          data: extractedData,
          error: null,
        };
      } catch (parseError: any) {
        console.error('Error parsing LLM response:', parseError);
        console.error('Raw response:', cleanedText);
        return {
          data: null,
          error: `Failed to parse LLM response: ${parseError.message}`,
        };
      }
    }

    return {
      data: null,
      error: 'No valid response from LLM',
    };
  } catch (error: any) {
    console.error('Error in LLM extraction:', error);
    return {
      data: null,
      error: error.message,
    };
  }
}

/**
 * Validate that extracted data has required structure
 */
function isValidExtractedData(data: any): data is ExtractedInvoiceData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'supplier_name' in data &&
    'supplier_gstin' in data &&
    'invoice_number' in data &&
    'invoice_date' in data &&
    'taxable_value' in data &&
    'total_invoice_value' in data &&
    'confidence' in data &&
    typeof data.confidence === 'object'
  );
}

/**
 * Extract data from invoice image/PDF directly using Gemini Vision
 * This is an alternative approach that can work better for complex layouts
 */
export async function extractInvoiceDataFromImage(
  base64Image: string,
  mimeType: string
): Promise<{
  data: ExtractedInvoiceData | null;
  error: string | null;
}> {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return {
        data: null,
        error: 'Gemini API key not configured',
      };
    }

    const prompt = `Analyze this GST invoice image and extract all relevant information into structured JSON.

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "supplier_name": "",
  "supplier_gstin": "",
  "buyer_gstin": "",
  "invoice_number": "",
  "invoice_date": "",
  "place_of_supply": "",
  "invoice_type": "B2B",
  "hsn_or_sac": "",
  "description": "",
  "quantity": "",
  "unit": "",
  "taxable_value": 0,
  "cgst": 0,
  "sgst": 0,
  "igst": 0,
  "cess": 0,
  "total_invoice_value": 0,
  "is_reverse_charge": false,
  "is_itc_eligible": true,
  "confidence": {
    "supplier_gstin": 0,
    "invoice_number": 0,
    "tax_values": 0
  }
}

Instructions:
1. Extract GSTIN in format: 22AAAAA0000A1Z5 (15 characters)
2. Date format: YYYY-MM-DD
3. Invoice type: B2B, B2C, Import, Export, SEZ, RCM
4. All amounts as numbers
5. Confidence scores between 0-1
6. If field not found, use empty string for text, 0 for numbers, false for booleans
7. CRITICAL: All string values must be on a single line - replace any line breaks with spaces`;

    const data = await geminiGenerateContent(
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 4096,
          response_mime_type: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
      geminiApiKey
    );

    if (data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content?.parts?.[0]?.text || '';
      
      // Robust JSON cleaning
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Fix line breaks inside string values
      for (let i = 0; i < 5; i++) {
        const before = cleanedText;
        cleanedText = cleanedText.replace(/"([^"]*?)\n([^"]*?)"/g, '"$1 $2"');
        if (before === cleanedText) break;
      }
      
      try {
        const extractedData: ExtractedInvoiceData = JSON.parse(cleanedText);
        
        if (!isValidExtractedData(extractedData)) {
          return {
            data: null,
            error: 'Invalid data structure returned from LLM',
          };
        }
        
        return {
          data: extractedData,
          error: null,
        };
      } catch (parseError: any) {
        console.error('Error parsing LLM response:', parseError);
        return {
          data: null,
          error: `Failed to parse LLM response: ${parseError.message}`,
        };
      }
    }

    return {
      data: null,
      error: 'No valid response from LLM',
    };
  } catch (error: any) {
    console.error('Error in direct image extraction:', error);
    return {
      data: null,
      error: error.message,
    };
  }
}
