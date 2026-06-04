/**
 * Background handlers for inbound WhatsApp invoices (OpenWA webhooks).
 */

import {
  processInvoiceFile,
  ALLOWED_INVOICE_MIME_TYPES,
} from './invoicePipeline';
import {
  updatePurchaseInvoice,
  findWhatsAppIntake,
  upsertWhatsAppIntake,
  type InvoiceKind,
} from './purchaseInvoiceService';
import { processSalesInvoiceFile } from './salesInvoicePipeline';
import { updateNewSalesInvoice } from './salesInvoiceService';
import {
  sendWhatsAppMessage,
  composeConfirmationMessage,
  composeRejectionMessageWithAI,
} from './whatsappService';
import { downloadOpenWAMedia, resolveWhatsAppIdentity } from './openwaService';
import {
  parseKindFromText,
  inferKindFromDocument,
} from './invoiceKindRouter';
import {
  getPendingMedia,
  upsertPendingMedia,
  deletePendingMedia,
} from './whatsappPendingService';

const MAX_INTAKE_ATTEMPTS = 3;

export interface ParsedInbound {
  event: string | null;
  /** Stable key for DB (E.164 when possible). */
  senderPhone: string;
  /** OpenWA chat JID to use for replies (may be @c.us or @lid). */
  replyChatId: string;
  chatId: string;
  messageBody: string;
  fileUrl: string | null;
  base64: string | null;
  mimeType: string;
  fileName: string;
  messageId: string | null;
  hasMedia: boolean;
  isTextOnly: boolean;
  direction?: string;
}

function isOutgoingMessage(parsed: ParsedInbound): boolean {
  if (parsed.direction === 'outgoing') return true;
  const biz = (process.env.WHATSAPP_BUSINESS_NUMBER || '').replace(/\D/g, '');
  if (!biz) return false;
  const fromDigits = parsed.replyChatId.split('@')[0].replace(/\D/g, '');
  return fromDigits === biz || fromDigits.endsWith(biz);
}

const EXT_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

const MEDIA_TYPES = new Set(['document', 'image', 'video', 'ptt', 'audio', 'sticker']);

/** OpenWA may wrap events as `{ payload: { event, data } }`. */
export function normalizeWebhookRoot(raw: Record<string, unknown>): Record<string, unknown> {
  const payload = raw.payload;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return raw;
}

export function parseOpenWAOrLegacyPayload(p: Record<string, unknown>): ParsedInbound {
  const root = normalizeWebhookRoot(p);
  const event = (root.event as string) || null;
  const data = (root.data as Record<string, unknown>) || root;
  const media = (data.media as Record<string, unknown>) || {};

  const chatIdRaw = String(
    data.chatId || data.from || root.from || root.sender || ''
  ).trim();
  const fromRaw = String(
    data.from || data.chatId || root.from || root.sender_phone || root.phone || ''
  ).trim();
  const { replyChatId, senderKey: senderPhone } = resolveWhatsAppIdentity(
    chatIdRaw,
    fromRaw
  );

  const fileUrl =
    (media.url as string) ||
    (media.mediaUrl as string) ||
    (media.downloadUrl as string) ||
    (data.mediaUrl as string) ||
    (data.downloadUrl as string) ||
    (root.media_url as string) ||
    (root.file_url as string) ||
    null;

  const base64 =
    (media.data as string) ||
    (media.base64 as string) ||
    (p.file_base64 as string) ||
    null;

  const mimeType = String(
    data.mimetype || data.mimeType || media.mimeType || p.mime_type || ''
  ).toLowerCase();

  const fileName = String(
    media.filename || data.filename || data.fileName || p.filename || 'invoice'
  );

  const msgType = String(data.type || root.type || '').toLowerCase();
  const hasMediaFlag = data.hasMedia === true || data.hasMedia === 'true';
  const hasMedia = Boolean(
    fileUrl || base64 || MEDIA_TYPES.has(msgType) || hasMediaFlag
  );
  const messageBody = String(
    data.body || data.text || data.caption || root.body || root.text || ''
  ).trim();
  const direction = String(data.direction || root.direction || '').toLowerCase();

  return {
    event,
    senderPhone,
    replyChatId,
    chatId: replyChatId || chatIdRaw,
    messageBody,
    fileUrl,
    base64,
    mimeType,
    fileName,
    messageId:
      (data.messageId as string) ||
      (data.id as string) ||
      (data.waMessageId as string) ||
      null,
    hasMedia,
    isTextOnly: !hasMedia && messageBody.length > 0,
    direction,
  };
}

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

