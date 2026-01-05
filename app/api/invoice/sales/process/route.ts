import { NextRequest, NextResponse } from 'next/server';
import {
  uploadSalesInvoice,
  createSalesInvoice,
  updateSalesInvoice,
  createSalesRemarks,
  SalesRegister,
} from '@/lib/services/salesInvoiceService';
import { extractTextFromInvoice } from '@/lib/services/ocrService';
import {
  extractInvoiceData,
  extractInvoiceDataFromImage,
} from '@/lib/services/llmExtractionService';
import { validateSalesInvoice, validationToRemarks } from '@/lib/services/salesValidationService';

/**
 * POST /api/invoice/sales/process
 * Upload and process a sales invoice through OCR, LLM extraction, validation, and storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Step 1: Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await uploadSalesInvoice(file, true);

    if (uploadError || !uploadData) {
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError}` },
        { status: 500 }
      );
    }

    // Step 2: Create initial record with pending status
    const initialRecord: Partial<SalesRegister> = {
      invoice_bucket_url: uploadData.url,
      invoice_status: 'needs_review',
      seller_gstin: 'TEMP', // Will be updated by extraction
      seller_state_code: '00', // Will be updated by extraction
      invoice_number: 'TEMP', // Will be updated by extraction
      invoice_date: new Date().toISOString().split('T')[0],
      invoice_type: 'B2B',
      supply_type: 'Intra',
      place_of_supply_state_code: '00',
      taxable_value: 0,
      extraction_source: 'ocr+llm',
    };

    const { data: createdInvoice, error: createError } = await createSalesInvoice(initialRecord, true);

    if (createError || !createdInvoice) {
      return NextResponse.json(
        { error: `Failed to create invoice record: ${createError}` },
        { status: 500 }
      );
    }

    const invoiceId = createdInvoice.id!;

    // Step 3: Convert file to buffer for OCR
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const base64File = fileBuffer.toString('base64');

    // Step 4: Perform OCR extraction using Tesseract + Gemini
    let extractedData;
    let ocrConfidence = 0;

    // Try direct image/PDF extraction with Gemini Vision first
    const { data: directData, error: directError } = await extractInvoiceDataFromImage(
      base64File,
      file.type
    );

    if (directData && !directError) {
      extractedData = directData;
      ocrConfidence = (
        directData.confidence.supplier_gstin +
        directData.confidence.invoice_number +
        directData.confidence.tax_values
      ) / 3;
    } else {
      // Fallback to Tesseract OCR + LLM approach
      const ocrResult = await extractTextFromInvoice(fileBuffer, file.type);

      if (!ocrResult.success || !ocrResult.rawText) {
        await updateSalesInvoice(invoiceId, {
          invoice_status: 'needs_review',
        }, true);

        await createSalesRemarks([{
          sales_id: invoiceId,
          field_name: 'ocr_extraction',
          issue_type: 'invalid',
          detected_value: null,
          comment: ocrResult.error || 'Failed to extract text from invoice',
          status: 'open',
        }], true);

        return NextResponse.json({
          success: true,
          invoiceId,
          message: 'Invoice uploaded but OCR failed. Manual review required.',
          invoice: createdInvoice,
        });
      }

      ocrConfidence = ocrResult.confidence;

      // Pass OCR text to LLM for structured extraction
      const { data: llmData, error: llmError } = await extractInvoiceData(ocrResult.rawText);

      if (llmError || !llmData) {
        await updateSalesInvoice(invoiceId, {
          invoice_status: 'needs_review',
        }, true);

        await createSalesRemarks([{
          sales_id: invoiceId,
          field_name: 'llm_extraction',
          issue_type: 'invalid',
          detected_value: null,
          comment: llmError || 'Failed to extract structured data from invoice',
          status: 'open',
        }], true);

        return NextResponse.json({
          success: true,
          invoiceId,
          message: 'Invoice uploaded but extraction failed. Manual review required.',
          invoice: createdInvoice,
        });
      }

      extractedData = llmData;
    }

    // Step 5: Map extracted data to sales register format
    const extractedInvoice: Partial<SalesRegister> = {
      // Seller details (extracted from "supplier" in LLM response - for sales, supplier is us)
      seller_gstin: extractedData.supplier_gstin || '',
      seller_state_code: extractedData.supplier_gstin?.substring(0, 2) || '',
      
      // Customer details (from buyer fields)
      customer_name: extractedData.supplier_name || '', // In sales context, supplier_name from extraction is actually customer name
      customer_gstin: extractedData.buyer_gstin || '',
      customer_state_code: extractedData.buyer_gstin?.substring(0, 2) || '',
      
      // Invoice details
      invoice_number: extractedData.invoice_number || '',
      invoice_date: extractedData.invoice_date || new Date().toISOString().split('T')[0],
      invoice_type: determineInvoiceType(extractedData),
      supply_type: determineSupplyType(extractedData),
      place_of_supply_state_code: extractedData.place_of_supply || '',
      
      // Item details
      hsn_or_sac: extractedData.hsn_or_sac || '',
      description: extractedData.description || '',
      quantity: extractedData.quantity ? parseFloat(extractedData.quantity) : null,
      unit: extractedData.unit || null,
      rate: extractedData.taxable_value && extractedData.quantity ? 
        extractedData.taxable_value / parseFloat(extractedData.quantity) : null,
      
      // Tax details
      taxable_value: extractedData.taxable_value || 0,
      cgst: extractedData.cgst || 0,
      sgst: extractedData.sgst || 0,
      igst: extractedData.igst || 0,
      cess: extractedData.cess || 0,
      tcs: 0,
      
      // GST flags
      is_reverse_charge: extractedData.is_reverse_charge || false,
      is_itc_eligible: extractedData.is_itc_eligible || false,
      is_export: extractedData.invoice_type?.toLowerCase().includes('export') || false,
      is_sez: extractedData.invoice_type?.toLowerCase().includes('sez') || false,
      
      // Processing metadata
      ocr_raw_json: extractedData,
      ocr_confidence_score: ocrConfidence,
      extraction_source: 'ocr+llm',
    };

    // Step 6: Validate the extracted data
    const validationResult = validateSalesInvoice(extractedInvoice);

    // Determine final status based on validation
    const finalStatus = validationResult.isValid ? 'extracted' : 'needs_review';
    extractedInvoice.invoice_status = finalStatus;

    // Step 7: Update the invoice with extracted data
    const { data: updatedInvoice, error: updateError } = await updateSalesInvoice(
      invoiceId,
      extractedInvoice,
      true
    );

    if (updateError) {
      console.error('Error updating invoice:', updateError);
    }

    // Step 8: Store validation remarks if any issues found
    if (validationResult.errors.length > 0 || validationResult.warnings.length > 0) {
      const remarks = validationToRemarks(invoiceId, validationResult);
      await createSalesRemarks(remarks, true);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      invoiceId,
      invoice: updatedInvoice || extractedInvoice,
      validation: {
        isValid: validationResult.isValid,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
      },
      message: validationResult.isValid
        ? 'Invoice processed successfully'
        : 'Invoice processed with validation issues',
    });

  } catch (error: any) {
    console.error('Error processing sales invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Determine invoice type from extracted data
 */
