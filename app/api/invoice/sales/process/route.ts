import { NextRequest, NextResponse } from 'next/server';
import {
  uploadSalesInvoice,
  createSalesInvoice,
  updateSalesInvoice,
  createSalesRemarks,
  SalesRegister,
} from '@/lib/services/salesInvoiceService';
import { extractTextFromInvoice } from '@/lib/services/ocrService';
import { extractSalesInvoiceData } from '@/lib/services/salesExtractionService';
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

    // Step 4: Perform OCR extraction using Tesseract, then pass to Gemini for structured extraction
    let extractedData;
    let ocrConfidence = 0;

    // Use Tesseract OCR + Gemini LLM approach (more reliable)
    console.log('Extracting text using Tesseract OCR...');
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

    console.log('OCR extraction successful. Passing to Gemini for sales invoice structured extraction...');
    ocrConfidence = ocrResult.confidence;

    // Pass OCR text to Gemini LLM for sales-specific structured extraction
    const { data: llmData, error: llmError } = await extractSalesInvoiceData(ocrResult.rawText);

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

    console.log('Raw extracted data:', JSON.stringify(extractedData).substring(0, 500));

    // Step 5: Map extracted sales invoice data to sales register format
    const extractedInvoice: Partial<SalesRegister> = {
      // Seller details (WE are the seller in sales invoice)
      seller_gstin: extractedData.seller_gstin || '',
      seller_state_code: extractedData.seller_gstin?.substring(0, 2) || '',
      
      // Customer details (THEY are the buyer/customer)
      customer_name: extractedData.customer_name || '',
      customer_gstin: extractedData.customer_gstin || '',
      customer_state_code: extractedData.customer_gstin?.substring(0, 2) || '',
      
      // Invoice details
      invoice_number: extractedData.invoice_number || '',
      invoice_date: extractedData.invoice_date || new Date().toISOString().split('T')[0],
      invoice_type: (extractedData.invoice_type as 'B2B' | 'B2C' | 'SEZ' | 'Export' | 'CreditNote') || 'B2B',
      supply_type: determineSupplyType(extractedData.seller_gstin?.substring(0, 2), extractedData.customer_gstin?.substring(0, 2)),
      place_of_supply_state_code: extractedData.customer_gstin?.substring(0, 2) || extractedData.seller_gstin?.substring(0, 2) || '',
      
      // Item details
      hsn_or_sac: extractedData.hsn_or_sac || '',
      description: extractedData.description || '',
      quantity: extractedData.quantity ? parseFloat(extractedData.quantity) : null,
      unit: extractedData.unit || null,
      rate: extractedData.rate || null,
      
      // Tax details
      taxable_value: extractedData.taxable_value || 0,
      cgst: extractedData.cgst || 0,
      sgst: extractedData.sgst || 0,
      igst: extractedData.igst || 0,
      cess: extractedData.cess || 0,
      tcs: 0,
      
      // GST flags
      is_reverse_charge: extractedData.is_reverse_charge || false,
      is_itc_eligible: false, // Sales invoices don't have ITC
      is_export: extractedData.invoice_type?.toLowerCase().includes('export') || false,
      is_sez: extractedData.invoice_type?.toLowerCase().includes('sez') || false,
      
      // Processing metadata
      ocr_raw_json: extractedData,
      ocr_confidence_score: ocrConfidence,
      extraction_source: 'ocr+llm',
    };

    // Step 6: Validate the extracted data
    const validationResult = validateSalesInvoice(extractedInvoice);
    console.log('Validation result:', {
      isValid: validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      invoiceNumber: extractedInvoice.invoice_number,
      customerName: extractedInvoice.customer_name,
      taxableValue: extractedInvoice.taxable_value
    });

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
      // Even if update fails, return the extracted data
      return NextResponse.json({
        success: true,
        invoiceId,
        invoice: extractedInvoice,
        validation: {
          isValid: validationResult.isValid,
          errorCount: validationResult.errors.length,
          warningCount: validationResult.warnings.length,
        },
        message: 'Invoice extracted but update failed. Data: ' + JSON.stringify(extractedInvoice).substring(0, 200),
      });
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
 * Helper: Determine supply type from state codes
 */
function determineSupplyType(sellerState?: string, customerState?: string): 'Intra' | 'Inter' {
  if (!sellerState || !customerState) {
    return 'Inter'; // Default to inter-state if states are unknown
  }
  
  return sellerState === customerState ? 'Intra' : 'Inter';
}
