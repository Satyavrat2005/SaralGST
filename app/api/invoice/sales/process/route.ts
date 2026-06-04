import { NextRequest, NextResponse } from 'next/server';
import {
  processSalesInvoiceFile,
  ALLOWED_SALES_MIME_TYPES,
  MAX_SALES_FILE_SIZE,
} from '@/lib/services/salesInvoicePipeline';

/**
 * POST /api/invoice/sales/process
 * Upload PDF/image → Gemini → structured JSON → save to sales_invoices
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_SALES_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SALES_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10 MB limit.' },
        { status: 400 }
      );
    }

    const result = await processSalesInvoiceFile(file, 'manual');

    if (!result.success && !result.invoiceId) {
      return NextResponse.json(
        { error: result.error || 'Failed to process invoice' },
        { status: 500 }
      );
    }

    if (!result.success) {
      return NextResponse.json({
        success: true,
        invoiceId: result.invoiceId,
        message:
          result.error?.includes('API key') || result.error?.includes('Gemini')
            ? 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file.'
            : 'Invoice uploaded but extraction failed. Please fill in the details manually.',
        invoice: result.invoice,
        extractionError: result.error,
      });
    }

    const validation = result.validation!;

    return NextResponse.json({
      success: true,
      invoiceId: result.invoiceId,
      invoice: result.invoice,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        missingFields: validation.missingFields,
      },
      message: validation.isValid
        ? `Invoice processed successfully: ${result.invoice?.invoice_number || result.invoiceId}`
        : 'Invoice uploaded with some missing fields. Please review.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[ProcessRoute] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}
