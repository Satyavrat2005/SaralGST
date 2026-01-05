import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  uploadInvoiceToStorage,
  createPurchaseInvoice,
  updatePurchaseInvoice,
  createPurchaseRemark,
  PurchaseRegister,
} from '@/lib/services/purchaseInvoiceService';
import { extractTextFromInvoice } from '@/lib/services/ocrService';
import {
  extractInvoiceData,
  extractInvoiceDataFromImage,
} from '@/lib/services/llmExtractionService';
import {
  validateInvoiceData,
  getStateCodeFromGSTIN,
} from '@/lib/services/validationService';

/**
 * POST /api/invoice/process
 * Upload and process an invoice through OCR, LLM extraction, validation, and storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const source = (formData.get('source') as string) || 'manual';

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

    // Generate unique ID for this invoice
    const invoiceId = uuidv4();

    // Step 1: Create initial record with pending status
    const initialRecord: PurchaseRegister = {
      id: invoiceId,
      source: source as any,
      invoice_status: 'pending',
    };

    const { data: createdInvoice, error: createError } = await createPurchaseInvoice(initialRecord);

    if (createError || !createdInvoice) {
      return NextResponse.json(
        { error: `Failed to create invoice record: ${createError}` },
        { status: 500 }
      );
    }

    // Step 2: Upload file to Supabase Storage
    const { url: fileUrl, error: uploadError } = await uploadInvoiceToStorage(file, invoiceId);

    if (uploadError || !fileUrl) {
      await updatePurchaseInvoice(invoiceId, {
        invoice_status: 'error',
      });

      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError}` },
        { status: 500 }
      );
    }

    // Update record with file URL
    await updatePurchaseInvoice(invoiceId, {
      invoice_bucket_url: fileUrl,
    });

    // Step 3: Convert file to buffer for OCR
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const base64File = fileBuffer.toString('base64');

    // Step 4: Perform OCR extraction
    let extractedData;
    let ocrConfidence = 0;

    // Try direct image/PDF extraction with Gemini Vision first (works best)
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
      // Fallback to OCR + LLM approach
      const ocrResult = await extractTextFromInvoice(fileBuffer, file.type);

      if (!ocrResult.success || !ocrResult.rawText) {
        await updatePurchaseInvoice(invoiceId, {
          invoice_status: 'error',
        });

        await createPurchaseRemark({
          purchase_id: invoiceId,
          field_name: 'ocr_extraction',
          issue_type: 'unreadable',
          detected_value: null,
          comment: ocrResult.error || 'Failed to extract text from invoice',
          status: 'open',
        });

        return NextResponse.json(
          { error: 'Failed to extract text from invoice', details: ocrResult.error },
          { status: 500 }
        );
      }

      ocrConfidence = ocrResult.confidence;

      // Step 5: Pass OCR text to LLM for structured extraction
      const { data: llmData, error: llmError } = await extractInvoiceData(ocrResult.rawText);

      if (llmError || !llmData) {
        await updatePurchaseInvoice(invoiceId, {
          invoice_status: 'error',
          ocr_raw_json: { rawText: ocrResult.rawText },
          ocr_confidence_score: ocrConfidence,
        });

        await createPurchaseRemark({
          purchase_id: invoiceId,
          field_name: 'llm_extraction',
          issue_type: 'unreadable',
          detected_value: ocrResult.rawText.substring(0, 200),
          comment: llmError || 'Failed to extract structured data from OCR text',
          status: 'open',
        });

        return NextResponse.json(
          { error: 'Failed to extract structured data', details: llmError },
          { status: 500 }
        );
      }

      extractedData = llmData;
    }

    // Step 6: Validate extracted data
    const validationResult = validateInvoiceData(extractedData);

    // Step 7: Prepare data for database
    const supplierStateCode = getStateCodeFromGSTIN(extractedData.supplier_gstin);
    const placeOfSupplyCode = getStateCodeFromGSTIN(extractedData.buyer_gstin);

    const invoiceData: Partial<PurchaseRegister> = {
      supplier_name: extractedData.supplier_name || null,
      supplier_gstin: extractedData.supplier_gstin || null,
      supplier_state_code: supplierStateCode || null,
      invoice_number: extractedData.invoice_number || null,
      invoice_date: extractedData.invoice_date || null,
      invoice_type: extractedData.invoice_type || 'B2B',
      buyer_gstin: extractedData.buyer_gstin || null,
      place_of_supply_state_code: placeOfSupplyCode || null,
      taxable_value: extractedData.taxable_value || 0,
      cgst_amount: extractedData.cgst || 0,
      sgst_amount: extractedData.sgst || 0,
      igst_amount: extractedData.igst || 0,
      cess_amount: extractedData.cess || 0,
      total_invoice_value: extractedData.total_invoice_value || 0,
      hsn_or_sac_code: extractedData.hsn_or_sac || null,
      description_of_goods_services: extractedData.description || null,
      quantity: parseFloat(extractedData.quantity) || null,
      unit_of_measure: extractedData.unit || null,
      is_reverse_charge: extractedData.is_reverse_charge || false,
      is_itc_eligible: extractedData.is_itc_eligible !== false, // Default true
      ocr_raw_json: extractedData,
      ocr_confidence_score: ocrConfidence,
      invoice_status: validationResult.isValid ? 'extracted' : 'needs_review',
    };

    // Calculate ITC amounts (assuming eligible)
    if (invoiceData.is_itc_eligible) {
      invoiceData.itc_claimed_cgst = invoiceData.cgst_amount;
      invoiceData.itc_claimed_sgst = invoiceData.sgst_amount;
      invoiceData.itc_claimed_igst = invoiceData.igst_amount;
      invoiceData.itc_claimed_cess = invoiceData.cess_amount;
    }

    // Step 8: Update invoice record with extracted data
    const { data: updatedInvoice, error: updateError } = await updatePurchaseInvoice(
      invoiceId,
      invoiceData
    );

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update invoice: ${updateError}` },
        { status: 500 }
      );
    }

    // Step 9: Store validation errors as remarks
    if (validationResult.errors.length > 0) {
      for (const error of validationResult.errors) {
        await createPurchaseRemark({
          purchase_id: invoiceId,
          field_name: error.field,
          issue_type: error.issue_type,
          detected_value: error.detected_value,
          expected_value: error.expected_value || null,
          confidence_score: error.confidence_score || null,
          comment: error.message,
          status: 'open',
        });
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      invoiceId,
      invoice: updatedInvoice,
      validation: {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      },
      message: validationResult.isValid
        ? 'Invoice processed successfully'
        : 'Invoice processed with validation issues. Please review.',
    });

  } catch (error: any) {
    console.error('Error processing invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoice/process?id=xxx
 * Get processing status of an invoice
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // This would fetch the invoice and its remarks from the database
    // For now, returning a placeholder response
    return NextResponse.json({
      message: 'Use GET /api/invoice/purchase/:id instead',
    });

  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
