/**
 * WhatsApp outbound service (via Evolution API).
 *
 * Evolution API (https://github.com/EvolutionAPI/evolution-api) is a self-hosted
 * WhatsApp gateway. We talk to a single "instance" (a connected WhatsApp number)
 * over its REST API. All decision logic lives in our app — this module is only
 * the thin HTTP layer that hands a finished message/document to Evolution and the
 * helper that pulls a received media's bytes back out.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIG (env vars):
 *   EVOLUTION_API_URL    base URL of your Evolution server, e.g. https://evo.mydomain.com
 *   EVOLUTION_API_KEY    the instance/global API key (sent as the `apikey` header)
 *   EVOLUTION_INSTANCE   the instance name (the connected WhatsApp number profile)
 *   WHATSAPP_BUSINESS_NUMBER  our WA number (display only — the instance is the sender)
 *
 *   If any of URL / key / instance is unset, sends are logged and skipped (no-op)
 *   so local/dev flows don't crash — see `isWhatsAppConfigured()`.
 *
 * Endpoints used:
 *   POST {url}/message/sendText/{instance}                 → send a text message
 *   POST {url}/message/sendMedia/{instance}                → send a document/image
 *   POST {url}/chat/getBase64FromMediaMessage/{instance}   → download a received media
 *
 * Auth: every request carries the header `apikey: <EVOLUTION_API_KEY>`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface WhatsAppSendResult {
  success: boolean;
  skipped?: boolean; // true when not configured (no-op)
  error?: string;
  response?: any;
}

/** Whether the Evolution HTTP layer is configured. */
export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.EVOLUTION_API_URL &&
      process.env.EVOLUTION_API_KEY &&
      process.env.EVOLUTION_INSTANCE
  );
}

function getBaseUrl(): string {
  return (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
}

function getInstance(): string {
  return process.env.EVOLUTION_INSTANCE || '';
}

/**
 * Normalise a phone number / WhatsApp JID into the digits-only form Evolution
 * expects (country code + number, no `+`, no `@s.whatsapp.net`).
 *   "+91 98765 43210"          → "919876543210"
 *   "919876543210@s.whatsapp.net" → "919876543210"
 */
export function normalizeNumber(input: string): string {
  return String(input || '')
    .split('@')[0] // drop any JID suffix
    .replace(/\D/g, ''); // keep digits only
}

/**
 * Low-level POST to Evolution. Centralises auth + error handling so the public
 * helpers below stay declarative. `path` is appended to `{base}/{...}/{instance}`.
 */
async function postToEvolution(
  endpoint: string,
  body: Record<string, any>
): Promise<WhatsAppSendResult> {
  if (!isWhatsAppConfigured()) {
    // Graceful no-op: keep flows working before Evolution creds are wired up.
    console.warn('[whatsapp] Evolution not configured — skipping send:', JSON.stringify(body));
    return { success: false, skipped: true, error: 'Evolution API not configured' };
  }

  const url = `${getBaseUrl()}/${endpoint}/${getInstance()}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.EVOLUTION_API_KEY as string,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let parsed: any = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* leave as raw text */
    }

    if (!response.ok) {
      console.error('[whatsapp] Evolution send failed:', response.status, text);
      return { success: false, error: `Evolution API error ${response.status}: ${text}` };
    }

    return { success: true, response: parsed };
  } catch (err: any) {
    console.error('[whatsapp] Exception sending to Evolution:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send a WhatsApp text message.
 *
 * NOTE: Evolution has no concept of pre-approved "templates" — it sends whatever
 * text you give it. The `template`/`params` options are kept for call-site
 * compatibility but are only used to build a fallback string when no `body` is
 * provided. (WhatsApp's own 24h-window rules still apply on the account level.)
 *
 * @param to    recipient phone (any format; normalised internally)
 * @param body  message text
 */
export async function sendWhatsAppMessage(
  to: string,
  options: { body?: string; template?: string; params?: Record<string, string> }
): Promise<WhatsAppSendResult> {
  const { body, template, params } = options;

  if (!body && !template) {
    return { success: false, error: 'Either `body` or `template` is required' };
  }

  const number = normalizeNumber(to);
  if (!number) {
    return { success: false, error: `Invalid recipient number: "${to}"` };
  }

  // Prefer explicit body; otherwise interpolate template params into a plain text.
  const text =
    body && body.trim()
      ? body
      : `${template}${params ? ' ' + Object.values(params).filter(Boolean).join(' ') : ''}`.trim();

  return postToEvolution('message/sendText', { number, text });
}

/**
 * Send a document (e.g. a copy of an invoice) over WhatsApp.
 *
 * @param to       recipient phone (any format; normalised internally)
 * @param fileUrl  publicly fetchable URL of the document (e.g. Supabase public URL)
 * @param caption  optional caption text
 */
export async function sendWhatsAppDocument(
  to: string,
  fileUrl: string,
  caption?: string
): Promise<WhatsAppSendResult> {
  const number = normalizeNumber(to);
  if (!number) {
    return { success: false, error: `Invalid recipient number: "${to}"` };
  }

  // Derive a sensible filename + mimetype from the URL.
  const fileName = decodeURIComponent(fileUrl.split('/').pop()?.split('?')[0] || 'document.pdf');
  const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const mimetype =
    ext === 'pdf'
      ? 'application/pdf'
      : ext === 'png'
        ? 'image/png'
        : ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : 'application/octet-stream';
  const mediatype = mimetype.startsWith('image/') ? 'image' : 'document';

  return postToEvolution('message/sendMedia', {
    number,
    mediatype,
    mimetype,
    media: fileUrl,
    fileName,
    caption: caption || '',
  });
}

/**
 * Pull the raw bytes of a media message a vendor sent us.
 *
 * Evolution stores incoming media encrypted on WhatsApp's servers; the webhook
 * payload only carries metadata (unless the instance is configured with
 * `base64: true`). This endpoint decrypts + returns the media as base64.
 *
 * @param rawMessage  the full `data` message object from the `messages.upsert`
 *                    webhook event (must contain `.key.id`).
 * @returns { base64, mimetype, fileName } or null on failure.
 */
export async function downloadEvolutionMedia(
  rawMessage: any
): Promise<{ base64: string; mimetype: string; fileName: string } | null> {
  if (!isWhatsAppConfigured()) {
    console.warn('[whatsapp] Evolution not configured — cannot download media');
    return null;
  }

  const url = `${getBaseUrl()}/chat/getBase64FromMediaMessage/${getInstance()}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.EVOLUTION_API_KEY as string,
      },
      body: JSON.stringify({ message: rawMessage, convertToMp4: false }),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('[whatsapp] getBase64FromMediaMessage failed:', response.status, text);
      return null;
    }

    const data = text ? JSON.parse(text) : {};
    const base64 = data?.base64 || data?.media?.base64 || '';
    if (!base64) {
      console.error('[whatsapp] getBase64FromMediaMessage returned no base64:', text.slice(0, 300));
      return null;
    }

    return {
      base64,
      mimetype: data?.mimetype || data?.mimeType || '',
      fileName: data?.fileName || data?.filename || '',
    };
  } catch (err: any) {
    console.error('[whatsapp] Exception downloading Evolution media:', err);
    return null;
  }
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

    const composerModel = process.env.GEMINI_MESSAGE_MODEL || 'gemini-2.5-flash-lite';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${composerModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // thinkingBudget:0 so the whole message fits in the token budget —
          // otherwise gemini-2.0-flash spends it "thinking" and the reply is
          // truncated mid-sentence (e.g. "Hi there! 👋 Regarding invoice …").
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingBudget: 0 },
          },
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
