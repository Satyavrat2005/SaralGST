import { supabaseAdmin } from '@/lib/services/salesInvoiceService';
import {
  normalizeNumber,
  sendWhatsAppMessage,
  sendWhatsAppDocument,
} from '@/lib/services/whatsappService';

/**
 * WhatsApp text-command assistant.
 *
 * When a person sends a *text* message (not an invoice attachment) to our
 * business number, this module figures out who they are by their phone number
 * and replies with THEIR OWN records only:
 *   - As a customer (sales_invoices.customer_phone) → their bills / statement.
 *   - As a vendor   (purchase_register.wa_sender_phone) → status of invoices
 *     they've sent us.
 *
 * Privacy: every lookup is scoped to the sender's number. A number that matches
 * nothing gets a polite "no records" reply — never another party's data.
 *
 * Intent is detected with a deterministic menu + keyword matcher (no AI cost).
 */

// How many invoices to send/list at once.
const MAX_DOCS_TO_SEND = 3;
const MAX_LIST_ROWS = 10;

interface CustomerInvoice {
  invoice_number: string | null;
  invoice_date: string | null;
  gross_total: number | null;
  invoice_file_url: string | null;
  customer_name: string | null;
}

interface VendorInvoice {
  invoice_number: string | null;
  invoice_date: string | null;
  total_invoice_value: number | null;
  invoice_bucket_url: string | null;
  invoice_status: string | null;
  supplier_name: string | null;
}

type Intent = 'invoice' | 'statement' | 'status' | 'help';

