# Invoice Processing System - Setup Guide

## Overview
This system provides complete GST invoice processing with OCR, LLM-based extraction, validation, and storage capabilities for the SaralGST application.

## Features Implemented

### 1. **File Upload & Storage**
- Upload invoices (PDF, JPG, PNG) to Supabase bucket `SARALGST/Purchase Invoice`
- Support for multiple sources: Manual, WhatsApp, Email, Bulk
- File validation (type, size limits)
- Automatic URL storage in database

### 2. **OCR Processing**
- Primary: Google Cloud Vision API for text extraction
- Fallback: Gemini Vision API for direct image/PDF processing
- Extracts raw text, layout, confidence scores

### 3. **LLM Extraction**
- Uses Gemini API to convert OCR text to structured JSON
- Extracts all GST-relevant fields
- Confidence scoring for critical fields
- Handles vendor-specific formats

### 4. **Validation**
- GSTIN format validation (15-character format with state code)
- Tax calculation verification (CGST + SGST + IGST = Total)
- Mandatory field checks
- Date validation
- HSN/SAC code verification
- State-wise tax type validation

### 5. **Database Storage**
- Structured data in `purchase_register` table
- Validation errors in `purchase_remarks` table
- Full OCR dump for audit trail
- Source tracking (manual/whatsapp/email)

## Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI/ML APIs
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_VISION_API_KEY=your-vision-api-key (optional)
```

## Database Schema

### Table: `purchase_register`

```sql
CREATE TABLE purchase_register (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT CHECK (source IN ('whatsapp', 'email', 'manual', 'bulk')),
  
  -- Supplier Details
  supplier_name TEXT,
  supplier_gstin TEXT,
  supplier_state_code TEXT,
  
  -- Invoice Details
  invoice_number TEXT,
  invoice_date DATE,
  invoice_type TEXT DEFAULT 'B2B',
  
  -- Buyer Details
  buyer_gstin TEXT,
  place_of_supply_state_code TEXT,
  
  -- Tax Details
  taxable_value DECIMAL(15,2),
  cgst_amount DECIMAL(15,2),
  sgst_amount DECIMAL(15,2),
  igst_amount DECIMAL(15,2),
  cess_amount DECIMAL(15,2),
  total_invoice_value DECIMAL(15,2),
  
  -- Line Item Details
  hsn_or_sac_code TEXT,
  description_of_goods_services TEXT,
  quantity DECIMAL(15,2),
  unit_of_measure TEXT,
  rate_per_unit DECIMAL(15,2),
  
  -- ITC Details
  is_reverse_charge BOOLEAN DEFAULT FALSE,
  is_itc_eligible BOOLEAN DEFAULT TRUE,
  itc_claimed_cgst DECIMAL(15,2),
  itc_claimed_sgst DECIMAL(15,2),
  itc_claimed_igst DECIMAL(15,2),
  itc_claimed_cess DECIMAL(15,2),
  
  -- Processing Details
  invoice_bucket_url TEXT,
  ocr_raw_json JSONB,
  ocr_confidence_score DECIMAL(3,2),
  invoice_status TEXT CHECK (invoice_status IN ('extracted', 'verified', 'error', 'pending', 'needs_review')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `purchase_remarks`

```sql
CREATE TABLE purchase_remarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchase_register(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  issue_type TEXT CHECK (issue_type IN ('missing', 'unreadable', 'mismatch', 'invalid_format')),
  detected_value TEXT,
  expected_value TEXT,
  confidence_score DECIMAL(3,2),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Storage Bucket Setup

Create a Supabase storage bucket named `invoices` with the following settings:
- Public: Yes (or configure appropriate RLS policies)
- File size limit: 10MB
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`

## API Endpoints

### 1. Process Invoice
```
POST /api/invoice/process
Content-Type: multipart/form-data

Body:
- file: File (required)
- source: string (manual|whatsapp|email|bulk)

Response:
{
  "success": true,
  "invoiceId": "uuid",
  "invoice": {...},
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

### 2. Get All Invoices
```
GET /api/invoice/purchase?source=manual&status=extracted

Response:
{
  "success": true,
  "invoices": [...],
  "count": 10
}
```

### 3. Get Single Invoice
```
GET /api/invoice/purchase/:id

Response:
{
  "success": true,
  "invoice": {...},
  "remarks": [...]
}
```

### 4. Update Invoice
```
PATCH /api/invoice/purchase/:id
Content-Type: application/json

Body: { "supplier_name": "New Name", ... }
```

### 5. Delete Invoice
```
DELETE /api/invoice/purchase/:id
```

## Usage Flow

### Frontend (Upload Page)

1. User selects file(s) to upload
2. Files are validated client-side
3. Each file is sent to `/api/invoice/process`
4. Progress is tracked through status updates
5. Results are displayed with validation status

### Backend Processing Pipeline

1. **File Upload**: Save to Supabase storage
2. **OCR**: Extract text using Vision API or Gemini
3. **LLM Extraction**: Convert text to structured data
4. **Validation**: Check GSTIN, tax calculations, mandatory fields
5. **Storage**: Save to `purchase_register` and `purchase_remarks`
6. **Response**: Return results with validation status

### Frontend (Purchase Register Page)

1. Fetches invoices from `/api/invoice/purchase`
2. Displays in table with filtering options
3. Shows validation status with color coding
4. Provides modal for detailed view/edit
5. Displays file preview with PDF viewer

## Validation Rules

### GSTIN Validation
- Format: `NNAAAAA9999A9Z9` (15 characters)
- First 2: State code (01-37)
- Next 10: PAN number
- 13th: Entity number
- 14th: Z (default)
- 15th: Checksum

### Tax Validation
- CGST + SGST + IGST + CESS should equal Total - Taxable
- CGST and SGST must be equal (for intra-state)
- Either (CGST + SGST) OR IGST, not both
- Tax rates: Common GST rates are 0%, 5%, 12%, 18%, 28%

### Mandatory Fields
- Supplier Name & GSTIN
- Invoice Number & Date
- Taxable Value & Total
- Place of Supply

## Testing

### Test with Sample Invoice

1. Upload a GST invoice PDF/image
2. Check the processing status
3. Verify extracted data in Purchase Register
4. Review any validation errors in the modal

### Manual Testing Checklist

- [ ] Upload PDF invoice
- [ ] Upload image invoice
- [ ] Check GSTIN validation
- [ ] Verify tax calculations
- [ ] Test with missing fields
- [ ] Test with invalid GSTIN
- [ ] Test WhatsApp source (via n8n)
- [ ] View invoice in Purchase Register
- [ ] Edit invoice details
- [ ] Download original file

## Troubleshooting

### OCR Not Working
- Check if GEMINI_API_KEY is set in .env.local
- Optionally add GOOGLE_CLOUD_VISION_API_KEY for better accuracy
- Ensure file is readable PDF or clear image

### Upload Failing
- Check Supabase bucket exists and is accessible
- Verify bucket name is correct in code
- Check file size (max 10MB)
- Verify MIME type is allowed

### Validation Errors
- Check if GSTIN format is correct
- Verify tax calculations match
- Ensure all mandatory fields are present
- Review confidence scores for OCR quality

### Database Errors
- Verify tables exist with correct schema
- Check foreign key constraints
- Ensure enum values match defined types
- Review RLS policies if using Supabase auth

## WhatsApp Integration

The system supports n8n workflow integration for WhatsApp invoice capture:

1. n8n workflow fetches invoice from WhatsApp
2. Stores file in same Supabase bucket
3. Creates entry in `purchase_register` with `source='whatsapp'`
4. Frontend displays with WhatsApp icon
5. Same processing pipeline applies

## Future Enhancements

- [ ] Batch processing for multiple invoices
- [ ] ML model for specific vendor formats
- [ ] Auto-matching with GSTR-2A/2B
- [ ] Duplicate detection
- [ ] Vendor database integration
- [ ] Email integration (Gmail API)
- [ ] Excel/CSV bulk import
- [ ] Advanced reporting & analytics
- [ ] Audit trail with user actions
- [ ] Approval workflow

## Support

For issues or questions:
1. Check console logs for detailed errors
2. Review validation errors in `purchase_remarks` table
3. Verify environment variables are set correctly
4. Test with sample invoices first
