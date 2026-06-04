import { NextResponse } from 'next/server';
import { isWhatsAppConfigured } from '@/lib/services/whatsappService';
import { isOpenWAConfigured, pingOpenWAHealth } from '@/lib/services/openwaService';

/**
 * GET /api/whatsapp/config
 * Non-secret config for the dashboard WhatsApp tab.
 */
export async function GET() {
  const openwaConfigured = isOpenWAConfigured();
  let openwaHealthy = false;
  if (openwaConfigured) {
    openwaHealthy = await pingOpenWAHealth();
  }

  return NextResponse.json({
    configured: isWhatsAppConfigured(),
    openwaConfigured,
    openwaHealthy,
    openwaSessionId: process.env.OPENWA_SESSION_ID || null,
    openwaBaseUrl: process.env.OPENWA_BASE_URL || null,
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || null,
    webhookConfigured: Boolean(process.env.WHATSAPP_WEBHOOK_SECRET),
    businessGstinConfigured: Boolean(process.env.BUSINESS_GSTIN),
  });
}