async function materializeFile(parsed: ParsedInbound): Promise<File> {
  const mimeType = resolveMimeType(parsed);
  const fileName = ensureFileName(parsed.fileName, mimeType);

  let buffer: Buffer;
  if (parsed.fileUrl) {
    const isOpenWa =
      parsed.fileUrl.includes('2785') ||
      parsed.fileUrl.includes('/api/') ||
      process.env.OPENWA_BASE_URL &&
        parsed.fileUrl.startsWith(process.env.OPENWA_BASE_URL);
    buffer = isOpenWa
      ? await downloadOpenWAMedia(parsed.fileUrl)
      : Buffer.from(await (await fetch(parsed.fileUrl)).arrayBuffer());
  } else {
    const clean = (parsed.base64 || '').replace(/^data:[^;]+;base64,/, '');
    buffer = Buffer.from(clean, 'base64');
  }

  return new File([buffer], fileName, { type: mimeType });
}

async function recordIntake(
  senderPhone: string,
  invoiceNumber: string | null,
  attemptCount: number,
  status: 'pending' | 'validated' | 'rejected' | 'needs_review' | 'awaiting_kind',
  errorSummary: string | null | undefined,
  kind: InvoiceKind,
  linkedPurchaseId: string | null,
  linkedSalesId: string | null
): Promise<void> {
  const existing = await findWhatsAppIntake(senderPhone, invoiceNumber);
  await upsertWhatsAppIntake({
    id: existing.data?.id,
    sender_phone: senderPhone,
    invoice_number: invoiceNumber,
    invoice_kind: kind,
    attempt_count: attemptCount,
    last_status: status,
    last_error_summary: errorSummary || null,
    linked_purchase_id: linkedPurchaseId,
    linked_sales_id: linkedSalesId,
  });
}

async function handlePurchaseInvoice(
  file: File,
  senderPhone: string,
  replyChatId: string,
  mimeType: string
): Promise<void> {
  const priorByPhone = await findWhatsAppIntake(senderPhone, null);
  const priorAttempts = priorByPhone.data?.attempt_count || 0;

  const result = await processInvoiceFile(file, 'whatsapp', {
    validStatus: 'extracted',
    invalidStatus: 'wa_quarantine',
    checkDuplicates: true,
    waSenderPhone: senderPhone,
    waAttemptCount: priorAttempts + 1,
  });

  if (!result.success) {
    await recordIntake(
      senderPhone,
      null,
      priorAttempts + 1,
      'rejected',
      result.error,
      'purchase',
      result.invoiceId,
      null
    );
      await sendWhatsAppMessage(replyChatId, {
        body:
          "⚠️ We couldn't read this invoice. Please make sure it's a clear PDF or photo and resend. 🙏",
      });
      return;
    }

    const invoiceNumber = result.extractedData?.invoice_number || null;
  const validation = result.validation!;
  const priorByInvoice = invoiceNumber
    ? await findWhatsAppIntake(senderPhone, invoiceNumber)
    : { data: null };
  const attemptCount = (priorByInvoice.data?.attempt_count || priorAttempts) + 1;

  if (validation.isValid) {
    await recordIntake(
      senderPhone,
      invoiceNumber,
      attemptCount,
      'validated',
      null,
      'purchase',
      result.invoiceId,
      null
    );
    const warnings = (validation.warnings || []).map((w) => ({
      message: w.message,
    }));
      await sendWhatsAppMessage(replyChatId, {
        body: composeConfirmationMessage(invoiceNumber, {
          kind: 'purchase',
          warnings,
        }),
      });
      return;
    }

    const willEscalate = attemptCount >= MAX_INTAKE_ATTEMPTS;
  if (willEscalate) {
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
    'purchase',
    result.invoiceId,
    null
  );

  const message = await composeRejectionMessageWithAI(
    validation.errors,
    (result.extractedData || {}) as Record<string, unknown>,
    {
      invoiceNumber,
      willEscalate,
      kind: 'purchase',
      warnings: validation.warnings,
    }
  );
  await sendWhatsAppMessage(replyChatId, { body: message });
}

