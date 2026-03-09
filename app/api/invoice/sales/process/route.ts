import { NextRequest, NextResponse } from 'next/server';
import {
  uploadSalesInvoice,
  createNewSalesInvoice,
  updateNewSalesInvoice,
  SalesInvoice,
} from '@/lib/services/salesInvoiceService';
import { extractSalesInvoiceWithGemini } from '@/lib/services/geminiSalesExtractionService';

/**
 * POST /api/invoice/sales/process
 * Upload PDF/image → Gemini extracts structured data → save to sales_invoices table
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
    const invoiceData: Partial<SalesInvoice> = {
      // Basic Invoice Information
      invoice_date: extracted.invoice_date,
      voucher_type: extracted.voucher_type,
      invoice_number: extracted.invoice_number,
      invoice_type: extracted.invoice_type,

      // Customer Details
      customer_name: extracted.customer_name,
      customer_gstin: extracted.customer_gstin,
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

    return NextResponse.json({
      success: true,
      invoiceId,
      invoice: updatedInvoice,
      message:
        invoiceData.extraction_status === 'extracted'
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


