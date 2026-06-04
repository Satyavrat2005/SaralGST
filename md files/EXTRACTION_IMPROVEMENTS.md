# Invoice Extraction Pipeline - Improvements & Recommendations

## Current Approach Analysis

### Current Flow
```
Upload → Try Gemini Vision (direct) → Fallback: Google Vision OCR → LLM Extraction → Store → Validate → Add Remarks
```

**Pros:**
- ✅ Gemini Vision can see images directly (good for complex layouts)
- ✅ Fallback mechanism ensures resilience
- ✅ LLM extraction provides structured data

**Cons:**
- ❌ Validation happens AFTER database storage
- ❌ Google Vision API costs money + requires billing
- ❌ Remarks are added in separate operation
- ❌ No intermediate validation step

## Recommended Improvements

### Option 1: Tesseract + Gemini (Free + Accurate)
```
Upload → Tesseract OCR → Pass Text + Image to Gemini → Validate → Store with Remarks
```

**Advantages:**
- ✅ Tesseract is free and local (no API costs)
- ✅ Gemini sees both text AND image (fills gaps better)
- ✅ Validation before storage (cleaner database)
- ✅ Single operation stores invoice + remarks

**Implementation:**
1. Install Tesseract: `npm install tesseract.js`
2. Extract text with Tesseract
3. Send text + base64 image to Gemini with prompt:
   ```
   "Here's OCR text from an invoice. Also see the image for context.
   Extract GST fields. If OCR text is unclear, read from image."
   ```
4. Run validation on extracted data
5. Store invoice + all remarks in one transaction

### Option 2: Two-Stage Gemini (Current but Better)
```
Upload → Gemini Vision → Validate Immediately → Store with Remarks → Update if needed
```

**Changes:**
- Move validation BEFORE initial storage
- Store invoice with status='needs_review' if validation fails
- Add all remarks in same transaction

## Database Schema Enhancements

### Missing Fields for Complete GST Compliance

Add these columns to `purchase_register`:

```sql
-- E-invoicing support
ALTER TABLE purchase_register ADD COLUMN e_invoice_irn VARCHAR(64);
ALTER TABLE purchase_register ADD COLUMN e_invoice_ack_no VARCHAR(20);
ALTER TABLE purchase_register ADD COLUMN e_invoice_ack_date DATE;

-- E-way bill tracking
ALTER TABLE purchase_register ADD COLUMN eway_bill_no VARCHAR(12);
ALTER TABLE purchase_register ADD COLUMN eway_bill_date DATE;

-- Amendment tracking (for credit/debit notes)
ALTER TABLE purchase_register ADD COLUMN original_invoice_number VARCHAR(50);
ALTER TABLE purchase_register ADD COLUMN original_invoice_date DATE;
ALTER TABLE purchase_register ADD COLUMN document_type VARCHAR(20) 
  CHECK (document_type IN ('Invoice', 'Debit Note', 'Credit Note', 'Bill of Supply'));

-- Additional GST fields
ALTER TABLE purchase_register ADD COLUMN supply_type VARCHAR(20)
  CHECK (supply_type IN ('Goods', 'Services'));
ALTER TABLE purchase_register ADD COLUMN gstin_verification_status VARCHAR(20)
  CHECK (gstin_verification_status IN ('Active', 'Cancelled', 'Not Verified'));
```

## Validation Enhancements

### Essential Fields for GSTR-2B Filing

**Critical (Must Have):**
1. ✅ Supplier GSTIN - Already validated
2. ✅ Supplier Name - Already validated
3. ✅ Invoice Number - Already validated
4. ✅ Invoice Date - Already validated
5. ✅ Invoice Type (B2B/Import/RCM) - Already validated
6. ✅ Place of Supply - Already validated
7. ✅ Taxable Value - Already validated
8. ✅ Tax Amounts (CGST/SGST/IGST) - Already validated
9. ✅ HSN/SAC Code - **Now added to validation**

**Recommended (Should Have):**
10. ✅ Description - **Now flagged as missing**
11. ✅ Quantity - **Now flagged as missing**
12. ✅ Unit of Measure - **Now flagged as missing**

**Optional (Nice to Have):**
13. ⚠️ E-Invoice IRN - Add to schema
14. ⚠️ E-Way Bill - Add to schema
15. ⚠️ Original Invoice Reference - Add to schema

## Implementation Priority

### High Priority (Do Now) ✅
- [x] Update validation service to check GST-essential fields
- [x] Flag missing fields (HSN, Description, Quantity) in remarks
- [x] Fix edit modal to exclude total_invoice_value

### Medium Priority (Next Sprint)
- [ ] Add database columns for e-invoice, e-way bill
- [ ] Implement Tesseract.js for free OCR
- [ ] Move validation before storage
- [ ] Single transaction for invoice + remarks

### Low Priority (Future Enhancement)
- [ ] GSTIN verification via GST Portal API
- [ ] Auto-fetch vendor details from GSTIN
- [ ] Duplicate invoice detection
- [ ] Historical ITC tracking and reporting

## Code Snippets

### Tesseract.js Integration
```typescript
import Tesseract from 'tesseract.js';

async function extractWithTesseract(imageBuffer: Buffer): Promise<string> {
  const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng', {
    logger: m => console.log(m)
  });
  return text;
}
```

### Combined Extraction with Gemini
```typescript
// In llmExtractionService.ts
export async function extractWithContext(
  ocrText: string,
  base64Image: string
): Promise<ExtractedInvoiceData> {
  const prompt = `You are extracting GST invoice data.
  
  OCR Text (may have errors):
  ${ocrText}
  
  Also see the image for visual context. If OCR text is unclear or missing,
  read directly from the image. Extract all GST-relevant fields.`;
  
  // Send both text and image to Gemini...
}
```

## Performance Metrics to Track

1. **Extraction Accuracy**: % of invoices with all critical fields
2. **Manual Correction Rate**: % needing human review
3. **Processing Time**: Avg seconds per invoice
4. **Cost per Invoice**: API costs (Gemini + Vision)
5. **Remark Distribution**: Most common missing fields

## Conclusion

**Immediate Action:**
- ✅ Validation improvements are implemented
- ✅ Edit modal fixed
- Next: Consider Tesseract for cost savings
- Next: Add e-invoice/e-way bill columns

**Current Status:**
Your system now properly validates and flags all GST-essential fields!
