import { createHmac, timingSafeEqual } from 'crypto';

/**
 * OpenWA HTTP client — self-hosted WhatsApp API gateway.
 *
 * Env:
 *   OPENWA_BASE_URL      e.g. http://localhost:2785
 *   OPENWA_API_KEY       from OpenWA dashboard
 *   OPENWA_SESSION_ID    session id (e.g. default)
 */

export interface OpenWASendResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
  response?: unknown;
}

export function isOpenWAConfigured(): boolean {
  return Boolean(
    process.env.OPENWA_BASE_URL &&
      process.env.OPENWA_API_KEY &&
      process.env.OPENWA_SESSION_ID
  );
}

function getBaseUrl(): string {
  return (process.env.OPENWA_BASE_URL || '').replace(/\/$/, '');
}

function getSessionId(): string {
  return process.env.OPENWA_SESSION_ID || 'default';
}

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.OPENWA_API_KEY || '',
  };
}

/** Normalize phone/chat id to OpenWA chatId (digits@c.us or pass-through @lid / @g.us). */
export function toChatId(phoneOrChatId: string): string {
  const raw = String(phoneOrChatId || '').trim();
  if (raw.includes('@')) return raw;
  const digits = raw.replace(/\D/g, '');
  return digits ? `${digits}@c.us` : raw;
}

/**
 * Resolve reply target + stable sender key from OpenWA webhook fields.
 * Prefer `chatId` over `from` — `from` may be a LID (`...@lid`) while chatId is the real JID.
 */
export function resolveWhatsAppIdentity(
  chatIdRaw: string,
  fromRaw: string
): { replyChatId: string; senderKey: string } {
  const chatId = String(chatIdRaw || '').trim();
  const from = String(fromRaw || '').trim();

  let replyChatId = chatId;
  if (!replyChatId.includes('@')) {
    replyChatId = from.includes('@') ? from : toChatId(from || chatId);
  } else if (replyChatId.endsWith('@lid') && from.endsWith('@c.us')) {
    replyChatId = from;
  }

  let senderKey: string;
  if (replyChatId.endsWith('@c.us')) {
    const digits = replyChatId.split('@')[0].replace(/\D/g, '');
    senderKey = digits ? `+${digits}` : replyChatId;
  } else {
    senderKey = replyChatId;
  }

  return { replyChatId, senderKey };
}

/**
 * Verify OpenWA webhook HMAC (SHA-256 hex of raw body).
 * Accepts X-Webhook-Signature or x-openwa-signature headers.
 */
export function verifyOpenWAWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined
): boolean {
  if (!secret || !signatureHeader) return false;
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const provided = signatureHeader.replace(/^sha256=/i, '').trim().toLowerCase();
    if (expected.length !== provided.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return signatureHeader === secret;
  }
}

export async function sendWhatsAppText(
  to: string,
  text: string
): Promise<OpenWASendResult> {
  if (!isOpenWAConfigured()) {
    console.warn('[openwa] Not configured — skipping send');
    return { success: false, skipped: true, error: 'OpenWA not configured' };
  }

  const chatId = toChatId(to);
  const url = `${getBaseUrl()}/api/sessions/${getSessionId()}/messages/send-text`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ chatId, text }),
    });

    const responseText = await response.text();
    let parsed: unknown = responseText;
    try {
      parsed = responseText ? JSON.parse(responseText) : null;
    } catch {
      /* raw */
    }

    if (!response.ok) {
      console.error('[openwa] send-text failed:', response.status, responseText);
      return { success: false, error: `OpenWA error ${response.status}: ${responseText}` };
    }

    return { success: true, response: parsed };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[openwa] send-text exception:', message);
    return { success: false, error: message };
  }
}

export async function sendWhatsAppDocument(
  to: string,
  fileUrl: string,
  caption?: string,
  filename?: string
): Promise<OpenWASendResult> {
  if (!isOpenWAConfigured()) {
    return { success: false, skipped: true, error: 'OpenWA not configured' };
  }

  const chatId = toChatId(to);
  const url = `${getBaseUrl()}/api/sessions/${getSessionId()}/messages/send-document`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        chatId,
        url: fileUrl,
        caption: caption || '',
        filename: filename || 'document.pdf',
      }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      return { success: false, error: `OpenWA error ${response.status}: ${responseText}` };
    }

    let parsed: unknown = responseText;
    try {
      parsed = responseText ? JSON.parse(responseText) : null;
    } catch {
      /* raw */
    }
    return { success: true, response: parsed };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/** Download media from OpenWA-hosted URL (requires API key). */
export async function downloadOpenWAMedia(mediaUrl: string): Promise<Buffer> {
  const headers: Record<string, string> = {};
  if (process.env.OPENWA_API_KEY) {
    headers['X-API-Key'] = process.env.OPENWA_API_KEY;
  }

  const res = await fetch(mediaUrl, { headers });
  if (!res.ok) {
    throw new Error(`Failed to download media (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** Optional health ping for dashboard status. */
export async function pingOpenWAHealth(): Promise<boolean> {
  if (!process.env.OPENWA_BASE_URL) return false;
  const paths = ['/api/health', '/health', '/api/sessions'];
  for (const path of paths) {
    try {
      const res = await fetch(`${getBaseUrl()}${path}`, {
        headers: apiHeaders(),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) return true;
    } catch {
      /* try next */
    }
  }
  return false;
}
