import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  uploadSalesInvoice,
  createNewSalesInvoice,
  updateNewSalesInvoice,
  createSalesRemarks,
  SalesInvoice,
} from '@/lib/services/salesInvoiceService';
import { extractSalesInvoiceWithGemini, GeminiSalesData } from '@/lib/services/geminiSalesExtractionService';
import {
  extractSalesInvoiceWithGroqText,
  extractSalesInvoiceWithGroqVision,
} from '@/lib/services/groqExtractionService';
import { parseSalesInvoiceFromText, SalesInvoiceData } from '@/lib/services/salesExtractionService';

/**
 * POST /api/invoice/sales/process
 *
 * 4-tier extraction pipeline (stops at first success):
 *   1. Groq Vision   — for images (JPG/PNG), free 500 req/day
 *   2. Groq Text     — pdf-parse text → Groq Llama, free 6000 req/day
 *   3. Gemini Vision — original fallback, free 1500 req/day (if quota ok)
 *   4. Regex parser  — zero external API, always works for text PDFs
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type))
      return NextResponse.json({ error: 'Only PDF, JPG, PNG allowed.' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: 'File too large (max 10 MB).' }, { status: 400 });

    // ── Upload ────────────────────────────────────────────────────────────────
    const { data: uploadData, error: uploadError } = await uploadSalesInvoice(file, true);
    if (uploadError || !uploadData)
      return NextResponse.json({ error: `Upload failed: ${uploadError}` }, { status: 500 });

    // ── Placeholder row ───────────────────────────────────────────────────────
    const { data: placeholder, error: createError } = await createNewSalesInvoice(
      { user_id: user.id, invoice_file_url: uploadData.url, extraction_status: 'pending' },
      true
    );
    if (createError || !placeholder)
      return NextResponse.json({ error: `DB create failed: ${createError}` }, { status: 500 });

    const invoiceId = placeholder.id!;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const isPdf = file.type === 'application/pdf';
    const isImage = !isPdf;

    let aiData: GeminiSalesData | null = null;
    let method = 'none';

    // ── Tier 1: Groq Vision (images only) ────────────────────────────────────
    if (isImage && process.env.GROQ_API_KEY) {
      const { data, error } = await extractSalesInvoiceWithGroqVision(fileBuffer, file.type);
      if (data) { aiData = data; method = 'groq-vision'; }
      else console.warn('[Sales] Groq Vision failed:', error?.substring(0, 80));
    }

    // ── Tier 2: Groq Text (extract PDF text → Groq Llama) ────────────────────
    if (!aiData && process.env.GROQ_API_KEY) {
      const pdfText = await extractTextNatively(fileBuffer, file.type);
      if (pdfText) {
        const { data, error } = await extractSalesInvoiceWithGroqText(pdfText);
        if (data) { aiData = data; method = 'groq-text'; }
        else console.warn('[Sales] Groq Text failed:', error?.substring(0, 80));

        // If Groq also fails, still try regex on the same text (Tier 4)
        if (!aiData) {
          const regexResult = parseSalesInvoiceFromText(pdfText);
          const mapped = mapRegex(regexResult, uploadData.url);
          if (hasAnyData(mapped)) { 
            const invoiceData = finalize(mapped, uploadData.url);
            return await saveAndRespond(invoiceId, invoiceData, placeholder, 'regex');
          }
        }
      }
    }

    // ── Tier 3: Gemini Vision (if no Groq key, or Groq failed on image) ──────
    if (!aiData) {
      const { data, error } = await extractSalesInvoiceWithGemini(fileBuffer, file.type);
      if (data) { aiData = data; method = 'gemini'; }
      else console.warn('[Sales] Gemini failed:', error?.substring(0, 80));
    }

    // ── Tier 4: PDF text + regex (zero external API) ─────────────────────────
    if (!aiData) {
      const pdfText = await extractTextNatively(fileBuffer, file.type);
      if (pdfText) {
        const regexResult = parseSalesInvoiceFromText(pdfText);
        const mapped = mapRegex(regexResult, uploadData.url);
        if (hasAnyData(mapped)) {
          const invoiceData = finalize(mapped, uploadData.url);
          return await saveAndRespond(invoiceId, invoiceData, placeholder, 'regex');
        }
      }
    }

    // ── Build invoice from AI result ──────────────────────────────────────────
    const invoiceData = aiData
      ? finalize(mapGemini(aiData, uploadData.url), uploadData.url)
      : finalize({ invoice_file_url: uploadData.url }, uploadData.url);

    return await saveAndRespond(invoiceId, invoiceData, placeholder, method);

  } catch (err: any) {
    console.error('[Sales] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}

/* ─── Save & respond helper ────────────────────────────────────────────────── */

