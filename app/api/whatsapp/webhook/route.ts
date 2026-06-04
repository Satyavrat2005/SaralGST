import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import {
  processInvoiceFile,
  ALLOWED_INVOICE_MIME_TYPES,
} from '@/lib/services/invoicePipeline';
import {
  updatePurchaseInvoice,
  findWhatsAppIntake,
  upsertWhatsAppIntake,
} from '@/lib/services/purchaseInvoiceService';
import {
  sendWhatsAppMessage,
  downloadEvolutionMedia,
  composeConfirmationMessage,
  composeRejectionMessageWithAI,
} from '@/lib/services/whatsappService';

/**
 * POST /api/whatsapp/webhook
 *
 * Inbound endpoint Evolution API calls (event `messages.upsert`) when a vendor
 * sends a message to our WhatsApp Business number. Responsibilities:
 *   1. Verify a shared secret.
 *   2. Ack fast (200) so Evolution doesn't retry/time out.
 *   3. Process in the background (`after`): pull media bytes → run the shared
 *      pipeline → branch valid / invalid → reply on WhatsApp.
 *
 * Only invoices that PASS validation are promoted to `extracted` (visible in the
 * dashboard). Failures stay in `wa_quarantine` (hidden) and trigger a correction
 * request. After too many failed attempts the invoice escalates to `needs_review`.
 *
 * SECURITY: Evolution lets you set the webhook URL freely, so configure it as
 *   https://<your-domain>/api/whatsapp/webhook?secret=<WHATSAPP_WEBHOOK_SECRET>
 * (the `apikey` header == EVOLUTION_API_KEY is also accepted as an auth fallback).
 */

// Run on the Node runtime and allow up to 60s — the background worker downloads
// media, runs Gemini extraction (with retries) and replies, which can exceed
// the default serverless timeout. (Vercel caps this to your plan's limit.)
export const runtime = 'nodejs';
export const maxDuration = 60;

// After this many failed attempts, stop auto-rejecting and ask a human to look.
const MAX_INTAKE_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  // ── 1. Verify shared secret ────────────────────────────────────────────────
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error('[whatsapp/webhook] WHATSAPP_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const providedSecret =
    request.headers.get('x-webhook-secret') ||
    new URL(request.url).searchParams.get('secret');
  const apiKeyHeader = request.headers.get('apikey');

  const authorized =
    providedSecret === expectedSecret ||
    (Boolean(process.env.EVOLUTION_API_KEY) && apiKeyHeader === process.env.EVOLUTION_API_KEY);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Parse payload ───────────────────────────────────────────────────────
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = parseEvolutionEvent(payload);
  if (!parsed || !parsed.senderPhone || !parsed.hasMedia) {
    // Nothing actionable (e.g. a plain text message, a status update, or an
    // event we don't care about). Ack so Evolution doesn't retry.
    return NextResponse.json({
      success: true,
      message: 'No invoice attachment found; nothing to process.',
    });
  }

  // ── 3. Ack fast, process in the background ─────────────────────────────────
  after(() => handleInboundInvoice(parsed));

  return NextResponse.json({ success: true, message: 'Received, validating…' });
}

interface ParsedInbound {
  senderPhone: string;
  base64: string | null; // inline base64 if the webhook included it (instance base64:true)
  rawMessage: any; // full `data` object — used to fetch media via getBase64 fallback
  mimeType: string;
  fileName: string;
  hasMedia: boolean;
}

/**
 * Extract the sender + media from an Evolution `messages.upsert` webhook event.
 * Evolution may deliver `data` as a single message object or (rarely) an array;
 * we handle the single-object case and ignore everything that isn't an inbound
 * document/image from a 1:1 chat.
 */