function determineInvoiceType(data: any): 'B2B' | 'B2C' | 'Export' | 'SEZ' | 'CreditNote' {
  const type = (data.invoice_type || '').toLowerCase();
  
  if (type.includes('export')) return 'Export';
  if (type.includes('sez')) return 'SEZ';
  if (type.includes('credit')) return 'CreditNote';
  if (type.includes('b2c')) return 'B2C';
  
  // Default to B2B if customer GSTIN is present
  if (data.buyer_gstin && data.buyer_gstin.length === 15) {
    return 'B2B';
  }
  
  return 'B2C';
}

/**
 * Helper: Determine supply type from extracted data
 */
function determineSupplyType(data: any): 'Intra' | 'Inter' {
  const sellerState = data.supplier_gstin?.substring(0, 2) || '';
  const buyerState = data.buyer_gstin?.substring(0, 2) || '';
  const posState = data.place_of_supply || '';
  
  // If IGST is charged, it's inter-state
  if ((data.igst || 0) > 0) {
    return 'Inter';
  }
  
  // If CGST/SGST is charged, it's intra-state
  if ((data.cgst || 0) > 0 || (data.sgst || 0) > 0) {
    return 'Intra';
  }
  
  // Compare state codes
  if (sellerState === buyerState || sellerState === posState.substring(0, 2)) {
    return 'Intra';
  }
  
  return 'Inter';
}
