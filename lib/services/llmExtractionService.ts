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
7. place_of_supply should be state name (e.g., "Maharashtra", "Delhi")`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
            temperature: 0.1, // Low temperature for more deterministic output
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content?.parts?.[0]?.text || '';
      
      // Clean up the response (remove markdown code blocks if present)
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
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
6. If field not found, use empty string for text, 0 for numbers, false for booleans`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content?.parts?.[0]?.text || '';
      
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
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