function parseEvolutionEvent(payload: any): ParsedInbound | null {
  // Normalise event name across versions: "messages.upsert" / "MESSAGES_UPSERT".
  const event = String(payload?.event || '').toLowerCase().replace(/_/g, '.');
  if (event && event !== 'messages.upsert') return null;

  // `data` carries the message; some setups wrap it in an array.
  const data = Array.isArray(payload?.data) ? payload.data[0] : payload?.data || payload;
  if (!data) return null;

  const key = data.key || {};
  const remoteJid: string = key.remoteJid || '';

  // Ignore our own outbound echoes, group chats, and status broadcasts.
  if (key.fromMe) return null;
  if (remoteJid.endsWith('@g.us') || remoteJid.includes('broadcast')) return null;

  const senderPhone = remoteJid.split('@')[0] || '';

  // Locate a document or image node (document can be nested under a caption msg).
  const message = data.message || {};
  const mediaNode =
    message.documentMessage ||
    message.documentWithCaptionMessage?.message?.documentMessage ||
    message.imageMessage ||
    null;

  if (!mediaNode) {
    // Not a media message — nothing to process.
    return { senderPhone, base64: null, rawMessage: data, mimeType: '', fileName: '', hasMedia: false };
  }

  const mimeType = String(mediaNode.mimetype || '').toLowerCase();
  const fileName = mediaNode.fileName || mediaNode.title || 'invoice';

  // If the instance is configured with base64:true, Evolution inlines the bytes;
  // otherwise we fetch them in the worker via getBase64FromMediaMessage.
  const base64 = message.base64 || data.base64 || mediaNode.base64 || null;

  return {
    senderPhone,
    base64,
    rawMessage: data,
    mimeType,
    fileName,
    hasMedia: true,
  };
}

const EXT_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

function resolveMimeType(parsed: ParsedInbound): string {
  if (parsed.mimeType && ALLOWED_INVOICE_MIME_TYPES.includes(parsed.mimeType)) {
    return parsed.mimeType;
  }
  const ext = parsed.fileName.split('.').pop()?.toLowerCase() || '';
  return EXT_TO_MIME[ext] || parsed.mimeType || 'application/octet-stream';
}

function ensureFileName(name: string, mimeType: string): string {
  if (name.includes('.')) return name;
  const ext = Object.entries(EXT_TO_MIME).find(([, m]) => m === mimeType)?.[0] || 'bin';
  return `${name}.${ext}`;
}

/**
 * Background worker: pull the media bytes, run the pipeline, branch on validity,
 * and reply to the vendor over WhatsApp.
 */
