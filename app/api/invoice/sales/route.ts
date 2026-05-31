import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
/**
 * GET /api/invoice/sales
 * Fetch sales invoices for the authenticated user (plus legacy unassigned rows).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: invoices, error } = await supabase
      .from('sales_invoices')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('invoice_date', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch sales invoices: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoices: invoices || [],
      count: invoices?.length || 0,
    });
  } catch (error: unknown) {
    console.error('Error fetching sales invoices:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
