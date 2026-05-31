import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  uploadSalesInvoice,
  createNewSalesInvoice,
  updateNewSalesInvoice,
  createSalesRemarks,
  SalesInvoice,
} from '@/lib/services/salesInvoiceService';
import { extractSalesInvoiceWithGemini } from '@/lib/services/geminiSalesExtractionService';
import { isValidGstin, normalizeGstin } from '@/lib/gstr1/utils';

/**
 * POST /api/invoice/sales/process
 * Upload PDF/image → Gemini extracts structured data → save to sales_invoices table
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10 MB limit.' },
        { status: 400 }
      );
    }

    // ── Step 1: Upload file to Supabase Storage ──────────────────────────────
    const { data: uploadData, error: uploadError } = await uploadSalesInvoice(file, true);
    if (uploadError || !uploadData) {
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError}` },
        { status: 500 }
      );
    }

    // ── Step 2: Create a placeholder record so we have an ID immediately ─────
    const { data: placeholder, error: createError } = await createNewSalesInvoice(
      {
        user_id: user?.id,
        invoice_file_url: uploadData.url,
        extraction_status: 'pending',
      },
      true
    );

    if (createError || !placeholder) {
      return NextResponse.json(
        { error: `Failed to create invoice record: ${createError}` },
        { status: 500 }
      );
    }

    const invoiceId = placeholder.id!;

    // ── Step 3: Convert file to Buffer and call Gemini ────────────────────────
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { data: extracted, error: geminiError } = await extractSalesInvoiceWithGemini(
      fileBuffer,
      file.type
    );

    if (geminiError || !extracted) {
      // Update status so user sees it needs manual review
      await updateNewSalesInvoice(invoiceId, { extraction_status: 'needs_review' }, true);
      return NextResponse.json({
        success: true,
        invoiceId,
        message: 'Invoice uploaded but AI extraction failed. Please fill in the details manually.',
        invoice: placeholder,
      });
    }

    // ── Step 4: Map extracted data → SalesInvoice row ────────────────────────
    const customerGstin = normalizeGstin(extracted.customer_gstin);
    let invoiceType = extracted.invoice_type;
    if (invoiceType === 'B2B' && !isValidGstin(customerGstin)) {
      invoiceType = 'B2C Small';
    }

    const invoiceData: Partial<SalesInvoice> = {
      user_id: user?.id,
      // Basic Invoice Information
      invoice_date: extracted.invoice_date,
      voucher_type: extracted.voucher_type,
      invoice_number: extracted.invoice_number,
      invoice_type: invoiceType,

      // Customer Details
      customer_name: extracted.customer_name,
      customer_gstin: customerGstin,
      place_of_supply: extracted.place_of_supply,

      // Product & Pricing
      hsn_sac_code: extracted.hsn_sac_code,
      quantity: extracted.quantity,
      uqc: extracted.uqc,
      rate: extracted.rate,

      // Financial & Tax Breakdown
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

      // Advanced Compliance
      reverse_charge: extracted.reverse_charge,
      eway_bill_number: extracted.eway_bill_number,
      irn: extracted.irn,

      // Processing metadata
      invoice_file_url: uploadData.url,
      gemini_raw_json: extracted,
      extraction_status: determineExtractionStatus(extracted),
    };

    const validation = validateSalesInvoice(invoiceData);

    // ── Step 5: Update the placeholder record with extracted data ─────────────
    const { data: updatedInvoice, error: updateError } = await updateNewSalesInvoice(
      invoiceId,
      invoiceData,
      true
    );

    if (updateError) {
      console.error('[ProcessRoute] Update failed:', updateError);
      // Return partial success — data extracted but DB update failed
      return NextResponse.json({
        success: true,
        invoiceId,
        invoice: invoiceData,
        message: 'Data extracted but could not save to database. Please retry.',
      });
    }

    const remarks = buildSalesRemarks(invoiceId, validation);
    if (remarks.length > 0) {
      const { error: remarkError } = await createSalesRemarks(remarks, true);
      if (remarkError) {
        console.warn('[ProcessRoute] Could not save sales remarks:', remarkError);
      }
    }

    return NextResponse.json({
      success: true,
      invoiceId,
      invoice: updatedInvoice,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        missingFields: getMissingSalesFields(invoiceData),
      },
      message:
        validation.isValid
          ? `Invoice processed: ${invoiceData.invoice_number || invoiceId}`
          : 'Invoice uploaded with some missing fields. Please review.',
    });
  } catch (error: any) {
    console.error('[ProcessRoute] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Decide extraction_status based on which critical fields were found.
 */
function determineExtractionStatus(
  data: Partial<{
    invoice_number: string | null;
    invoice_date: string | null;
    taxable_value: number | null;
    gross_total: number | null;
  }>
): SalesInvoice['extraction_status'] {
  const hasCritical =
    data.invoice_number &&
    data.invoice_date &&
    (data.taxable_value !== null || data.gross_total !== null);
  return hasCritical ? 'extracted' : 'needs_review';
}

function getMissingSalesFields(invoice: Partial<SalesInvoice>): string[] {
  const missing: string[] = [];

  if (!invoice.invoice_number) missing.push('Invoice Number');
  if (!invoice.invoice_date) missing.push('Invoice Date');
  if (!invoice.invoice_type) missing.push('Invoice Type');
  if (!invoice.customer_name) missing.push('Customer Name');
  if (!invoice.place_of_supply) missing.push('Place of Supply');
  if (invoice.taxable_value === null || invoice.taxable_value === undefined) missing.push('Taxable Value');
  if (!invoice.hsn_sac_code) missing.push('HSN/SAC Code');
  if (!invoice.invoice_file_url) missing.push('Invoice File');

  return missing;
}

function validateSalesInvoice(invoice: Partial<SalesInvoice>) {
  const missingFields = getMissingSalesFields(invoice);
  const warnings: Array<{ field: string; message: string }> = [];

  if (invoice.invoice_type === 'B2B' && !invoice.customer_gstin) {
    missingFields.push('Customer GSTIN');
  }

  if (invoice.gross_total === null || invoice.gross_total === undefined) {
    warnings.push({ field: 'gross_total', message: 'Gross total could not be confirmed from the extracted data.' });
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
  };
}

function buildSalesRemarks(
  salesId: string,
  validation: ReturnType<typeof validateSalesInvoice>
) {
  const remarks: Array<{
    sales_id: string;
    field_name: string;
    issue_type: 'missing' | 'mismatch' | 'invalid' | 'low_confidence';
    detected_value: string | null;
    expected_value: string | null;
    comment: string;
    status: 'open';
  }> = validation.errors.map((error) => ({
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


