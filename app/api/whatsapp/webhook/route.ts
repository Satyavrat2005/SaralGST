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
  composeConfirmationMessage,
  composeRejectionMessageWithAI,
} from '@/lib/services/whatsappService';

/**
 * POST /api/whatsapp/webhook
 *
 * Inbound endpoint Slide (Synquic) calls when a vendor sends an invoice to our
 * WhatsApp Business number. Responsibilities:
 *   1. Verify a shared secret.
 *   2. Ack fast (200) so Slide doesn't retry/time out.
 *   3. Process in the background (`after`): download media → run the shared
 *      pipeline → branch valid / invalid → reply on WhatsApp.
 *
 * Only invoices that PASS validation are promoted to `extracted` (visible in the
 * dashboard). Failures stay in `wa_quarantine` (hidden) and trigger a correction
 * request. After too many failed attempts the invoice escalates to `needs_review`.
 *
 * NOTE: the Slide payload shape (§6 of the plan) is not yet confirmed, so the
 * parser below is defensive and accepts several common field names. Tighten it
 * once the real shape is known.
 */

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
    request.headers.get('x-slide-signature') ||
    new URL(request.url).searchParams.get('secret');

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Parse payload ───────────────────────────────────────────────────────
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = parseInboundPayload(payload);
  if (!parsed.senderPhone || (!parsed.fileUrl && !parsed.base64)) {
    // Nothing actionable (e.g. a plain text message with no attachment). Ack so
    // Slide doesn't retry; nothing to process.
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
  fileUrl: string | null;
  base64: string | null;
  mimeType: string;
  fileName: string;
}

/**
 * Extract the sender + attachment from Slide's webhook body. Accepts a few
 * common field-name variants so we don't have to guess the exact shape.
 */
function parseInboundPayload(p: any): ParsedInbound {
  const senderPhone =
    p?.from || p?.sender || p?.sender_phone || p?.phone || p?.wa_id || p?.contact?.phone || '';

  // Attachment can arrive as a download URL or inline base64; field names vary.
  const media = p?.media || p?.attachment || p?.file || p?.document || p || {};

  const fileUrl =
    media?.media_url || media?.url || media?.link || p?.media_url || p?.file_url || null;

  const base64 =
    media?.data || media?.base64 || media?.bytes || p?.file_base64 || null;

  const mimeType =
    media?.mime_type || media?.mimeType || media?.content_type || p?.mime_type || '';

  const fileName =
    media?.filename || media?.file_name || media?.name || p?.filename || '';

  return {
    senderPhone: String(senderPhone || '').trim(),
    fileUrl,
    base64,
    mimeType: String(mimeType || '').toLowerCase(),
    fileName: fileName || 'invoice',
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
 * Background worker: download the media, run the pipeline, branch on validity,
 * and reply to the vendor over WhatsApp.
 */
async function handleInboundInvoice(parsed: ParsedInbound): Promise<void> {
  const { senderPhone } = parsed;
  try {
    // ── a. Materialise the file (download URL or decode base64). ─────────────
    const mimeType = resolveMimeType(parsed);
    const fileName = ensureFileName(parsed.fileName, mimeType);

    let buffer: Buffer;
    if (parsed.fileUrl) {
      const res = await fetch(parsed.fileUrl);
      if (!res.ok) {
        throw new Error(`Failed to download media (${res.status})`);
      }
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      // Strip any data-URL prefix before decoding.
      const clean = (parsed.base64 || '').replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(clean, 'base64');
    }

    if (!ALLOWED_INVOICE_MIME_TYPES.includes(mimeType)) {
      await sendWhatsAppMessage(senderPhone, {
        body:
          '⚠️ We could only accept PDF, JPG or PNG invoices. Please resend your invoice as one of these. 🙏',
      });
      return;
    }

    const file = new File([buffer], fileName, { type: mimeType });

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
