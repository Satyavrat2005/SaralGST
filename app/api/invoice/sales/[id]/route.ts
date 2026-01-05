import { NextRequest, NextResponse } from 'next/server';
import {
  getSalesInvoiceById,
  getSalesRemarks,
  updateSalesInvoice,
  deleteSalesInvoice,
} from '@/lib/services/salesInvoiceService';

/**
 * GET /api/invoice/sales/[id]
 * Fetch a single sales invoice with its remarks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: invoice, error: invoiceError } = await getSalesInvoiceById(id);

    if (invoiceError) {
      return NextResponse.json(
        { error: `Failed to fetch invoice: ${invoiceError}` },
        { status: 500 }
      );
    }

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Fetch remarks for this invoice
    const { data: remarks, error: remarksError } = await getSalesRemarks(id);

    return NextResponse.json({
      success: true,
      invoice,
      remarks: remarks || [],
    });

  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoice/sales/[id]
 * Update a sales invoice
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    // Remove generated column if present
    const { total_invoice_value, ...dataToSave } = updates;

    const { data, error } = await updateSalesInvoice(id, dataToSave, true);

    if (error) {
      return NextResponse.json(
        { error: `Failed to update invoice: ${error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice: data,
    });

  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoice/sales/[id]
 * Delete a sales invoice
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { success, error } = await deleteSalesInvoice(id, true);

    if (error || !success) {
      return NextResponse.json(
        { error: `Failed to delete invoice: ${error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
