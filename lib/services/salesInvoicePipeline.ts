/**
 * Shared sales invoice pipeline — manual upload and WhatsApp use the same path.
 */

import {
  uploadSalesInvoice,
  createNewSalesInvoice,
  updateNewSalesInvoice,
  createSalesRemarks,
  type SalesInvoice,
} from './salesInvoiceService';
import { extractSalesInvoiceWithGemini } from './geminiSalesExtractionService';

export const ALLOWED_SALES_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export const MAX_SALES_FILE_SIZE = 10 * 1024 * 1024;

export type SalesSource = 'manual' | 'whatsapp' | 'email' | 'bulk';

export interface SalesValidationError {
  field: string;
  issue_type: 'missing' | 'mismatch' | 'invalid' | 'low_confidence';
  detected_value: string | null;
  message: string;
}

export interface SalesValidationResult {
  isValid: boolean;
  errors: SalesValidationError[];
  warnings: Array<{ field: string; message: string }>;
  missingFields: string[];
}

export interface ProcessSalesInvoiceOptions {
  validStatus?: SalesInvoice['extraction_status'];
  invalidStatus?: SalesInvoice['extraction_status'];
  waSenderPhone?: string | null;
  waAttemptCount?: number | null;
}

export interface ProcessSalesInvoiceResult {
  success: boolean;
  invoiceId: string;
  invoice: SalesInvoice | null;
  validation: SalesValidationResult | null;
  extractedData: Record<string, unknown> | null;
  error: string | null;
}

export function getMissingSalesFields(invoice: Partial<SalesInvoice>): string[] {
  const missing: string[] = [];
  if (!invoice.invoice_number) missing.push('Invoice Number');
  if (!invoice.invoice_date) missing.push('Invoice Date');
  if (!invoice.invoice_type) missing.push('Invoice Type');
  if (!invoice.customer_name) missing.push('Customer Name');
  if (!invoice.place_of_supply) missing.push('Place of Supply');
  if (invoice.taxable_value === null || invoice.taxable_value === undefined) {
    missing.push('Taxable Value');
  }
  if (!invoice.hsn_sac_code) missing.push('HSN/SAC Code');
  if (!invoice.invoice_file_url) missing.push('Invoice File');
  return missing;
}

export function validateSalesInvoiceData(
  invoice: Partial<SalesInvoice>
): SalesValidationResult {
  const missingFields = getMissingSalesFields(invoice);
  const warnings: Array<{ field: string; message: string }> = [];

  if (invoice.invoice_type === 'B2B' && !invoice.customer_gstin) {
    missingFields.push('Customer GSTIN');
  }

  if (invoice.gross_total === null || invoice.gross_total === undefined) {
    warnings.push({
      field: 'gross_total',
      message: 'Gross total could not be confirmed from the extracted data.',
    });
  }

  return {
    isValid: missingFields.length === 0,
    errors: missingFields.map((field) => ({
      field,
      issue_type: 'missing' as const,
      detected_value: null,
      message: `${field} is required for sales register and GSTR-1 review`,
    })),
    warnings,
    missingFields,
  };
}

function buildSalesRemarks(
  salesId: string,
  validation: SalesValidationResult
): Parameters<typeof createSalesRemarks>[0] {
  const remarks: Parameters<typeof createSalesRemarks>[0] = validation.errors.map((error) => ({
    sales_id: salesId,
    field_name: error.field,
    issue_type: error.issue_type,
    detected_value: null,
    expected_value: null,
    comment: error.message,
    status: 'open' as const,
  }));

  validation.warnings.forEach((warning) => {
    remarks.push({
      sales_id: salesId,
      field_name: warning.field,
      issue_type: 'low_confidence',
      detected_value: null,
      expected_value: null,
      comment: warning.message,
      status: 'open' as const,
    });
  });

  return remarks;
}

