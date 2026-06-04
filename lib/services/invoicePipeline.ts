/**
 * Shared invoice processing pipeline.
 *
 * This is the "brain" referenced by the WhatsApp integration plan: it takes a
 * single invoice file from ANY source (manual upload, WhatsApp, email, …) and
 * runs the full intake pipeline — store → OCR/Gemini extract → validate →
 * persist — returning a structured result. Both the manual-upload API route
 * (`/api/invoice/process`) and the WhatsApp webhook call this so the behaviour
 * stays identical regardless of channel.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  uploadInvoiceToStorage,
  createPurchaseInvoice,
  updatePurchaseInvoice,
  createPurchaseRemark,
  findDuplicateInvoice,
  PurchaseRegister,
} from './purchaseInvoiceService';
import { extractTextFromInvoice } from './ocrService';
import {
  extractInvoiceData,
  extractInvoiceDataFromImage,
  ExtractedInvoiceData,
} from './llmExtractionService';
import {
  validateInvoiceData,
  getStateCodeFromGSTIN,
  ValidationResult,
} from './validationService';

export const ALLOWED_INVOICE_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export const MAX_INVOICE_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ProcessInvoiceOptions {
  /** Status applied when validation passes. Default `'extracted'` (visible in tab). */
  validStatus?: NonNullable<PurchaseRegister['invoice_status']>;
  /**
   * Status applied when validation fails. Default `'pending'` (manual upload).
   * The WhatsApp webhook passes `'wa_quarantine'` so failures stay hidden.
   */
  invalidStatus?: NonNullable<PurchaseRegister['invoice_status']>;
  /** Reject duplicates (same supplier GSTIN + invoice number). Default false. */
  checkDuplicates?: boolean;
  /** Phone number of the WhatsApp sender, persisted for the correction loop. */
  waSenderPhone?: string | null;
  /** Attempt counter for the WhatsApp correction loop. */
  waAttemptCount?: number | null;
}

export interface ProcessInvoiceResult {
  success: boolean;
  invoiceId: string;
  invoice: PurchaseRegister | null;
  validation: ValidationResult | null;
  extractedData: ExtractedInvoiceData | null;
  /** True if a non-quarantined invoice with the same supplier+number already exists. */
  isDuplicate: boolean;
  /** A fatal pipeline error (upload/OCR failure). Distinct from validation errors. */
  error: string | null;
}

/**
 * Run the full intake pipeline for one invoice file.
 *
 * Note: this performs OCR + Gemini calls and can take several seconds. Callers
 * in serverless/edge contexts (the WhatsApp webhook) must run it in the
 * background (e.g. `waitUntil`) rather than blocking the HTTP response.
 */
