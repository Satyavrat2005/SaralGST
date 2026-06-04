/**
 * WhatsApp outbound + message composers.
 * Sends via self-hosted OpenWA when configured.
 */

import {
  isOpenWAConfigured,
  sendWhatsAppText,
  sendWhatsAppDocument as openwaSendDocument,
  toChatId,
} from './openwaService';
import type { ValidationError as PurchaseValidationError } from './validationService';
import type { ValidationError as SalesValidationError } from './salesValidationService';
import {
  buildPurchaseValidationMessage,
  buildSalesValidationMessage,
  PURCHASE_FIELD_LABELS,
  SALES_FIELD_LABELS,
} from './whatsappValidationMessage';

export interface WhatsAppSendResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
  response?: unknown;
}

/** Whether outbound WhatsApp is configured (OpenWA). */
export function isWhatsAppConfigured(): boolean {
  return isOpenWAConfigured();
}

export async function sendWhatsAppMessage(
  to: string,
  options: { body?: string; template?: string; params?: Record<string, string> }
): Promise<WhatsAppSendResult> {
  const { body, template, params } = options;

  if (!body && !template) {
    return { success: false, error: 'Either `body` or `template` is required' };
  }

  let text = body || '';
  if (template && params) {
    text = Object.entries(params).reduce(
      (msg, [key, val]) => msg.replace(new RegExp(`\\{${key}\\}`, 'g'), val),
      template
    );
  } else if (template) {
    text = template;
  }

  const target = to.includes('@') ? to : toChatId(to);
  return sendWhatsAppText(target, text);
}

export async function sendWhatsAppDocument(
  to: string,
  fileUrl: string,
  caption?: string
): Promise<WhatsAppSendResult> {
  const target = to.includes('@') ? to : toChatId(to);
  return openwaSendDocument(target, fileUrl, caption);
}

// =====================================================
// Message composers
// =====================================================

type RejectionErrorInput = {
  message: string;
  field?: string;
  issue_type?: string;
  userFriendlyLabel?: string;
};

function labelForRejectionError(
  e: RejectionErrorInput,
  kind: 'purchase' | 'sales'
): string {
  if (e.userFriendlyLabel) return e.userFriendlyLabel;
  if (e.field) {
    const map = kind === 'sales' ? SALES_FIELD_LABELS : PURCHASE_FIELD_LABELS;
    return map[e.field] || e.field.replace(/_/g, ' ');
  }
  return 'Issue';
}

export function composeRejectionMessage(
  errors: RejectionErrorInput[],
  opts: { invoiceNumber?: string | null; willEscalate?: boolean; kind?: 'purchase' | 'sales' } = {}
): string {
  const kind = opts.kind || 'purchase';
  const lines = errors
    .filter((e) => e.message)
    .filter((e, i, arr) => {
      const key = `${e.field || ''}:${e.message}`;
      return arr.findIndex((x) => `${x.field || ''}:${x.message}` === key) === i;
    })
    .map((e, i) => {
      const label = labelForRejectionError(e, kind);
      const type = e.issue_type ? ` (${e.issue_type})` : '';
      return `${i + 1}. ${label}${type}: ${e.message}`;
    });

  const label = kind === 'sales' ? 'sales invoice' : 'invoice';
  const header = `⚠️ We couldn’t accept this ${label}:`;
  const footer = opts.willEscalate
    ? 'Our team will review this manually and get back to you. 🙏'
    : 'Please correct and resend. 🙏';

  if (lines.length === 0) {
    return [header, 'Validation failed. Please check the PDF and resend.', '', footer].join('\n');
  }

  return [header, ...lines, '', footer].join('\n');
}

export function composeConfirmationMessage(
  invoiceNumber?: string | null,
  opts: { kind?: 'purchase' | 'sales'; warnings?: { message: string }[] } = {}
): string {
  const kindLabel = opts.kind === 'sales' ? 'Sales invoice' : 'Invoice';
  const base = invoiceNumber
    ? `✅ ${kindLabel} ${invoiceNumber} received & validated. Thank you!`
    : `✅ ${kindLabel} received & validated. Thank you!`;

  if (!opts.warnings?.length) return base;

  const warnLines = opts.warnings
    .map((w) => w.message)
    .filter(Boolean)
    .filter((m, i, arr) => arr.indexOf(m) === i)
    .map((m, i) => `${i + 1}. ${m}`);

  return [base, '', 'Note — saved with warnings:', ...warnLines].join('\n');
}

export type ComposeRejectionOpts = {
  invoiceNumber?: string | null;
  willEscalate?: boolean;
  kind?: 'purchase' | 'sales';
  warnings?: { field?: string; message: string }[];
};

function buildDeterministicRejectionMessage(
  errors: RejectionErrorInput[],
  extractedData: Record<string, unknown>,
  opts: ComposeRejectionOpts
): string {
  const kind = opts.kind || 'purchase';
  const feedbackOpts = {
    invoiceNumber: opts.invoiceNumber,
    willEscalate: opts.willEscalate,
    extractedData,
    warnings: opts.warnings,
  };

  if (kind === 'sales') {
    return buildSalesValidationMessage(
      errors as SalesValidationError[],
      { ...feedbackOpts, kind: 'sales' }
    );
  }

  return buildPurchaseValidationMessage(
    errors as PurchaseValidationError[],
    { ...feedbackOpts, kind: 'purchase' }
  );
}

/** True if AI output likely dropped structured bullet sections. */
function aiOutputMissingBullets(aiText: string, deterministicBody: string): boolean {
  const sectionHeaders = [
    '*Missing information*',
    '*Recommended fields*',
    '*Validation issues*',
  ];
  for (const header of sectionHeaders) {
    if (deterministicBody.includes(header) && !aiText.includes(header)) {
      return true;
    }
  }
  const bulletCount = (deterministicBody.match(/• /g) || []).length;
  const aiBulletCount = (aiText.match(/• /g) || []).length;
  if (bulletCount > 0 && aiBulletCount < bulletCount) return true;
  return false;
}

export async function composeRejectionMessageWithAI(
  errors: RejectionErrorInput[],
  extractedData: Record<string, unknown>,
  opts: ComposeRejectionOpts = {}
): Promise<string> {
  const deterministicBody = buildDeterministicRejectionMessage(
    errors,
    extractedData,
    opts
  );

  if (errors.length === 0) return deterministicBody;

  const fallback = deterministicBody;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) return fallback;

  try {
    const prompt = `You are a polite GST accounting assistant replying on WhatsApp in simple English (light Hinglish OK).
The user sent an invoice that failed validation.

Write ONLY:
1) A friendly opening line (1 sentence, optional emoji).
2) The EXACT text block below — copy every character, do not shorten, renumber, or omit bullets.
3) A brief closing line (1 sentence) matching the footer intent.

RULES:
- Do NOT invent new issues.
- Do NOT remove or merge bullet points.
- Keep section headers and bullet characters (•) unchanged.

--- BEGIN REQUIRED BODY (copy verbatim) ---
${deterministicBody}
--- END REQUIRED BODY ---

Return the full WhatsApp message (intro + required body + closing).`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) return fallback;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text || aiOutputMissingBullets(text, deterministicBody)) {
      return fallback;
    }
    return text;
  } catch (err) {
    console.error('[whatsapp] AI rejection composer failed, using fallback:', err);
    return fallback;
  }
}
