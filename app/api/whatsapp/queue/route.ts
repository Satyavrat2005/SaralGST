import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/services/purchaseInvoiceService';

/**
 * GET /api/whatsapp/queue
 * Purchase + sales invoices held from WhatsApp (quarantine / needs review).
 */
export async function GET() {
  try {
    const [purchaseQuarantine, purchaseReview, salesQuarantine, salesReview] =
      await Promise.all([
        supabaseAdmin
          .from('purchase_register')
          .select('*')
          .eq('source', 'whatsapp')
          .eq('invoice_status', 'wa_quarantine')
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('purchase_register')
          .select('*')
          .eq('source', 'whatsapp')
          .eq('invoice_status', 'needs_review')
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('sales_invoices')
          .select('*')
          .eq('source', 'whatsapp')
          .eq('extraction_status', 'wa_quarantine')
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('sales_invoices')
          .select('*')
          .eq('source', 'whatsapp')
          .eq('extraction_status', 'needs_review')
          .order('created_at', { ascending: false }),
      ]);

    type QueueRow = Record<string, unknown> & {
      register: 'purchase' | 'sales';
      created_at?: string;
    };

    const mapSales = (rows: Record<string, unknown>[] | null): QueueRow[] =>
      (rows || []).map((r) => ({
        ...r,
        register: 'sales' as const,
        invoice_status: r.extraction_status,
        supplier_name: r.customer_name,
      }));

    const mapPurchase = (rows: Record<string, unknown>[] | null): QueueRow[] =>
      (rows || []).map((r) => ({ ...r, register: 'purchase' as const }));

    const combined: QueueRow[] = [
      ...mapPurchase(purchaseQuarantine.data),
      ...mapPurchase(purchaseReview.data),
      ...mapSales(salesQuarantine.data),
      ...mapSales(salesReview.data),
    ].sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    return NextResponse.json({ success: true, invoices: combined });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