async function handleSalesInvoice(
  file: File,
  senderPhone: string,
  replyChatId: string
): Promise<void> {
  const priorByPhone = await findWhatsAppIntake(senderPhone, null);
  const priorAttempts = priorByPhone.data?.attempt_count || 0;

  const result = await processSalesInvoiceFile(file, 'whatsapp', {
    validStatus: 'extracted',
    invalidStatus: 'wa_quarantine',
    waSenderPhone: senderPhone,
    waAttemptCount: priorAttempts + 1,
  });

  if (!result.success) {
    await recordIntake(
      senderPhone,
      null,
      priorAttempts + 1,
      'rejected',
      result.error,
      'sales',
      null,
      result.invoiceId || null
    );
    await sendWhatsAppMessage(replyChatId, {
      body:
        "⚠️ We couldn't read this sales invoice. Please resend a clear PDF or photo. 🙏",
    });
    return;
  }

  const invoiceNumber =
    (result.extractedData?.invoice_number as string) || result.invoice?.invoice_number || null;
  const validation = result.validation!;
  const priorByInvoice = invoiceNumber
    ? await findWhatsAppIntake(senderPhone, invoiceNumber)
    : { data: null };
  const attemptCount = (priorByInvoice.data?.attempt_count || priorAttempts) + 1;

  if (validation.isValid) {
    await recordIntake(
      senderPhone,
      invoiceNumber,
      attemptCount,
      'validated',
      null,
      'sales',
      null,
      result.invoiceId
    );
    await sendWhatsAppMessage(replyChatId, {
      body: composeConfirmationMessage(invoiceNumber, {
        kind: 'sales',
        warnings: validation.warnings,
      }),
    });
    return;
  }

  const willEscalate = attemptCount >= MAX_INTAKE_ATTEMPTS;
  if (willEscalate) {
    await updateNewSalesInvoice(
      result.invoiceId,
      { extraction_status: 'needs_review', wa_attempt_count: attemptCount },
      true
    );
  } else {
    await updateNewSalesInvoice(
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
    'sales',
    null,
    result.invoiceId
  );

  const message =
    validation.errors.length > 0
      ? await composeRejectionMessageWithAI(
          validation.errors,
          (result.extractedData || result.invoice || {}) as Record<string, unknown>,
          {
            invoiceNumber,
            willEscalate,
            kind: 'sales',
            warnings: validation.warnings,
          }
        )
      : '⚠️ Sales invoice needs review. Please correct and resend. 🙏';

  await sendWhatsAppMessage(replyChatId, { body: message });
}

async function resolveKind(
  parsed: ParsedInbound,
  file?: File
): Promise<InvoiceKind | 'ambiguous'> {
  const fromCaption = parseKindFromText(parsed.messageBody);
  if (fromCaption) return fromCaption;

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const inferred = await inferKindFromDocument(buffer, file.type);
    if (inferred) return inferred;
  }

  return 'ambiguous';
}