export async function processSalesInvoiceFile(
  file: File,
  source: SalesSource,
  options: ProcessSalesInvoiceOptions = {}
): Promise<ProcessSalesInvoiceResult> {
  const {
    validStatus = 'extracted',
    invalidStatus = 'pending',
    waSenderPhone = null,
    waAttemptCount = null,
  } = options;

  const fail = (error: string, invoiceId = ''): ProcessSalesInvoiceResult => ({
    success: false,
    invoiceId,
    invoice: null,
    validation: null,
    extractedData: null,
    error,
  });

  if (!ALLOWED_SALES_MIME_TYPES.includes(file.type)) {
    return fail('Invalid file type. Only PDF, JPG, and PNG are allowed.');
  }

  if (file.size > MAX_SALES_FILE_SIZE) {
    return fail('File size exceeds 10 MB limit.');
  }

  const { data: uploadData, error: uploadError } = await uploadSalesInvoice(file, true);
  if (uploadError || !uploadData) {
    return fail(`Failed to upload file: ${uploadError}`);
  }

  const { data: placeholder, error: createError } = await createNewSalesInvoice(
    {
      invoice_file_url: uploadData.url,
      extraction_status: 'pending',
      source,
      wa_sender_phone: waSenderPhone,
      wa_attempt_count: waAttemptCount ?? 0,
    } as Partial<SalesInvoice>,
    true
  );

  if (createError || !placeholder?.id) {
    return fail(`Failed to create invoice record: ${createError}`);
  }

  const invoiceId = placeholder.id;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const { data: extracted, error: extractionError } = await extractSalesInvoiceWithGemini(
    fileBuffer,
    file.type
  );

  if (extractionError || !extracted) {
    await updateNewSalesInvoice(
      invoiceId,
      { extraction_status: source === 'whatsapp' ? 'wa_quarantine' : 'needs_review' },
      true
    );
    return {
      success: false,
      invoiceId,
      invoice: placeholder,
      validation: null,
      extractedData: null,
      error: extractionError || 'Extraction failed',
    };
  }

  const invoiceData: Partial<SalesInvoice> = {
    invoice_date: extracted.invoice_date,
    voucher_type: extracted.voucher_type,
    invoice_number: extracted.invoice_number,
    invoice_type: extracted.invoice_type,
    customer_name: extracted.customer_name,
    customer_gstin: extracted.customer_gstin,
    place_of_supply: extracted.place_of_supply,
    hsn_sac_code: extracted.hsn_sac_code,
    quantity: extracted.quantity,
    uqc: extracted.uqc,
    rate: extracted.rate,
    local_sales_taxable_18: extracted.local_sales_taxable_18,
    local_sales_taxable_12: extracted.local_sales_taxable_12,
    oms_sales_taxable_12: extracted.oms_sales_taxable_12,
    taxable_value: extracted.taxable_value,
    cgst_amount: extracted.cgst_amount,
    sgst_amount: extracted.sgst_amount,
    igst_amount: extracted.igst_amount,
    tcs_cess: extracted.tcs_cess,
    round_off: extracted.round_off,
    gross_total: extracted.gross_total,
    reverse_charge: extracted.reverse_charge,
    eway_bill_number: extracted.eway_bill_number,
    irn: extracted.irn,
    invoice_file_url: uploadData.url,
    gemini_raw_json: extracted,
    source,
    wa_sender_phone: waSenderPhone,
    wa_attempt_count: waAttemptCount ?? 0,
  };

  const validation = validateSalesInvoiceData(invoiceData);
  let extraction_status: SalesInvoice['extraction_status'];
  if (validation.isValid) {
    const hasCritical =
      invoiceData.invoice_number &&
      invoiceData.invoice_date &&
      (invoiceData.taxable_value !== null || invoiceData.gross_total !== null);
    extraction_status = hasCritical ? validStatus : 'needs_review';
  } else if (source === 'whatsapp') {
    extraction_status = invalidStatus || 'wa_quarantine';
  } else {
    extraction_status = 'needs_review';
  }

  invoiceData.extraction_status = extraction_status;

  const { data: updatedInvoice, error: updateError } = await updateNewSalesInvoice(
    invoiceId,
    invoiceData,
    true
  );

  if (updateError) {
    return {
      success: true,
      invoiceId,
      invoice: invoiceData as SalesInvoice,
      validation,
      extractedData: extracted as unknown as Record<string, unknown>,
      error: updateError,
    };
  }

  const remarks = buildSalesRemarks(invoiceId, validation);
  if (remarks.length > 0) {
    await createSalesRemarks(remarks, true);
  }

  return {
    success: true,
    invoiceId,
    invoice: updatedInvoice,
    validation,
    extractedData: extracted as unknown as Record<string, unknown>,
    error: null,
  };
}
