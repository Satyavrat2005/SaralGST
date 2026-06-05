import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reconcileDksMarchWithRealBooks } from '@/lib/reconciliation/dksMarchReconciliation';
import type { PurchaseRegisterRow } from '@/lib/gstr2b/types';

/* ─── Auth helper ─────────────────────────────────────────────────────────── */
async function getAuthenticatedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

/* ─── Deduplication ───────────────────────────────────────────────────────── */

/** Same normalisation as the matching engine in reconcileWithPurchase.ts */
function normalizeKey(gstin: string | null | undefined, invoice: string | null | undefined): string {
  const g = (gstin ?? '').toUpperCase().replace(/[\s-]/g, '');
  const i = (invoice ?? '').toUpperCase().replace(/[\s/-]/g, '');
  return `${g}|${i}`;
}

/**
 * Deduplicate purchase_register rows.
 * Strategy: for each (supplier_gstin + invoice_number) key, keep the row with
 * the latest created_at (most recently uploaded). If both created_at values are
 * identical or null, keep the first occurrence.
 *
 * Returns: { deduped: PurchaseRegisterRow[], removed: number }
 */
function deduplicatePurchaseRows(rows: PurchaseRegisterRow[]): {
  deduped: PurchaseRegisterRow[];
  removed: number;
} {
  const seen = new Map<string, { row: PurchaseRegisterRow; ts: number }>();

  for (const row of rows) {
    const key = normalizeKey(row.supplier_gstin, row.invoice_number);

    // Rows with no GSTIN and no invoice number can't be reliably deduped —
    // keep them all (they'll show as "missing in GSTR-2B" anyway).
    if (!row.supplier_gstin && !row.invoice_number) {
      // Give each a unique key so they're not collapsed
      seen.set(`${key}|${row.id}`, { row, ts: 0 });
      continue;
    }

    const ts = row.invoice_date ? new Date(row.invoice_date).getTime() : 0;
    const existing = seen.get(key);
    if (!existing || ts > existing.ts) {
      seen.set(key, { row, ts });
    }
  }

  const deduped = Array.from(seen.values()).map(v => v.row);
  return { deduped, removed: rows.length - deduped.length };
}

/* ─── Map Supabase PurchaseRegister → PurchaseRegisterRow ─────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseToPurchaseRow(r: any): PurchaseRegisterRow {
  return {
    id:                  r.id,
    supplier_gstin:      r.supplier_gstin   ?? null,
    supplier_name:       r.supplier_name    ?? null,
    invoice_number:      r.invoice_number   ?? null,
    invoice_date:        r.invoice_date     ?? null,
    taxable_value:       r.taxable_value    ?? null,
    igst_amount:         r.igst_amount      ?? null,
    cgst_amount:         r.cgst_amount      ?? null,
    sgst_amount:         r.sgst_amount      ?? null,
    cess_amount:         r.cess_amount      ?? null,
    total_invoice_value: r.total_invoice_value ?? null,
    is_itc_eligible:     r.is_itc_eligible  ?? true,
  };
}

/* ─── GET /api/reconciliation/dks-march ───────────────────────────────────── */
export async function GET(req: Request) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const view = url.searchParams.get('view') || 'all';

  // ── 1. Fetch real purchase invoices from Supabase ─────────────────────────
  //    Use service-role to bypass RLS so we get all rows for this tenant demo.
  //    Filter: exclude quarantined (WhatsApp staging) invoices.
  const { createClient: createAdminClient } = await import('@/lib/supabase/server');
  const { data: rawRows, error: dbError } = await supabase
    .from('purchase_register')
    .select(`
      id, supplier_gstin, supplier_name, invoice_number, invoice_date,
      taxable_value, igst_amount, cgst_amount, sgst_amount, cess_amount,
      total_invoice_value, is_itc_eligible, invoice_status, created_at
    `)
    .neq('invoice_status', 'wa_quarantine')
    .order('created_at', { ascending: false });

  let purchaseRows: PurchaseRegisterRow[] = [];
  let duplicatesRemoved = 0;
  let purchaseSource: 'supabase' | 'seed' | 'empty' = 'empty';

  if (dbError) {
    console.error('[Recon] Supabase fetch error:', dbError.message);
    // Fall through to seed fallback
  } else if (rawRows && rawRows.length > 0) {
    const mapped = rawRows.map(mapSupabaseToPurchaseRow);
    const { deduped, removed } = deduplicatePurchaseRows(mapped);
    purchaseRows = deduped;
    duplicatesRemoved = removed;
    purchaseSource = 'supabase';
    console.log(
      `[Recon] Supabase: ${rawRows.length} rows → ${deduped.length} after dedup (${removed} dupes removed)`
    );
  }

  // ── 2. Run the reconciliation engine ─────────────────────────────────────
  const result = reconcileDksMarchWithRealBooks(purchaseRows, purchaseSource);
  if (!result) {
    return NextResponse.json(
      {
        error: "DKS GSTR-2B file not found. Place 'DKS - GSTR-2B_MAR'25 - FINAL.xlsx' in the project public folder.",
      },
      { status: 404 }
    );
  }

  // Attach dedup info
  result.duplicatesRemoved = duplicatesRemoved;

  // ── 3. Return requested view ──────────────────────────────────────────────
  const { recon, gstr1Meta, sources, period } = result;
  const meta = {
    period,
    sources,
    gstr1Meta,
    purchaseSource,
    purchaseCount: result.purchaseCount,
    duplicatesRemoved,
    stats: recon.stats,
  };

  if (view === 'matched') {
    return NextResponse.json({ ...meta, data: recon.matchedPairs });
  }
  if (view === 'partial') {
    return NextResponse.json({ ...meta, data: recon.partialMatches });
  }
  if (view === 'missing-gstr2b') {
    return NextResponse.json({ ...meta, data: recon.missingInGstr2b });
  }
  if (view === 'missing-books') {
    return NextResponse.json({ ...meta, data: recon.missingInBooks });
  }

  return NextResponse.json({
    ...meta,
    matched:           recon.matchedPairs,
    partial:           recon.partialMatches,
    missing_in_gstr2b: recon.missingInGstr2b,
    missing_in_books:  recon.missingInBooks,
  });
}