/** Process inbound document (with optional kind hint from caption). */
export async function processInboundDocument(
  parsed: ParsedInbound,
  kindHint: InvoiceKind | null
): Promise<void> {
  const { senderPhone, replyChatId } = parsed;
  try {
    if (parsed.hasMedia && !parsed.fileUrl && !parsed.base64) {
      console.warn('[whatsapp/inbound] hasMedia=true but no download URL in webhook payload');
      await sendWhatsAppMessage(replyChatId, {
        body:
          'We saw your attachment but could not download it. Please resend the invoice (PDF/JPG/PNG) with caption: purchase or sales. 🙏',
      });
      return;
    }

    const mimeType = resolveMimeType(parsed);
    if (!ALLOWED_INVOICE_MIME_TYPES.includes(mimeType)) {
      await sendWhatsAppMessage(replyChatId, {
        body:
          '⚠️ We only accept PDF, JPG or PNG invoices. Please resend in one of these formats. 🙏',
      });
      return;
    }

    const file = await materializeFile(parsed);
    let kind = kindHint;

    if (!kind) {
      const resolved = await resolveKind(parsed, file);
      if (resolved === 'ambiguous') {
        if (!parsed.fileUrl) {
          await sendWhatsAppMessage(replyChatId, {
            body:
              'Please resend your invoice with PURCHASE or SALES in the message/caption so we know which register to use. 🙏',
          });
          return;
        }
        await upsertPendingMedia({
          sender_phone: senderPhone,
          media_url: parsed.fileUrl,
          mime_type: mimeType,
          file_name: parsed.fileName,
          message_id: parsed.messageId,
        });
        await recordIntake(
          senderPhone,
          null,
          0,
          'awaiting_kind',
          null,
          'purchase',
          null,
          null
        );
        await sendWhatsAppMessage(replyChatId, {
          body:
            'Reply PURCHASE or SALES for the document you just sent (you can also include the word in your next message with a new file). 🙏',
        });
        return;
      }
      kind = resolved;
    }

    await deletePendingMedia(senderPhone);

    if (kind === 'sales') {
      await handleSalesInvoice(file, senderPhone, replyChatId);
    } else {
      await handlePurchaseInvoice(file, senderPhone, replyChatId, mimeType);
    }
  } catch (err: unknown) {
    console.error('[whatsapp/inbound] Error:', err);
    await sendWhatsAppMessage(replyChatId, {
      body:
        '⚠️ Something went wrong processing your invoice. Please try resending shortly. 🙏',
    }).catch(() => {});
  }
}

/** Handle text-only reply (e.g. PURCHASE / SALES for pending media). */
export async function processInboundTextReply(parsed: ParsedInbound): Promise<void> {
  const kind = parseKindFromText(parsed.messageBody);
  if (!kind) {
    await sendWhatsAppMessage(parsed.replyChatId, {
      body:
        'Send a PDF or image invoice, or reply PURCHASE or SALES if we asked you to choose.',
    });
    return;
  }

  const pending = await getPendingMedia(parsed.senderPhone);
  if (!pending.data?.media_url) {
    await sendWhatsAppMessage(parsed.replyChatId, {
      body: `Got it — next time you send an invoice, include the word "${kind}" in the message or caption.`,
    });
    return;
  }

  const docParsed: ParsedInbound = {
    ...parsed,
    fileUrl: pending.data.media_url,
    mimeType: pending.data.mime_type,
    fileName: pending.data.file_name || 'invoice',
    hasMedia: true,
    isTextOnly: false,
  };

  await processInboundDocument(docParsed, kind);
}

export async function handleInboundMessage(parsed: ParsedInbound): Promise<void> {
  if (parsed.event && parsed.event !== 'message.received') {
    return;
  }

  if (isOutgoingMessage(parsed)) {
    console.log('[whatsapp/inbound] Ignoring outgoing message echo');
    return;
  }

  if (parsed.isTextOnly && !parsed.hasMedia) {
    await processInboundTextReply(parsed);
    return;
  }

  if (!parsed.hasMedia) {
    return;
  }

  const kindFromCaption = parseKindFromText(parsed.messageBody);
  await processInboundDocument(parsed, kindFromCaption);
}