export async function processInvoiceFile(
  file: File,
  source: PurchaseRegister['source'],
  options: ProcessInvoiceOptions = {}
): Promise<ProcessInvoiceResult> {
  const {
    validStatus = 'extracted',
    invalidStatus = 'pending',
    checkDuplicates = false,
    waSenderPhone = null,
    waAttemptCount = null,
  } = options;

  const invoiceId = uuidv4();

  const fail = (error: string): ProcessInvoiceResult => ({
    success: false,
    invoiceId,
    invoice: null,
    validation: null,
    extractedData: null,
    isDuplicate: false,
    error,
  });

  // Step 1: Create the initial record (pending).
  const initialRecord: PurchaseRegister = {
    id: invoiceId,
    source,
    invoice_status: 'pending',
    wa_sender_phone: waSenderPhone,
    wa_attempt_count: waAttemptCount,
  };

  const { error: createError } = await createPurchaseInvoice(initialRecord, true);
  if (createError) {
    return fail(`Failed to create invoice record: ${createError}`);
  }

  // Step 2: Upload the file to Supabase Storage.
  const { url: fileUrl, error: uploadError } = await uploadInvoiceToStorage(
    file,
    invoiceId,
    true
  );

  if (uploadError || !fileUrl) {
    await updatePurchaseInvoice(invoiceId, { invoice_status: 'error' }, true);
    return fail(`Failed to upload file: ${uploadError}`);
  }

  await updatePurchaseInvoice(invoiceId, { invoice_bucket_url: fileUrl }, true);

  // Step 3: Convert the file to a buffer for extraction.
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const base64File = fileBuffer.toString('base64');

  // Step 4: Extract — Gemini Vision first, OCR + LLM as a fallback.
  let extractedData: ExtractedInvoiceData | undefined;
  let ocrConfidence = 0;

  const { data: directData, error: directError } = await extractInvoiceDataFromImage(
    base64File,
    file.type
  );

  if (directData && !directError) {
    extractedData = directData;
    ocrConfidence =
      (directData.confidence.supplier_gstin +
        directData.confidence.invoice_number +
        directData.confidence.tax_values) /
      3;
  } else {
    const ocrResult = await extractTextFromInvoice(fileBuffer, file.type);

    if (!ocrResult.success || !ocrResult.rawText) {
      await updatePurchaseInvoice(invoiceId, { invoice_status: 'error' }, true);
      await createPurchaseRemark(
        {
          purchase_id: invoiceId,
          field_name: 'ocr_extraction',
          issue_type: 'unreadable',
          detected_value: null,
          comment: ocrResult.error || 'Failed to extract text from invoice',
          status: 'open',
        },
        true
      );
      return fail('Failed to extract text from invoice');
    }

    ocrConfidence = ocrResult.confidence;

    const { data: llmData, error: llmError } = await extractInvoiceData(
      ocrResult.rawText
    );

    if (llmError || !llmData) {
      await updatePurchaseInvoice(
        invoiceId,
        {
          invoice_status: 'error',
          ocr_raw_json: { rawText: ocrResult.rawText },
          ocr_confidence_score: ocrConfidence,
        },
        true
      );
      await createPurchaseRemark(
        {
          purchase_id: invoiceId,
          field_name: 'llm_extraction',
          issue_type: 'unreadable',
          detected_value: ocrResult.rawText.substring(0, 200),
          comment: llmError || 'Failed to extract structured data from OCR text',
          status: 'open',
        },
        true
      );
      return fail('Failed to extract structured data from invoice');
    }

    extractedData = llmData;
  }

  // Step 5: Validate the extracted data (intrinsic, self-contained checks).
  const validationResult = validateInvoiceData(extractedData);

  // Step 5b: Optional duplicate detection (same supplier GSTIN + invoice number).
  let isDuplicate = false;
  if (checkDuplicates) {
    const { data: dup } = await findDuplicateInvoice(
      extractedData.supplier_gstin,
      extractedData.invoice_number,
      invoiceId,
      true
    );
    if (dup) {
      isDuplicate = true;
      validationResult.isValid = false;
      validationResult.errors.push({
        field: 'invoice_number',
        issue_type: 'mismatch',
        detected_value: extractedData.invoice_number || null,
        message: `Duplicate invoice: ${extractedData.invoice_number} from ${
          extractedData.supplier_name || 'this supplier'
        } was already received.`,
      });
    }
  }

  // Step 6: Map extracted fields to the DB shape.
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
    total_invoice_value:
      (extractedData.taxable_value || 0) +
      (extractedData.cgst || 0) +
      (extractedData.sgst || 0) +
      (extractedData.igst || 0) +
      (extractedData.cess || 0),
    hsn_or_sac_code: extractedData.hsn_or_sac || null,
    description_of_goods_services: extractedData.description || null,
    quantity: parseFloat(extractedData.quantity) || null,
    unit_of_measure: extractedData.unit || null,
    is_reverse_charge: extractedData.is_reverse_charge || false,
    is_itc_eligible: extractedData.is_itc_eligible !== false, // Default true
    ocr_raw_json: extractedData,
    ocr_confidence_score: ocrConfidence,
    invoice_status: validationResult.isValid ? validStatus : invalidStatus,
  };

  if (invoiceData.is_itc_eligible) {
    invoiceData.itc_claimed_cgst = invoiceData.cgst_amount;
    invoiceData.itc_claimed_sgst = invoiceData.sgst_amount;
    invoiceData.itc_claimed_igst = invoiceData.igst_amount;
    invoiceData.itc_claimed_cess = invoiceData.cess_amount;
  }

  // Step 7: Persist the extracted data.
  const { data: updatedInvoice, error: updateError } = await updatePurchaseInvoice(
    invoiceId,
    invoiceData,
    true
  );

  if (updateError) {
    return fail(`Failed to update invoice: ${updateError}`);
  }

  // Step 8: Store validation errors as remarks.
  for (const error of validationResult.errors) {
    await createPurchaseRemark(
      {
        purchase_id: invoiceId,
        field_name: error.field,
        issue_type: error.issue_type,
        detected_value: error.detected_value,
        expected_value: error.expected_value || null,
        confidence_score: error.confidence_score || null,
        comment: error.message,
        status: 'open',
      },
      true
    );
  }

  return {
    success: true,
    invoiceId,
    invoice: updatedInvoice,
    validation: validationResult,
    extractedData,
    isDuplicate,
    error: null,
  };
}
