import { NextRequest, NextResponse } from 'next/server';
import {
  getPurchaseInvoiceById,
  getPurchaseRemarks,
  updatePurchaseInvoice,
  deletePurchaseInvoice,
} from '@/lib/services/purchaseInvoiceService';

/**
 * GET /api/invoice/purchase/[id]
 * Fetch a single purchase invoice with its remarks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const { data: invoice, error: invoiceError } = await getPurchaseInvoiceById(id);

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
    const { data: remarks, error: remarksError } = await getPurchaseRemarks(id);

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
 * PATCH /api/invoice/purchase/[id]
 * Update a purchase invoice
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updates = await request.json();

    const { data, error } = await updatePurchaseInvoice(id, updates);

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
 * DELETE /api/invoice/purchase/[id]
 * Delete a purchase invoice
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const { success, error } = await deletePurchaseInvoice(id);

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
