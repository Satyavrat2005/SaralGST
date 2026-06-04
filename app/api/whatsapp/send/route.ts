import { NextRequest, NextResponse } from 'next/server';
import {
  sendWhatsAppMessage,
  sendWhatsAppDocument,
  isWhatsAppConfigured,
} from '@/lib/services/whatsappService';

/**
 * POST /api/whatsapp/send
 *
 * Server-side endpoint to send outbound WhatsApp messages/documents to a vendor.
 * Called from app actions like "chase a missing invoice" or when the
 * reconciliation flow finds a discrepancy vs GSTR-2B.
 *
 * Body (one of):
 *   { to, kind: 'request_invoice',  period }
 *   { to, kind: 'discrepancy_found', invoiceNo, detail }
 *   { to, kind: 'message',          body }                // free-form (within 24h window)
 *   { to, kind: 'document',         fileUrl, caption? }
 *
 * Outside the 24h customer-service window, business-initiated messages must use a
 * pre-approved template; pass `template` + `params` to force template mode.
 */

interface SendBody {
  to: string;
  kind: 'request_invoice' | 'discrepancy_found' | 'message' | 'document';
  period?: string;
  invoiceNo?: string;
  detail?: string;
  body?: string;
  fileUrl?: string;
  caption?: string;
  template?: string;
  params?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as SendBody;

    if (!data?.to) {
      return NextResponse.json({ error: '`to` (phone number) is required' }, { status: 400 });
    }

    if (!isWhatsAppConfigured()) {
      return NextResponse.json(
        {
          error:
            'WhatsApp (Evolution) is not configured. Set EVOLUTION_API_URL, EVOLUTION_API_KEY and EVOLUTION_INSTANCE.',
        },
        { status: 503 }
      );
    }

    let result;

    switch (data.kind) {
      case 'request_invoice':
        result = await sendWhatsAppMessage(data.to, {
          template: data.template || 'request_invoice',
          params: data.params || { period: data.period || '' },
          // Free-form fallback for use within the 24h window.
          body: `Hi! We're missing your invoice${
            data.period ? ` for ${data.period}` : ''
          }. Could you please share it here? 🙏`,
        });
        break;

      case 'discrepancy_found':
        result = await sendWhatsAppMessage(data.to, {
          template: data.template || 'discrepancy_found',
          params:
            data.params || {
              invoiceNo: data.invoiceNo || '',
              detail: data.detail || '',
            },
          body: `We found a discrepancy on invoice ${data.invoiceNo || ''}${
            data.detail ? `: ${data.detail}` : ''
          }. Could you please review and clarify/correct? 🙏`,
        });
        break;

      case 'document':
        if (!data.fileUrl) {
          return NextResponse.json(
            { error: '`fileUrl` is required for kind=document' },
            { status: 400 }
          );
        }
        result = await sendWhatsAppDocument(data.to, data.fileUrl, data.caption);
        break;

      case 'message':
      default:
        if (!data.body && !data.template) {
          return NextResponse.json(
            { error: '`body` or `template` is required for kind=message' },
            { status: 400 }
          );
        }
        result = await sendWhatsAppMessage(data.to, {
          body: data.body,
          template: data.template,
          params: data.params,
        });
        break;
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, skipped: result.skipped },
        { status: result.skipped ? 503 : 502 }
      );
    }

    return NextResponse.json({ success: true, response: result.response });
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
