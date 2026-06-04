import { NextResponse } from 'next/server';
import { isWhatsAppConfigured } from '@/lib/services/whatsappService';

/**
 * GET /api/whatsapp/config
 * Lightweight, non-secret config for the dashboard WhatsApp tab: which number
 * invoices should be sent to, and whether the integration is wired up.
 */
export async function GET() {
  return NextResponse.json({
    configured: isWhatsAppConfigured(),
    businessNumber: (process.env.WHATSAPP_BUSINESS_NUMBER || '').trim() || null,
    webhookConfigured: Boolean(process.env.WHATSAPP_WEBHOOK_SECRET),
  });
}