async function saveAndRespond(
  invoiceId: string,
  invoiceData: Partial<SalesInvoice>,
  placeholder: Partial<SalesInvoice>,
  method: string
) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { uploadSalesInvoice: _u, createNewSalesInvoice: _c, ...rest } = await import('@/lib/services/salesInvoiceService');
  const { updateNewSalesInvoice, createSalesRemarks } = rest;

  const validation = validate(invoiceData);
  const { data: saved, error: saveErr } = await updateNewSalesInvoice(invoiceId, invoiceData, true);
  if (saveErr) console.error('[Sales] DB update error:', saveErr);

  const remarks = buildRemarks(invoiceId, validation);
  if (remarks.length) await createSalesRemarks(remarks, true).catch(() => {});

  console.log(`[Sales] Extracted via ${method}. Invoice#: ${invoiceData.invoice_number ?? 'null'}`);

  return Response.json({
    success: true,
    invoiceId,
    invoice: saved ?? { ...placeholder, ...invoiceData },
    extractionMethod: method,
    validation: {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      missingFields: missingFields(invoiceData),
    },
    message: method === 'none'
      ? 'Invoice saved — auto-extraction failed. Please fill details manually.'
      : validation.isValid
        ? `Extracted via ${method}: ${invoiceData.invoice_number}`
        : `Extracted via ${method} with ${missingFields(invoiceData).length} field(s) for review.`,
  });
}

/* ─── Native text extraction (NO external API) ─────────────────────────────── */

async function extractTextNatively(buf: Buffer, mime: string): Promise<string | null> {
  if (mime !== 'application/pdf') return null;

  // pdf-parse v2 via createRequire (bypasses webpack)
  try {
    const { createRequire } = await import('node:module');
    const _req = createRequire(import.meta.url);
    const { PDFParse } = _req('pdf-parse/dist/pdf-parse/cjs/index.cjs');
    const parser = new PDFParse({ verbosity: 0 });
    const result = await parser.load(buf);
    const text = String(result?.text ?? '').trim();
    if (text.length > 20) {
      console.log('[Sales] pdf-parse extracted', text.length, 'chars');
      return text;
    }
  } catch (e: any) {
    console.warn('[Sales] pdf-parse failed:', e.message?.substring(0, 80));
  }

  // Raw PDF byte scan fallback
  try {
    const text = rawPdfTextScan(buf);
    if (text.length > 20) {
      console.log('[Sales] raw scan extracted', text.length, 'chars');
      return text;
    }
  } catch (e: any) {
    console.warn('[Sales] raw scan failed:', e.message?.substring(0, 80));
  }

  return null;
}

