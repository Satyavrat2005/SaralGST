import { NextRequest, NextResponse } from 'next/server';
import { isWhatsAppConfigured } from '@/lib/services/whatsappService';

/**
 * WhatsApp (Evolution API) setup helper.
 *
 * GET  /api/whatsapp/setup          → report instance connection state.
 * POST /api/whatsapp/setup          → register our webhook on the Evolution
 *                                      instance so inbound messages reach us.
 *
 * This saves you from running curl by hand. It needs:
 *   EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, WHATSAPP_WEBHOOK_SECRET
 * and a publicly reachable base URL for the webhook (so Evolution can call us).
 *
 * POST body (optional):
 *   { "publicUrl": "https://your-domain.com" }
 * If omitted, we derive the origin from the request — fine in production, but
 * useless on localhost (Evolution can't reach localhost), so pass a tunnel URL
 * (ngrok/cloudflared) during local testing.
 */

const evoHeaders = () => ({
  'Content-Type': 'application/json',
  apikey: process.env.EVOLUTION_API_KEY as string,
});

const base = () => (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
const instance = () => process.env.EVOLUTION_INSTANCE || '';

export async function GET() {
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { configured: false, error: 'Set EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE.' },
      { status: 503 }
    );
  }

  try {
    const [stateRes, webhookRes] = await Promise.all([
      fetch(`${base()}/instance/connectionState/${instance()}`, { headers: evoHeaders() }),
      fetch(`${base()}/webhook/find/${instance()}`, { headers: evoHeaders() }),
    ]);

    const state = stateRes.ok ? await stateRes.json() : null;
    const webhook = webhookRes.ok ? await webhookRes.json() : null;

    return NextResponse.json({
      configured: true,
      instance: instance(),
      connectionState: state?.instance?.state || state?.state || 'unknown',
      webhook,
    });
  } catch (err: any) {
    return NextResponse.json({ configured: true, error: err.message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: 'Set EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE.' },
      { status: 503 }
    );
  }

  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'WHATSAPP_WEBHOOK_SECRET is not set — refusing to register an unauthenticated webhook.' },
      { status: 500 }
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    /* optional body */
  }

  const origin = (body?.publicUrl || new URL(request.url).origin).replace(/\/$/, '');
  const webhookUrl = `${origin}/api/whatsapp/webhook?secret=${encodeURIComponent(secret)}`;

  try {
    // Evolution v2 webhook config (nested `webhook` object). `base64: true` makes
    // Evolution inline media bytes in the event so we don't need a second call.
    const res = await fetch(`${base()}/webhook/set/${instance()}`, {
      method: 'POST',
      headers: evoHeaders(),
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          webhookByEvents: false,
          base64: true,
          events: ['MESSAGES_UPSERT'],
        },
      }),
    });

    const text = await res.text();
    let parsed: any = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* raw text */
    }

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Evolution webhook/set failed (${res.status})`, details: parsed, webhookUrl },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook registered on Evolution instance.',
      webhookUrl,
      response: parsed,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, webhookUrl }, { status: 502 });
  }
}
