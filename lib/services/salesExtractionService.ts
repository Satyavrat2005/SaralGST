/**
 * Sales Invoice Extraction Service using Gemini API
 * For invoices where WE are the SELLER (supplier)
 */

export interface SalesInvoiceData {
  seller_name: string;           // Our company name
  seller_gstin: string;           // Our GSTIN
  customer_name: string;          // Buyer/customer name
  customer_gstin: string;         // Buyer/customer GSTIN
  invoice_number: string;
  invoice_date: string;
  place_of_supply: string;
  invoice_type: string;
  hsn_or_sac: string;
  description: string;
  quantity: string;
  unit: string;
  rate: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total_invoice_value: number;
  is_reverse_charge: boolean;
  confidence: {
    seller_gstin: number;
    customer_gstin: number;
    invoice_number: number;
    tax_values: number;
  };
}

/**
 * Validate extracted sales invoice data structure
 */
function isValidSalesInvoiceData(data: any): data is SalesInvoiceData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.seller_name === 'string' &&
    typeof data.seller_gstin === 'string' &&
    typeof data.customer_name === 'string' &&
    typeof data.invoice_number === 'string' &&
    typeof data.confidence === 'object'
  );
}

/**
 * Extract structured sales invoice data from OCR text using Gemini LLM
 * For invoices where WE are the SELLER
 */
export async function extractSalesInvoiceData(ocrText: string): Promise<{
  data: SalesInvoiceData | null;
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

    const prompt = `You are analyzing a SALES invoice where we are the SELLER/SUPPLIER.

Extract data from this sales invoice OCR text and return structured JSON.

OCR Text:
${ocrText}

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "seller_name": "",
  "seller_gstin": "",
  "customer_name": "",
  "customer_gstin": "",
  "invoice_number": "",
  "invoice_date": "",
  "place_of_supply": "",
  "invoice_type": "B2B",
  "hsn_or_sac": "",
  "description": "",
  "quantity": "",
  "unit": "",
  "rate": 0,
  "taxable_value": 0,
  "cgst": 0,
  "sgst": 0,
  "igst": 0,
  "cess": 0,
  "total_invoice_value": 0,
  "is_reverse_charge": false,
  "confidence": {
    "seller_gstin": 0,
    "customer_gstin": 0,
    "invoice_number": 0,
    "tax_values": 0
  }
}

CRITICAL INSTRUCTIONS:
1. seller_name = The company/person ISSUING/SELLING (from the top of invoice)
2. seller_gstin = GSTIN of the seller (our company)
3. customer_name = The company/person BUYING (marked as "Buyer", "Bill To", "Customer")
4. customer_gstin = GSTIN of the buyer/customer
5. GSTIN format: 22AAAAA0000A1Z5 (15 characters)
6. Date format: YYYY-MM-DD
7. Invoice type: B2B, B2C, Export, SEZ
8. All amounts as numbers (not strings)
9. Confidence scores between 0-1 (1 = very confident, 0 = not found)
10. If a field is not found, use empty string for text, 0 for numbers, false for booleans
11. All string values must be on a single line - replace any line breaks with spaces
12. place_of_supply should be state name or code`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
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
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
            response_mime_type: 'application/json',
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
      
      // Robust JSON cleaning function
      let cleanedText = text.trim();
      
      // Remove markdown code blocks
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Fix line breaks inside string values - run multiple times
      for (let i = 0; i < 5; i++) {
        const before = cleanedText;
        cleanedText = cleanedText.replace(/"([^"]*?)\n([^"]*?)"/g, '"$1 $2"');
        if (before === cleanedText) break;
      }
      
      try {
        const extractedData: SalesInvoiceData = JSON.parse(cleanedText);
        
        // Validate the structure
        if (!isValidSalesInvoiceData(extractedData)) {
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
        console.error('Error parsing sales invoice LLM response:', parseError);
        console.error('Raw response:', cleanedText.substring(0, 500));
        return {
          data: null,
          error: `Failed to parse LLM response: ${parseError.message}`,
        };
      }
    }

    return {
      data: null,
      error: 'No valid response from Gemini API',
    };
  } catch (error: any) {
    console.error('Error in sales invoice extraction:', error);
    return {
      data: null,
      error: error.message,
    };
  }
}