function rawPdfTextScan(buf: Buffer): string {
  const content = buf.toString('latin1');
  const parts: string[] = [];
  const btEt = /BT([\s\S]*?)ET/g;
  let m: RegExpExecArray | null;
  while ((m = btEt.exec(content)) !== null) {
    const block = m[1];
    const tj = /\(([^)]{1,300})\)\s*Tj/g;
    let t: RegExpExecArray | null;
    while ((t = tj.exec(block)) !== null) parts.push(decodePdfStr(t[1]));
    const tjArr = /\[([\s\S]*?)\]\s*TJ/g;
    while ((t = tjArr.exec(block)) !== null) {
      const inner = t[1];
      const items = /\(([^)]*)\)/g;
      let it: RegExpExecArray | null;
      while ((it = items.exec(inner)) !== null) parts.push(decodePdfStr(it[1]));
    }
  }
  const ascii = content.match(/[ -~]{12,}/g) ?? [];
  for (const run of ascii) {
    if (/[A-Za-z]{4,}/.test(run) && !/^[\s\d./]+$/.test(run)) parts.push(run);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function decodePdfStr(s: string): string {
  return s
    .replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .trim();
}

/* ─── Mappers ──────────────────────────────────────────────────────────────── */

function mapGemini(d: GeminiSalesData, url: string): Partial<SalesInvoice> {
  return {
    invoice_date: d.invoice_date, voucher_type: d.voucher_type,
    invoice_number: d.invoice_number, invoice_type: d.invoice_type,
    customer_name: d.customer_name, customer_gstin: d.customer_gstin,
    place_of_supply: d.place_of_supply, hsn_sac_code: d.hsn_sac_code,
    quantity: d.quantity, uqc: d.uqc, rate: d.rate,
    local_sales_taxable_18: d.local_sales_taxable_18,
    local_sales_taxable_12: d.local_sales_taxable_12,
    oms_sales_taxable_12: d.oms_sales_taxable_12,
    taxable_value: d.taxable_value, cgst_amount: d.cgst_amount,
    sgst_amount: d.sgst_amount, igst_amount: d.igst_amount,
    tcs_cess: d.tcs_cess, round_off: d.round_off, gross_total: d.gross_total,
    reverse_charge: d.reverse_charge, eway_bill_number: d.eway_bill_number,
    irn: d.irn, invoice_file_url: url,
  };
}

function mapRegex(d: SalesInvoiceData, url: string): Partial<SalesInvoice> {
  const s = (v: string | null | undefined): string | null => {
    if (!v) return null;
    const t = v.trim();
    return (t === '' || t === 'Unknown' || t === 'N/A' || t === '1970-01-01') ? null : t;
  };
  const n = (v: number | string | null | undefined): number | null => {
    if (v === null || v === undefined) return null;
    const p = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : v;
    return isNaN(p) || p === 0 ? null : p;
  };
  return {
    invoice_date: s(d.invoice_date),
    voucher_type: s(d.voucher_type),
    invoice_number: s(d.invoice_number),
    invoice_type: s(d.invoice_type),
    customer_name: s(d.customer_name),
    customer_gstin: s(d.customer_gstin),
    place_of_supply: s(d.place_of_supply),
    hsn_sac_code: s((d as any).hsn_sac_code ?? d.hsn_or_sac),
    quantity: d.quantity ? n(d.quantity) : null,
    uqc: s((d as any).uqc ?? d.unit),
    rate: n(d.rate),
    local_sales_taxable_18: n(d.local_sales_taxable_18 ?? null),
    local_sales_taxable_12: n(d.local_sales_taxable_12 ?? null),
    oms_sales_taxable_12: n(d.oms_sales_taxable_12 ?? null),
    taxable_value: n(d.taxable_value),
    cgst_amount: n((d as any).cgst_amount ?? d.cgst),
    sgst_amount: n((d as any).sgst_amount ?? d.sgst),
    igst_amount: n((d as any).igst_amount ?? d.igst),
    tcs_cess: n(d.cess),
    round_off: n((d as any).round_off ?? null),
    gross_total: n(d.total_invoice_value),
    reverse_charge: d.is_reverse_charge ?? false,
    eway_bill_number: s((d as any).eway_bill_number ?? null),
    irn: s(d.irn ?? null),
    invoice_file_url: url,
  };
}

function finalize(d: Partial<SalesInvoice>, url: string): Partial<SalesInvoice> {
  return {
    ...d,
    invoice_file_url: url,
    extraction_status: (d.invoice_number && d.invoice_date && (d.taxable_value != null || d.gross_total != null))
      ? 'extracted' : 'needs_review',
    gemini_raw_json: { extraction_method: 'pipeline' },
  };
}

function hasAnyData(d: Partial<SalesInvoice>): boolean {
  return !!(d.invoice_number || d.invoice_date || d.customer_name || d.taxable_value || d.gross_total);
}

/* ─── Validation helpers ────────────────────────────────────────────────────── */

function missingFields(d: Partial<SalesInvoice>): string[] {
  const m: string[] = [];
  if (!d.invoice_number) m.push('Invoice Number');
  if (!d.invoice_date)   m.push('Invoice Date');
  if (!d.invoice_type)   m.push('Invoice Type');
  if (!d.customer_name)  m.push('Customer Name');
  if (!d.place_of_supply) m.push('Place of Supply');
  if (d.taxable_value == null) m.push('Taxable Value');
  if (!d.hsn_sac_code)   m.push('HSN/SAC Code');
  return m;
}

function validate(d: Partial<SalesInvoice>) {
  const missing = missingFields(d);
  if (d.invoice_type === 'B2B' && !d.customer_gstin) missing.push('Customer GSTIN');
  return {
    isValid: missing.length === 0,
    errors: missing.map(f => ({ field: f, issue_type: 'missing' as const, detected_value: null, message: `${f} required for GSTR-1` })),
    warnings: d.gross_total == null ? [{ field: 'gross_total', message: 'Gross total not found.' }] : [],
  };
}

function buildRemarks(id: string, v: ReturnType<typeof validate>) {
  return [
    ...v.errors.map(e => ({ sales_id: id, field_name: e.field, issue_type: e.issue_type, detected_value: null as null, expected_value: null as null, comment: e.message, status: 'open' as const })),
    ...v.warnings.map(w => ({ sales_id: id, field_name: w.field, issue_type: 'low_confidence' as const, detected_value: null as null, expected_value: null as null, comment: w.message, status: 'open' as const })),
  ];
}