async function handleInboundInvoice(parsed: ParsedInbound): Promise<void> {
  const { senderPhone } = parsed;
  try {
    // ── a. Materialise the file (inline base64 or fetch from Evolution). ──────
    let base64 = parsed.base64;
    let mimeType = parsed.mimeType;
    let fileName = parsed.fileName;

    if (!base64) {
      const media = await downloadEvolutionMedia(parsed.rawMessage);
      if (!media) {
        await sendWhatsAppMessage(senderPhone, {
          body:
            "⚠️ We couldn't download this invoice. Please make sure it's a clear PDF or photo and resend. 🙏",
        });
        return;
      }
      base64 = media.base64;
      if (media.mimetype) mimeType = media.mimetype.toLowerCase();
      if (media.fileName) fileName = media.fileName;
    }

    const resolvedMime = resolveMimeType({ ...parsed, mimeType, fileName });
    fileName = ensureFileName(fileName, resolvedMime);

    if (!ALLOWED_INVOICE_MIME_TYPES.includes(resolvedMime)) {
      await sendWhatsAppMessage(senderPhone, {
        body:
          '⚠️ We could only accept PDF, JPG or PNG invoices. Please resend your invoice as one of these. 🙏',
      });
      return;
    }

    // Strip any data-URL prefix before decoding.
    const clean = (base64 || '').replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(clean, 'base64');
    if (!buffer.length) {
      await sendWhatsAppMessage(senderPhone, {
        body:
          "⚠️ We couldn't read this invoice. Please make sure it's a clear PDF or photo and resend. 🙏",
      });
      return;
    }

    const file = new File([buffer], fileName, { type: resolvedMime });

    // ── b. Look up prior attempts for this sender to drive escalation. ───────
    // (invoice_number isn't known until after extraction; we re-correlate below
    //  once we have it. This first lookup catches unreadable resends.)
    const priorByPhone = await findWhatsAppIntake(senderPhone, null);
    const priorAttempts = priorByPhone.data?.attempt_count || 0;

    // ── c. Run the shared pipeline. Failures stay quarantined (hidden). ──────
    const result = await processInvoiceFile(file, 'whatsapp', {
      validStatus: 'extracted',
      invalidStatus: 'wa_quarantine',
      checkDuplicates: true,
      waSenderPhone: senderPhone,
      waAttemptCount: priorAttempts + 1,
    });

    if (!result.success) {
      // Hard pipeline failure (couldn't read the file at all).
      await recordIntake(senderPhone, null, priorAttempts + 1, 'rejected', result.error, result.invoiceId);
      await sendWhatsAppMessage(senderPhone, {
        body:
          "⚠️ We couldn't read this invoice. Please make sure it's a clear PDF or photo and resend. 🙏",
      });
      return;
    }

    const invoiceNumber = result.extractedData?.invoice_number || null;
    const validation = result.validation!;

    // Re-correlate using the (now known) invoice number to count THIS invoice's
    // attempts more precisely.
    const priorByInvoice = invoiceNumber
      ? await findWhatsAppIntake(senderPhone, invoiceNumber)
      : { data: null };
    const attemptCount = (priorByInvoice.data?.attempt_count || priorAttempts) + 1;

    // ── d. VALID → promote & confirm. ────────────────────────────────────────
    if (validation.isValid) {
      await recordIntake(senderPhone, invoiceNumber, attemptCount, 'validated', null, result.invoiceId);
      await sendWhatsAppMessage(senderPhone, {
        body: composeConfirmationMessage(invoiceNumber),
      });
      return;
    }

    // ── e. INVALID → decide: ask to resend, or escalate to manual review. ────
    const willEscalate = attemptCount >= MAX_INTAKE_ATTEMPTS;

    if (willEscalate) {
      // Stop auto-rejecting a genuinely odd-but-maybe-valid invoice.
      await updatePurchaseInvoice(
        result.invoiceId,
        { invoice_status: 'needs_review', wa_attempt_count: attemptCount },
        true
      );
    } else {
      await updatePurchaseInvoice(
        result.invoiceId,
        { wa_attempt_count: attemptCount },
        true
      );
    }

    const errorSummary = validation.errors.map((e) => e.message).join('; ');
    await recordIntake(
      senderPhone,
      invoiceNumber,
      attemptCount,
      willEscalate ? 'needs_review' : 'rejected',
      errorSummary,
      result.invoiceId
    );

    const message = await composeRejectionMessageWithAI(
      validation.errors,
      result.extractedData || {},
      { invoiceNumber, willEscalate }
    );
    await sendWhatsAppMessage(senderPhone, { body: message });
  } catch (err: any) {
    console.error('[whatsapp/webhook] Error processing inbound invoice:', err);
    // Best-effort apology so the vendor isn't left hanging.
    await sendWhatsAppMessage(senderPhone, {
      body:
        '⚠️ Something went wrong processing your invoice on our side. Please try resending shortly. 🙏',
    }).catch(() => {});
  }
}

/** Upsert the intake row that tracks attempts for the correction loop. */
async function recordIntake(
  senderPhone: string,
  invoiceNumber: string | null,
  attemptCount: number,
  status: 'pending' | 'validated' | 'rejected' | 'needs_review',
  errorSummary: string | null | undefined,
  linkedPurchaseId: string | null
): Promise<void> {
  const existing = await findWhatsAppIntake(senderPhone, invoiceNumber);
  await upsertWhatsAppIntake({
    id: existing.data?.id,
    sender_phone: senderPhone,
    invoice_number: invoiceNumber,
    attempt_count: attemptCount,
    last_status: status,
    last_error_summary: errorSummary || null,
    linked_purchase_id: linkedPurchaseId,
  });
}
