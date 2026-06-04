import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { verifyOpenWAWebhookSignature } from '@/lib/services/openwaService';
import {
  parseOpenWAOrLegacyPayload,
  handleInboundMessage,
} from '@/lib/services/whatsappInboundHandler';

/**
 * POST /api/whatsapp/webhook
 *
 * Inbound endpoint for OpenWA `message.received` events (and legacy Slide-shaped payloads).
 * Acknowledges fast, processes in `after()`.
 */
export async function POST(request: NextRequest) {
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error('[whatsapp/webhook] WHATSAPP_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  let payload: Record<string, unknown>;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const openwaSecret = process.env.OPENWA_WEBHOOK_SECRET;
  const signatureHeader =
    request.headers.get('x-webhook-signature') ||
    request.headers.get('x-openwa-signature') ||
    request.headers.get('x-hub-signature-256');

  const hmacOk =
    openwaSecret &&
    signatureHeader &&
    verifyOpenWAWebhookSignature(rawBody, signatureHeader, openwaSecret);

  const providedSecret =
    request.headers.get('x-webhook-secret') ||
    request.headers.get('x-slide-signature') ||
    new URL(request.url).searchParams.get('secret');

  const secretOk = providedSecret === expectedSecret;

  if (!hmacOk && !secretOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = parseOpenWAOrLegacyPayload(payload);

  console.log('[whatsapp/webhook] Received', {
    event: parsed.event,
    sender: parsed.senderPhone,
    replyChatId: parsed.replyChatId,
    type: parsed.hasMedia ? 'media' : 'text',
    bodyPreview: parsed.messageBody?.slice(0, 40),
    hasFileUrl: Boolean(parsed.fileUrl),
  });

  if (parsed.event && parsed.event !== 'message.received') {
    return NextResponse.json({ success: true, message: 'Event ignored' });
  }

  if (!parsed.senderPhone) {
    return NextResponse.json({ success: true, message: 'No sender' });
  }

  if (!parsed.hasMedia && !parsed.isTextOnly) {
    return NextResponse.json({
      success: true,
      message: 'No actionable message',
    });
  }

  after(() => handleInboundMessage(parsed));

  return NextResponse.json({ success: true, message: 'Received, processing…' });
}