function inr(n: number | null | undefined): string {
  return `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString('en-IN');
}

/** Last 10 digits — the stable part of an Indian mobile number across formats. */
function last10(phone: string): string {
  return normalizeNumber(phone).slice(-10);
}

/** Detect what the sender is asking for. Menu numbers + keywords. */
function detectIntent(text: string): Intent {
  const t = text.trim().toLowerCase();

  if (/^1\b/.test(t) || /\b(invoice|bill|copy|pdf|receipt)\b/.test(t)) return 'invoice';
  if (/^2\b/.test(t) || /\b(statement|ledger|list|all|history|summary)\b/.test(t)) return 'statement';
  if (/^3\b/.test(t) || /\b(status|track|received|reconcile)\b/.test(t)) return 'status';
  return 'help';
}

/** Find sales invoices we issued TO this number (they are our customer). */
async function findCustomerInvoices(senderPhone: string): Promise<CustomerInvoice[]> {
  const tail = last10(senderPhone);
  if (!tail) return [];
  const { data, error } = await supabaseAdmin
    .from('sales_invoices')
    .select('invoice_number, invoice_date, gross_total, invoice_file_url, customer_name, customer_phone')
    .ilike('customer_phone', `%${tail}%`)
    .order('invoice_date', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  // Confirm the substring match really is the same number (defends against
  // ilike matching a longer/embedded sequence).
  return data.filter((r: any) => last10(String(r.customer_phone || '')) === tail);
}

/** Find purchase invoices this number SENT us (they are our vendor). */
async function findVendorInvoices(senderPhone: string): Promise<VendorInvoice[]> {
  const tail = last10(senderPhone);
  if (!tail) return [];
  const { data, error } = await supabaseAdmin
    .from('purchase_register')
    .select(
      'invoice_number, invoice_date, total_invoice_value, invoice_bucket_url, invoice_status, supplier_name, wa_sender_phone'
    )
    .ilike('wa_sender_phone', `%${tail}%`)
    .order('invoice_date', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.filter((r: any) => last10(String(r.wa_sender_phone || '')) === tail);
}

/** Friendly label for a purchase invoice's internal status. */
function vendorStatusLabel(status: string | null): string {
  switch (status) {
    case 'extracted':
    case 'verified':
      return '✅ Received & validated';
    case 'wa_quarantine':
      return '✏️ Needs correction';
    case 'needs_review':
      return '🔎 Under manual review';
    case 'pending':
      return '⏳ Processing';
    case 'error':
      return '⚠️ Could not be read';
    default:
      return 'Received';
  }
}

function helpMenu(name: string | null, isCustomer: boolean, isVendor: boolean): string {
  const hi = name ? `Hi ${name}! 👋` : 'Hi! 👋';
  const lines = [hi, '', 'You can reply with:'];
  if (isCustomer) {
    lines.push('1️⃣  *Invoice* — get your latest invoice');
    lines.push('2️⃣  *Statement* — a list of your invoices');
  }
  if (isVendor) {
    lines.push('3️⃣  *Status* — status of invoices you sent us');
  }
  lines.push('');
  lines.push('Or just type "invoice", "statement" or "status".');
  return lines.join('\n');
}

/**
 * Main entry: handle an inbound text message from `senderPhone`.
 * Best-effort; never throws (the webhook calls this in the background).
 */
export async function handleInboundText(senderPhone: string, text: string): Promise<void> {
  try {
    const [customerInvoices, vendorInvoices] = await Promise.all([
      findCustomerInvoices(senderPhone),
      findVendorInvoices(senderPhone),
    ]);

    const isCustomer = customerInvoices.length > 0;
    const isVendor = vendorInvoices.length > 0;

    // Unknown number → no data is ever leaked.
    if (!isCustomer && !isVendor) {
      await sendWhatsAppMessage(senderPhone, {
        body:
          "Hi! We couldn't find any records linked to this number. " +
          'If you believe this is a mistake, please reach out to us directly. 🙏',
      });
      return;
    }

    const name =
      customerInvoices[0]?.customer_name || vendorInvoices[0]?.supplier_name || null;
    const intent = detectIntent(text);

    if (intent === 'help') {
      await sendWhatsAppMessage(senderPhone, { body: helpMenu(name, isCustomer, isVendor) });
      return;
    }

    // ── Send the latest invoice document(s). Customer bills take priority. ──────
    if (intent === 'invoice') {
      if (isCustomer) {
        const withFiles = customerInvoices.filter((i) => i.invoice_file_url);
        if (withFiles.length === 0) {
          await sendWhatsAppMessage(senderPhone, {
            body: 'We found your invoice records but no downloadable file is available right now. 🙏',
          });
          return;
        }
        const toSend = withFiles.slice(0, MAX_DOCS_TO_SEND);
        await sendWhatsAppMessage(senderPhone, {
          body: `Sure! Sending your ${toSend.length === 1 ? 'latest invoice' : `${toSend.length} latest invoices`}. 📄`,
        });
        for (const inv of toSend) {
          await sendWhatsAppDocument(
            senderPhone,
            inv.invoice_file_url as string,
            `Invoice ${inv.invoice_number || ''} • ${formatDate(inv.invoice_date)} • ${inr(inv.gross_total)}`.trim()
          );
        }
        return;
      }
      // Vendor asking for a copy of what they sent us.
      const withFiles = vendorInvoices.filter((i) => i.invoice_bucket_url);
      if (withFiles.length === 0) {
        await sendWhatsAppMessage(senderPhone, {
          body: 'We have your invoice records but no downloadable file is available right now. 🙏',
        });
        return;
      }
      const toSend = withFiles.slice(0, MAX_DOCS_TO_SEND);
      await sendWhatsAppMessage(senderPhone, {
        body: `Here ${toSend.length === 1 ? 'is the invoice' : `are the ${toSend.length} invoices`} you sent us. 📄`,
      });
      for (const inv of toSend) {
        await sendWhatsAppDocument(
          senderPhone,
          inv.invoice_bucket_url as string,
          `Invoice ${inv.invoice_number || ''} • ${formatDate(inv.invoice_date)} • ${inr(inv.total_invoice_value)}`.trim()
        );
      }
      return;
    }

    // ── Statement: a text list of their invoices with a total. ──────────────────
    if (intent === 'statement') {
      if (isCustomer) {
        const rows = customerInvoices.slice(0, MAX_LIST_ROWS);
        const total = customerInvoices.reduce((s, i) => s + (Number(i.gross_total) || 0), 0);
        const lines = rows.map(
          (i) => `• ${i.invoice_number || '—'}  ${formatDate(i.invoice_date)}  ${inr(i.gross_total)}`
        );
        const more =
          customerInvoices.length > rows.length
            ? `\n…and ${customerInvoices.length - rows.length} more.`
            : '';
        await sendWhatsAppMessage(senderPhone, {
          body:
            `🧾 *Your statement* (${customerInvoices.length} invoice${customerInvoices.length === 1 ? '' : 's'})\n\n` +
            `${lines.join('\n')}${more}\n\n*Total billed: ${inr(total)}*\n\n` +
            'Reply "invoice" to get the latest PDF.',
        });
        return;
      }
      // Vendor statement = invoices they've sent us.
      const rows = vendorInvoices.slice(0, MAX_LIST_ROWS);
      const total = vendorInvoices.reduce((s, i) => s + (Number(i.total_invoice_value) || 0), 0);
      const lines = rows.map(
        (i) => `• ${i.invoice_number || '—'}  ${formatDate(i.invoice_date)}  ${inr(i.total_invoice_value)}`
      );
      const more =
        vendorInvoices.length > rows.length ? `\n…and ${vendorInvoices.length - rows.length} more.` : '';
      await sendWhatsAppMessage(senderPhone, {
        body:
          `🧾 *Invoices you've sent us* (${vendorInvoices.length})\n\n` +
          `${lines.join('\n')}${more}\n\n*Total: ${inr(total)}*\n\n` +
          'Reply "status" to see their processing status.',
      });
      return;
    }

    // ── Status: vendor-focused (state of what they submitted). ──────────────────
    if (intent === 'status') {
      if (isVendor) {
        const rows = vendorInvoices.slice(0, MAX_LIST_ROWS);
        const lines = rows.map(
          (i) => `• ${i.invoice_number || '—'}  ${formatDate(i.invoice_date)}\n   ${vendorStatusLabel(i.invoice_status)}`
        );
        await sendWhatsAppMessage(senderPhone, {
          body: `📋 *Status of your invoices*\n\n${lines.join('\n')}`,
        });
        return;
      }
      // Customer asked for status — give them their latest invoice info.
      const latest = customerInvoices[0];
      await sendWhatsAppMessage(senderPhone, {
        body:
          `Your latest invoice with us:\n• ${latest.invoice_number || '—'} • ${formatDate(latest.invoice_date)} • ${inr(latest.gross_total)}\n\n` +
          'Reply "invoice" to get the PDF or "statement" for the full list.',
      });
      return;
    }
  } catch (err) {
    console.error('[whatsappAssistant] Error handling inbound text:', err);
    await sendWhatsAppMessage(senderPhone, {
      body: '⚠️ Something went wrong on our side. Please try again in a moment. 🙏',
    }).catch(() => {});
  }
}
