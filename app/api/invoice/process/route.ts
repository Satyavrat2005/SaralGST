import { NextRequest, NextResponse } from 'next/server';
import { PurchaseRegister } from '@/lib/services/purchaseInvoiceService';
import {
  processInvoiceFile,
  ALLOWED_INVOICE_MIME_TYPES,
  MAX_INVOICE_FILE_SIZE,
} from '@/lib/services/invoicePipeline';

/**
 * POST /api/invoice/process
 * Upload and process an invoice through OCR, LLM extraction, validation, and storage.
 *
 * The heavy lifting lives in the shared `processInvoiceFile()` pipeline so that
 * manual uploads and the WhatsApp webhook behave identically.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const source = (formData.get('source') as string) || 'manual';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_INVOICE_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_INVOICE_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const result = await processInvoiceFile(
      file,
      source as PurchaseRegister['source']
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to process invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoiceId: result.invoiceId,
      invoice: result.invoice,
      validation: {
        isValid: result.validation?.isValid ?? false,
        errors: result.validation?.errors ?? [],
        warnings: result.validation?.warnings ?? [],
      },
      message: result.validation?.isValid
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
