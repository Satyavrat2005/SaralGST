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
  voucher_type: string;
  place_of_supply: string;
  invoice_type: string;
  hsn_or_sac: string;
  hsn_sac_code?: string;
  description: string;
  quantity: string;
  unit: string;
  uqc?: string;
  rate: number;
  local_sales_taxable_18?: number | null;
  local_sales_taxable_12?: number | null;
  oms_sales_taxable_12?: number | null;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total_invoice_value: number;
  cgst_amount?: number | null;
  sgst_amount?: number | null;
  igst_amount?: number | null;
  tcs_cess?: number | null;
  round_off?: number | null;
  gross_total?: number | null;
  is_reverse_charge: boolean;
  reverse_charge?: boolean;
  eway_bill_number?: string | null;
  irn?: string | null;
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
      const parsed = parseSalesInvoiceFromText(ocrText);
      return {
        data: parsed,
        error: null,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
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

export function parseSalesInvoiceFromText(ocrText: string): SalesInvoiceData {
  const normalized = ocrText
    .replace(/\r/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);
  const joined = lines.join(' \n ');

  const invoiceNumber = firstMatch(joined, [
    /invoice\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/-]{2,})/i,
    /tax\s*invoice\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/-]{2,})/i,
    /bill\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/-]{2,})/i,
  ]) || null;

  const invoiceDateRaw = firstMatch(joined, [
    /invoice\s*date\s*[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
    /date\s*[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
  ]) || null;

  const customerGstin = firstMatch(joined, [
    /(?:buyer|customer|bill\s*to|sold\s*to|ship\s*to).*?(\d{2}[A-Z0-9]{13})/i,
    /gstin\s*[:\-]?\s*(\d{2}[A-Z0-9]{13})/i,
  ]) || null;

  const customerName = firstMatch(joined, [
    /(?:buyer|customer|bill\s*to|sold\s*to)\s*[:\-]?\s*([A-Za-z0-9&().,'\/\- ]{3,})/i,
    /name\s*[:\-]?\s*([A-Za-z0-9&().,'\/\- ]{3,})/i,
  ]) || null;

  const placeOfSupply = firstMatch(joined, [
    /place\s*of\s*supply\s*[:\-]?\s*([0-9]{2}\s*[-:]\s*[A-Za-z ]+)/i,
    /place\s*of\s*supply\s*[:\-]?\s*([A-Za-z ]+)/i,
  ]) || null;

  const hsnSacCode = firstMatch(joined, [
    /hsn\/?sac\s*(?:code)?\s*[:\-]?\s*([0-9A-Z]{4,8})/i,
    /sac\s*(?:code)?\s*[:\-]?\s*([0-9A-Z]{4,8})/i,
  ]) || null;

  const taxableValue = parseMoney(firstMatch(joined, [
    /taxable\s*value\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /taxable\s*amount\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ]));

  const localSales18 = parseMoney(firstMatch(joined, [
    /local\s*sales\s*@?\s*18%\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ]));
  const localSales12 = parseMoney(firstMatch(joined, [
    /local\s*sales\s*@?\s*12%\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ]));
  const omsSales12 = parseMoney(firstMatch(joined, [
    /(?:oms|inter[- ]?state)\s*@?\s*12%\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ]));

  const cgstAmount = parseMoney(firstMatch(joined, [/cgst\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i]));
  const sgstAmount = parseMoney(firstMatch(joined, [/sgst\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i]));
  const igstAmount = parseMoney(firstMatch(joined, [/igst\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i]));
  const cessAmount = parseMoney(firstMatch(joined, [/(?:tcs|cess)\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i]));
  const roundOff = parseMoney(firstMatch(joined, [/round\s*off\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i]));
  const grossTotal = parseMoney(firstMatch(joined, [
    /(?:gross\s*total|invoice\s*total|total\s*invoice\s*value|grand\s*total)\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ]));

  const quantity = parseNumber(firstMatch(joined, [
    /quantity\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i,
  ]));
  const rate = parseMoney(firstMatch(joined, [/rate\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i]));

  const ewayBillNumber = firstMatch(joined, [/e-?way\s*bill\s*(?:no\.?|number)?\s*[:\-]?\s*([0-9]{8,20})/i]) || null;
  const irn = firstMatch(joined, [/\birn\b\s*[:\-]?\s*([A-Z0-9]{30,80})/i]) || null;
  const reverseCharge = /reverse\s*charge/i.test(joined);

  const invoiceType = customerGstin ? 'B2B' : inferB2CType(grossTotal ?? taxableValue ?? 0);

  const result: SalesInvoiceData = {
    seller_name: extractSellerName(lines) || 'Unknown',
    seller_gstin: extractSellerGstin(lines) || 'Unknown',
    customer_name: customerName || 'Unknown',
    customer_gstin: customerGstin || 'Unknown',
    invoice_number: invoiceNumber || 'Unknown',
    invoice_date: invoiceDateRaw ? normalizeDate(invoiceDateRaw) : '1970-01-01',
    voucher_type: /credit\s*note/i.test(joined)
      ? 'Credit Note'
      : /debit\s*note/i.test(joined)
      ? 'Debit Note'
      : 'Sales',
    place_of_supply: placeOfSupply || 'Unknown',
    invoice_type: invoiceType,
    hsn_or_sac: hsnSacCode || 'Unknown',
    hsn_sac_code: hsnSacCode || 'Unknown',
    description: extractDescription(lines) || 'Unknown',
    quantity: (quantity ?? 0) > 0 ? String(quantity) : '1',
    unit: extractUnit(lines) || 'NOS',
    uqc: extractUnit(lines) || 'NOS',
    rate: rate || 0,
    local_sales_taxable_18: localSales18,
    local_sales_taxable_12: localSales12,
    oms_sales_taxable_12: omsSales12,
    taxable_value: taxableValue || 0,
    cgst: cgstAmount || 0,
    sgst: sgstAmount || 0,
    igst: igstAmount || 0,
    cess: cessAmount || 0,
    total_invoice_value: grossTotal || (taxableValue || 0) + (cgstAmount || 0) + (sgstAmount || 0) + (igstAmount || 0) + (cessAmount || 0),
    cgst_amount: cgstAmount || 0,
    sgst_amount: sgstAmount || 0,
    igst_amount: igstAmount || 0,
    tcs_cess: cessAmount || 0,
    round_off: roundOff || 0,
    gross_total: grossTotal || (taxableValue || 0) + (cgstAmount || 0) + (sgstAmount || 0) + (igstAmount || 0) + (cessAmount || 0),
    is_reverse_charge: reverseCharge,
    reverse_charge: reverseCharge,
    eway_bill_number: ewayBillNumber,
    irn,
    confidence: {
      seller_gstin: extractSellerGstin(lines) ? 0.8 : 0.3,
      customer_gstin: customerGstin ? 0.8 : 0.2,
      invoice_number: invoiceNumber ? 0.9 : 0.3,
      tax_values: taxableValue || cgstAmount || sgstAmount || igstAmount ? 0.7 : 0.2,
    },
  };

  return result;
}

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function parseMoney(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.replace(/,/g, '').replace(/[^0-9.\-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDate(value: string): string {
  const cleaned = value.replace(/[.]/g, '/').trim();
  const parts = cleaned.split('/').map((part) => part.trim());
  if (parts.length === 3) {
    const [first, second, third] = parts;
    const day = first.padStart(2, '0');
    const month = second.padStart(2, '0');
    const year = third.length === 2 ? `20${third}` : third;
    return `${year}-${month}-${day}`;
  }
  return cleaned;
}

function inferB2CType(amount: number): string {
  return amount >= 250000 ? 'B2C Large' : 'B2C Small';
}

function extractSellerName(lines: string[]): string | null {
  return lines[0] || null;
}

function extractSellerGstin(lines: string[]): string | null {
  for (const line of lines.slice(0, 20)) {
    const match = line.match(/\b(\d{2}[A-Z0-9]{13})\b/i);
    if (match?.[1]) return match[1].toUpperCase();
  }
  return null;
}

function extractDescription(lines: string[]): string | null {
  const candidate = lines.find((line) => /description|goods|services|item/i.test(line));
  return candidate || lines[lines.length - 1] || null;
}

function extractUnit(lines: string[]): string | null {
  const candidate = lines.find((line) => /\b(NOS|PCS|KGS|MTR|LTR|BOX|BAG|DZN|GMS)\b/i.test(line));
  const match = candidate?.match(/\b(NOS|PCS|KGS|MTR|LTR|BOX|BAG|DZN|GMS)\b/i);
  return match?.[1]?.toUpperCase() || null;
}
