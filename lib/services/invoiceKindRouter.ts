import type { InvoiceKind } from './purchaseInvoiceService';
import { extractSalesInvoiceWithGemini } from './geminiSalesExtractionService';
import { extractInvoiceDataFromImage } from './llmExtractionService';

const PURCHASE_KEYWORDS = /\b(purchase|buy|p)\b/i;
const SALES_KEYWORDS = /\b(sales|sell|s)\b/i;

export function parseKindFromText(text: string): InvoiceKind | null {
  const t = (text || '').trim();
  if (!t) return null;
  if (PURCHASE_KEYWORDS.test(t) && !SALES_KEYWORDS.test(t)) return 'purchase';
  if (SALES_KEYWORDS.test(t) && !PURCHASE_KEYWORDS.test(t)) return 'sales';
  if (/\bpurchase\b/i.test(t) || /\bbuy\b/i.test(t)) return 'purchase';
  if (/\bsales\b/i.test(t) || /\bsell\b/i.test(t)) return 'sales';
  return null;
}

function normalizeGstin(gstin: string | null | undefined): string {
  return (gstin || '').replace(/\s/g, '').toUpperCase();
}

export function classifyKindFromGstins(
  businessGstin: string,
  fields: {
    supplier_gstin?: string | null;
    buyer_gstin?: string | null;
    seller_gstin?: string | null;
    customer_gstin?: string | null;
  }
): InvoiceKind | null {
  const biz = normalizeGstin(businessGstin);
  if (!biz || biz.length < 15) return null;

  const supplier = normalizeGstin(fields.supplier_gstin);
  const buyer = normalizeGstin(fields.buyer_gstin);
  const seller = normalizeGstin(fields.seller_gstin);
  const customer = normalizeGstin(fields.customer_gstin);

  const weAreBuyer = buyer === biz || customer === biz;
  const weAreSeller = supplier === biz || seller === biz;

  if (weAreBuyer && !weAreSeller) return 'purchase';
  if (weAreSeller && !weAreBuyer) return 'sales';
  return null;
}

/** Quick Gemini extraction to infer purchase vs sales from document. */
export async function inferKindFromDocument(
  buffer: Buffer,
  mimeType: string
): Promise<InvoiceKind | null> {
  const businessGstin = process.env.BUSINESS_GSTIN;
  if (!businessGstin) return null;

  const base64 = buffer.toString('base64');
  const purchaseResult = await extractInvoiceDataFromImage(base64, mimeType).catch(() => ({
    data: null,
    error: null,
  }));

  if (purchaseResult.data) {
    const purchaseKind = classifyKindFromGstins(businessGstin, {
      supplier_gstin: purchaseResult.data.supplier_gstin,
      buyer_gstin: purchaseResult.data.buyer_gstin,
    });
    if (purchaseKind) return purchaseKind;
  }

  const salesResult = await extractSalesInvoiceWithGemini(buffer, mimeType).catch(() => ({
    data: null,
    error: null,
  }));

  if (salesResult.data?.customer_gstin) {
    const biz = normalizeGstin(businessGstin);
    const customer = normalizeGstin(salesResult.data.customer_gstin);
    if (customer && customer !== biz) {
      return 'sales';
    }
  }

  if (purchaseResult.data?.buyer_gstin) {
    const biz = normalizeGstin(businessGstin);
    const buyer = normalizeGstin(purchaseResult.data.buyer_gstin);
    if (buyer === biz) return 'purchase';
  }

  return null;
}
