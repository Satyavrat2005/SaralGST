/**
 * WhatsApp outbound service (via Slide / Synquic).
 *
 * Slide is a "dumb pipe": it relays our messages/documents to the vendor's
 * WhatsApp. All decision logic lives in our app — this module is only the thin
 * HTTP layer that hands a finished message to Slide.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIG (§6 of WHATSAPP_INTEGRATION_PLAN.md is not yet filled in):
 *   The exact Slide send endpoint + request body are still TBD. This module is
 *   written for "Pattern A" (Slide exposes a REST send endpoint) and reads its
 *   shape from env vars so the body can be adjusted without code changes:
 *
 *     SLIDE_API_BASE_URL   e.g. https://api.synquic.com
 *     SLIDE_API_KEY        bearer/api key for outbound sends
 *     SLIDE_SEND_PATH      (optional) path for sending, default "/messages"
 *     WHATSAPP_BUSINESS_NUMBER  our WA number (single-tenant for now)
 *
 *   If `SLIDE_API_BASE_URL`/`SLIDE_API_KEY` are unset, sends are logged and
 *   skipped (no-op) so local/dev flows don't crash — see `isConfigured()`.
 *
 *   TODO(slide): once §6 is confirmed, adjust `buildSendRequest()` to match the
 *   real endpoint/auth/body, and switch to Pattern B (kick off a Slide flow via
 *   an "External Request" trigger) if Slide can't send directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface WhatsAppSendResult {
  success: boolean;
  skipped?: boolean; // true when not configured (no-op)
  error?: string;
  response?: any;
}

/** Whether the outbound HTTP layer is configured. */
export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.SLIDE_API_BASE_URL && process.env.SLIDE_API_KEY);
}

function getSendUrl(): string {
  const base = (process.env.SLIDE_API_BASE_URL || '').replace(/\/$/, '');
  const path = process.env.SLIDE_SEND_PATH || '/messages';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Low-level POST to Slide. Centralises auth + error handling so the public
 * helpers below stay declarative.
 */
async function postToSlide(body: Record<string, any>): Promise<WhatsAppSendResult> {
  if (!isWhatsAppConfigured()) {
    // Graceful no-op: keep flows working before Slide creds are wired up.
    console.warn('[whatsapp] Slide not configured — skipping send:', JSON.stringify(body));
    return { success: false, skipped: true, error: 'Slide API not configured' };
  }

  try {
    const response = await fetch(getSendUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SLIDE_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.WHATSAPP_BUSINESS_NUMBER,
        ...body,
      }),
    });

    const text = await response.text();
    let parsed: any = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* leave as raw text */
    }

    if (!response.ok) {
      console.error('[whatsapp] Slide send failed:', response.status, text);
      return { success: false, error: `Slide API error ${response.status}: ${text}` };
    }

    return { success: true, response: parsed };
  } catch (err: any) {
    console.error('[whatsapp] Exception sending to Slide:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send a WhatsApp message.
 *
 * @param to        recipient phone (E.164, e.g. "+919876543210")
 * @param body      free-form message text. Valid only INSIDE the 24h customer
 *                  service window (i.e. as a reply to a vendor's recent message).
 * @param template  template name to use OUTSIDE the 24h window (business-initiated
 *                  messages must be pre-approved templates registered in Slide).
 * @param params    template variables, keyed by name.
 */
export async function sendWhatsAppMessage(
  to: string,
  options: { body?: string; template?: string; params?: Record<string, string> }
): Promise<WhatsAppSendResult> {
  const { body, template, params } = options;

  if (!body && !template) {
    return { success: false, error: 'Either `body` or `template` is required' };
  }

  return postToSlide({
    to,
    type: template ? 'template' : 'text',
    ...(template ? { template, params: params || {} } : { text: body }),
  });
}

/**
 * Send a document (e.g. a copy of an invoice) over WhatsApp.
 *
 * @param to       recipient phone (E.164)
 * @param fileUrl  publicly fetchable URL of the document (e.g. Supabase public URL)
 * @param caption  optional caption text
 */
export async function sendWhatsAppDocument(
  to: string,
  fileUrl: string,
  caption?: string
): Promise<WhatsAppSendResult> {
  return postToSlide({
    to,
    type: 'document',
    document: { url: fileUrl, caption: caption || '' },
  });
}

// =====================================================
// Message composers (the "voice" of the bot)
// =====================================================

/**
 * Turn validation errors into a human-readable WhatsApp correction message.
 * Deterministic fallback used when the Gemini composer is unavailable.
 */
export function composeRejectionMessage(
  errors: { message: string }[],
  opts: { invoiceNumber?: string | null; willEscalate?: boolean } = {}
): string {
  const lines = errors
    .map((e) => e.message)
    .filter(Boolean)
    // De-dupe identical messages.
    .filter((m, i, arr) => arr.indexOf(m) === i)
    .map((m, i) => `${i + 1}. ${m}`);

  const header = '⚠️ We couldn’t accept this invoice:';
  const footer = opts.willEscalate
    ? 'Our team will review this manually and get back to you. 🙏'
    : 'Please correct and resend. 🙏';

  return [header, ...lines, '', footer].join('\n');
}

/** Confirmation message for a validated invoice. */
export function composeConfirmationMessage(invoiceNumber?: string | null): string {
  return invoiceNumber
    ? `✅ Invoice ${invoiceNumber} received & validated. Thank you!`
    : '✅ Invoice received & validated. Thank you!';
}

/**
 * Optional upgrade (§3.5): ask Gemini to rewrite the validation errors into a
 * friendlier, more specific natural-language correction message. Falls back to
 * the deterministic composer if Gemini is unavailable or errors.
 */
export async function composeRejectionMessageWithAI(
  errors: { message: string }[],
  extractedData: Record<string, any>,
  opts: { invoiceNumber?: string | null; willEscalate?: boolean } = {}
): Promise<string> {
  const fallback = composeRejectionMessage(errors, opts);
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey || errors.length === 0) return fallback;

  try {
    const prompt = `You are a polite GST accounting assistant replying to a vendor on WhatsApp.
An invoice they sent failed validation. Write a SHORT, friendly WhatsApp message (max ~6 lines)
that clearly lists what is wrong and asks them to correct and resend.
Use simple language. You may use a couple of emojis. Do not invent issues.

Validation problems:
${errors.map((e, i) => `${i + 1}. ${e.message}`).join('\n')}

Some extracted invoice fields (for context, may be wrong/missing):
${JSON.stringify(
  {
    supplier_name: extractedData.supplier_name,
    invoice_number: extractedData.invoice_number,
    invoice_date: extractedData.invoice_date,
  },
  null,
  0
)}

${opts.willEscalate ? 'End by saying our team will review it manually.' : 'End by asking them to correct and resend.'}
Return ONLY the message text.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
        }),
      }
    );

    if (!response.ok) return fallback;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || fallback;
  } catch (err) {
    console.error('[whatsapp] AI rejection composer failed, using fallback:', err);
    return fallback;
  }
}
