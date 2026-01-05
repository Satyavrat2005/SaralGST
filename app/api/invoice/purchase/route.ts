import { NextRequest, NextResponse } from 'next/server';
import {
  getPurchaseInvoices,
  getPurchaseInvoiceById,
  getPurchaseRemarks,
  deletePurchaseInvoice,
} from '@/lib/services/purchaseInvoiceService';

/**
 * GET /api/invoice/purchase
 * Fetch all purchase invoices with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      source: searchParams.get('source') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      vendor: searchParams.get('vendor') || undefined,
    };

    const { data, error } = await getPurchaseInvoices(filters);

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch invoices: ${error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoices: data || [],
      count: data?.length || 0,
    });

  } catch (error: any) {
    console.error('Error fetching purchase invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
