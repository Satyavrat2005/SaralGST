import { NextRequest, NextResponse } from 'next/server';
import { getSalesInvoices } from '@/lib/services/salesInvoiceService';

/**
 * GET /api/invoice/sales
 * Fetch all sales invoices
 */
export async function GET(request: NextRequest) {
  try {
    const { data: invoices, error } = await getSalesInvoices(false);

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch sales invoices: ${error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoices: invoices || [],
      count: invoices?.length || 0,
    });

  } catch (error: any) {
    console.error('Error fetching sales invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
