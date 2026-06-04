import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  requestOTP,
  getAuthToken,
  saveGSTR1,
  submitGSTR1,
  fileGSTR1,
  getGSTR2B,
  generateGSTR2BOnDemand,
  getGSTR2BSummary,
  pollGstr2bGeneration,
  saveGSTR3B,
  MASTERGST_CONFIG,
  getFinancialYear,
  parseReturnPeriod,
  getPortalFilerConfig,
  resolveMasterGstConfig,
} from '@/lib/services/masterGSTService';
import {
  buildGstr1ReturnData,
  buildGstnPayload,
  mapSalesInvoiceToGstr1,
  validateGstr1Return,
  getPortalGstinIssues,
  getReturnPeriodDateRange,
  invoiceDateInPeriod,
  buildDksMarchMockInvoices,
  type BusinessProfileContext,
  type Gstr1ReturnData,
  type Gstr1InvoiceInsert,
} from '@/lib/gstr1';
import { DKS_MARCH_PERIOD } from '@/lib/reconciliation/dksMarchConstants';
import {
  parseGstr2bResponse,
  buildGstr2bReturnData,
  reconcileGstr2bWithPurchase,
  formatPeriodLabel,
  getStaticGstr2bPortalResponse,
  buildSandboxPurchaseRows,
  purchaseSeedKey,
  toGstr2bDbRows,
  type Gstr2bReturnData,
} from '@/lib/gstr2b';

function sanitizeGstr2bReturnDataForClient(data: Gstr2bReturnData): Gstr2bReturnData {
  const { diagnostics: _diagnostics, portal_summary: _portalSummary, ...rest } = data;
  return rest;
}

function isMasterGstSuccess(data: Record<string, unknown>): boolean {
  return (
    data.status_cd === '1' ||
    data.status_cd === 1 ||
    data.status === 'Success' ||
    data.success === true
  );
}

function extractPortalErrorCode(result: Record<string, unknown>): string | undefined {
  const err = result.error as { error_cd?: string } | undefined;
  return err?.error_cd || (result.error_cd as string | undefined);
}

function getPortalErrorFromResult(result: Record<string, unknown>): { code?: string; message: string } {
  const code = extractPortalErrorCode(result);
  const err = result.error as { message?: string } | undefined;
  const message =
    err?.message ||
    (typeof result.status_desc === 'string' ? result.status_desc : undefined) ||
    'Portal request failed';
  return { code, message };
}

async function fetchGstr2bWithGeneration(
  period: string,
  txn: string,
  portalConfig: ReturnType<typeof getPortalFilerConfig>
) {
  let result = await getGSTR2B(period, txn, portalConfig);
  if (result?.error === true) {
    return { error: result.message || 'Failed to fetch GSTR-2B', status: 500 as const };
  }

  if (!isMasterGstSuccess(result)) {
    const errorCode = extractPortalErrorCode(result);
    const errorMessage =
      (result.error as { message?: string })?.message ||
      (result.message as string) ||
      'Failed to fetch GSTR-2B';

    if (errorCode === 'GTR2B-002') {
      const generationResult = await generateGSTR2BOnDemand(period, txn, portalConfig);
      if (generationResult?.error === true) {
        return {
          error: generationResult.message || 'Failed to request GSTR-2B generation',
          status: 500 as const,
        };
      }

      if (!isMasterGstSuccess(generationResult)) {
        const genErr = getPortalErrorFromResult(generationResult);
        return {
          error: genErr.message,
          code: genErr.code,
          status: 409 as const,
        };
      }

      const intTranId =
        generationResult.data?.int_tran_id ||
        generationResult.int_tran_id ||
        generationResult.data?.intTranId;

      if (intTranId) {
        const poll = await pollGstr2bGeneration(String(intTranId), txn, portalConfig);
        if (poll.ready) {
          result = await getGSTR2B(period, txn, portalConfig);
          if (result?.error === true) {
            return { error: result.message || 'Failed to fetch GSTR-2B after generation', status: 500 as const };
          }
          if (isMasterGstSuccess(result)) {
            return { result, generationRequested: true, polled: true };
          }
        }
      }

      return {
        error: 'GSTR-2B is not available yet. Generation has been requested; please try again shortly.',
        code: 'GSTR2B_GENERATING',
        generationRequested: true,
        status: 409 as const,
      };
    }

    return { error: errorMessage, code: errorCode, status: 409 as const };
  }

  return { result, generationRequested: false, polled: false };
}

async function persistGstr2bFetch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  period: string,
  portalConfig: ReturnType<typeof getPortalFilerConfig>,
  result: Record<string, unknown>,
  options: {
    portalSummary?: unknown;
    generationRequested?: boolean;
    priorRecon?: Gstr2bReturnData['reconciliation'];
    source?: 'portal';
    seedPurchaseBooks?: boolean;
    portalErrorCode?: string;
    portalErrorMessage?: string;
    requestedPeriod?: string;
  } = {}
) {
  const { month, year } = parseReturnPeriod(period);
  const fy = getFinancialYear(month, year);

  const existingReturn = await supabase
    .from('gst_returns')
    .select('id, return_data')
    .eq('user_id', userId)
    .eq('return_type', 'GSTR2B')
    .eq('return_period', period)
    .maybeSingle();

  let returnId: string;
  const priorRecon =
    options.priorRecon ??
    (existingReturn.data?.return_data as Gstr2bReturnData | null)?.reconciliation;

  if (existingReturn.data?.id) {
    returnId = existingReturn.data.id;
    await supabase.from('gstr2b_data').delete().eq('return_id', returnId);
  } else {
    const { data: newReturn, error: createErr } = await supabase
      .from('gst_returns')
      .insert({
        user_id: userId,
        gstin: portalConfig.gstin,
        return_type: 'GSTR2B',
        return_period: period,
        financial_year: fy,
        status: 'generated',
      })
      .select('id')
      .single();
    if (createErr) throw new Error(createErr.message);
    returnId = newReturn!.id;
  }

  const gstr2bInvoices = parseGstr2bResponse(result, returnId, userId);
  const returnData = buildGstr2bReturnData(gstr2bInvoices, period, options.portalSummary);
  returnData.diagnostics = {
    recordsParsed: gstr2bInvoices.length,
    generationRequested: options.generationRequested,
    emptyPortal: gstr2bInvoices.length === 0,
    source: options.source || 'portal',
    portalErrorCode: options.portalErrorCode,
    portalErrorMessage: options.portalErrorMessage,
    requestedPeriod: options.requestedPeriod,
  };
  if (priorRecon) returnData.reconciliation = priorRecon;

  if (gstr2bInvoices.length > 0) {
    const { error: insertErr } = await supabase.from('gstr2b_data').insert(toGstr2bDbRows(gstr2bInvoices));
    if (insertErr) throw new Error(insertErr.message);
  }

  let purchaseSeeded = 0;
  if (options.seedPurchaseBooks && gstr2bInvoices.length > 0) {
    const seed = await seedSandboxPurchaseBooks(supabase, gstr2bInvoices, period, portalConfig.gstin);
    purchaseSeeded = seed.inserted;
  }

  const totals = gstr2bInvoices.reduce(
    (acc, inv) => ({
      taxable: acc.taxable + (inv.taxable_value || 0),
      igst: acc.igst + (inv.igst_amount || 0),
      cgst: acc.cgst + (inv.cgst_amount || 0),
      sgst: acc.sgst + (inv.sgst_amount || 0),
      cess: acc.cess + (inv.cess_amount || 0),
    }),
    { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }
  );

  await supabase
    .from('gst_returns')
    .update({
      status: 'generated',
      total_taxable_value: totals.taxable,
      total_igst: totals.igst,
      total_cgst: totals.cgst,
      total_sgst: totals.sgst,
      total_cess: totals.cess,
      total_tax: totals.igst + totals.cgst + totals.sgst + totals.cess,
      total_invoices: gstr2bInvoices.length,
      return_data: returnData,
      api_response: result,
      updated_at: new Date().toISOString(),
    })
    .eq('id', returnId);

  return { returnId, gstr2bInvoices, returnData, totals, purchaseSeeded };
}

async function seedSandboxPurchaseBooks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gstr2bRows: ReturnType<typeof parseGstr2bResponse>,
  period: string,
  buyerGstin: string
): Promise<{ inserted: number; skipped: number }> {
  const { startDate, endDate } = getReturnPeriodDateRange(period);
  const { data: existing } = await supabase
    .from('purchase_register')
    .select('supplier_name, supplier_gstin, invoice_number, invoice_date')
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate);

  const existingKeys = new Set(
    (existing || []).map((p) =>
      purchaseSeedKey({
        source: 'manual',
        supplier_name: null,
        supplier_gstin: p.supplier_gstin,
        invoice_number: p.invoice_number,
        invoice_date: p.invoice_date ? String(p.invoice_date).slice(0, 10) : null,
        invoice_type: 'B2B',
        buyer_gstin: buyerGstin,
        taxable_value: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        cess_amount: 0,
        total_invoice_value: 0,
        is_itc_eligible: true,
        invoice_status: 'verified',
      })
    )
  );

  const candidates = buildSandboxPurchaseRows(gstr2bRows, buyerGstin);
  const toInsert = candidates.filter((row) => !existingKeys.has(purchaseSeedKey(row)));

  if (toInsert.length > 0) {
    const { error } = await supabase.from('purchase_register').insert(toInsert);
    if (error) throw new Error(error.message);
  }

  return { inserted: toInsert.length, skipped: candidates.length - toInsert.length };
}

function getPortalErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const maybeError = error as { message?: unknown; error_cd?: unknown };
    if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
      return typeof maybeError.error_cd === 'string' && maybeError.error_cd.trim()
        ? `${maybeError.message} (${maybeError.error_cd})`
        : maybeError.message;
    }
  }
  return fallback;
}

async function getAuthenticatedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (user) return user;
  if (!error) return null;

  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

async function loadBusinessProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<BusinessProfileContext> {
  const { data } = await supabase
    .from('business_profiles')
    .select('gstin, legal_name, trade_name, state, annual_turnover_range')
    .eq('user_id', userId)
    .single();

  const gstin = data?.gstin?.trim().toUpperCase() || MASTERGST_CONFIG.gstin;
  return {
    gstin,
    legal_name: data?.legal_name ?? null,
    trade_name: data?.trade_name ?? null,
    state_cd: gstin.substring(0, 2),
    annual_turnover_range: data?.annual_turnover_range ?? null,
  };
}

async function getPortalTxn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  gstin: string
) {
  const { data: tokenData } = await supabase
    .from('mastergst_auth_tokens')
    .select('txn, expires_at')
    .eq('user_id', userId)
    .eq('gstin', gstin)
    .single();

  if (!tokenData?.txn || (tokenData.expires_at && new Date(tokenData.expires_at) < new Date())) {
    return null;
  }
  return tokenData.txn;
}

// GET /api/returns?action=...&type=...&period=...
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const returnType = url.searchParams.get('type');
  const period = url.searchParams.get('period');

  try {
    switch (action) {
      // ============ LIST RETURNS ============
      case 'list': {
        let query = supabase
          .from('gst_returns')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (returnType) query = query.eq('return_type', returnType);
        if (period) query = query.eq('return_period', period);
        if (user) query = query.eq('user_id', user.id);
        
        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      // ============ GET SPECIFIC RETURN ============
      case 'get': {
        const returnId = url.searchParams.get('id');
        if (!returnId) return NextResponse.json({ error: 'Missing return ID' }, { status: 400 });
        
        const { data, error } = await supabase
          .from('gst_returns')
          .select('*')
          .eq('id', returnId)
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      // ============ GET GSTR1 INVOICES ============
      case 'gstr1-invoices': {
        if (!period) return NextResponse.json({ error: 'Missing period' }, { status: 400 });
        
        // First find the return record for this period to get return_id
        const { data: returnRecord } = await supabase
          .from('gst_returns')
          .select('id')
          .eq('return_type', 'GSTR1')
          .eq('return_period', period)
          .eq('user_id', user?.id)
          .single();
        
        if (!returnRecord) {
          return NextResponse.json({ data: [] });
        }
        
        const { data, error } = await supabase
          .from('gstr1_invoices')
          .select('*')
          .eq('return_id', returnRecord.id)
          .order('created_at', { ascending: false });
        
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      // ============ GET GSTR2B DATA ============
      case 'gstr2b-data': {
        const returnId = url.searchParams.get('id');
        let query = supabase
          .from('gstr2b_data')
          .select('*')
          .order('invoice_date', { ascending: false });
        
        if (returnId) query = query.eq('return_id', returnId);
        if (user) query = query.eq('user_id', user.id);
        
        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      // ============ GSTR2B RETURN SUMMARY ============
      case 'gstr2b-summary': {
        const returnId = url.searchParams.get('returnId');
        if (!returnId || !user) {
          return NextResponse.json({ error: 'Missing returnId' }, { status: 400 });
        }
        const { data: returnRecord, error } = await supabase
          .from('gst_returns')
          .select('id, return_data, return_period, status, updated_at, total_invoices')
          .eq('id', returnId)
          .eq('user_id', user.id)
          .eq('return_type', 'GSTR2B')
          .single();
        if (error || !returnRecord) {
          return NextResponse.json({ error: 'Return not found' }, { status: 404 });
        }
        return NextResponse.json({
          data: sanitizeGstr2bReturnDataForClient(returnRecord.return_data as Gstr2bReturnData),
          return: returnRecord,
        });
      }

      // ============ RECONCILIATION RESULTS ============
      case 'reconciliation-results': {
        const returnId = url.searchParams.get('returnId');
        const view = url.searchParams.get('view') || 'all';
        if (!returnId || !user) {
          return NextResponse.json({ error: 'Missing returnId' }, { status: 400 });
        }

        const { data: returnRow } = await supabase
          .from('gst_returns')
          .select('return_data, return_period')
          .eq('id', returnId)
          .eq('user_id', user.id)
          .single();

        if (!returnRow) return NextResponse.json({ error: 'Return not found' }, { status: 404 });

        const { data: gstr2bRows } = await supabase
          .from('gstr2b_data')
          .select('*')
          .eq('return_id', returnId);

        const { startDate, endDate } = getReturnPeriodDateRange(returnRow.return_period);
        const { data: purchaseRows } = await supabase
          .from('purchase_register')
          .select('*')
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate);

        const recon = reconcileGstr2bWithPurchase(
          (gstr2bRows || []) as Parameters<typeof reconcileGstr2bWithPurchase>[0],
          purchaseRows || []
        );

        if (view === 'matched') {
          return NextResponse.json({ data: recon.matchedPairs, stats: recon.stats });
        }
        if (view === 'partial') {
          return NextResponse.json({ data: recon.partialMatches, stats: recon.stats });
        }
        if (view === 'missing-gstr2b') {
          return NextResponse.json({ data: recon.missingInGstr2b, stats: recon.stats });
        }
        if (view === 'missing-books') {
          return NextResponse.json({ data: recon.missingInBooks, stats: recon.stats });
        }
        if (view === 'vendor-summary') {
          const byVendor = new Map<string, { name: string; gstr2b: number; books: number; value: number; total: number }>();
          recon.missingInBooks.forEach((g) => {
            const key = g.supplier_gstin || g.supplier_name || 'Unknown';
            const cur = byVendor.get(key) || { name: g.supplier_name || key, gstr2b: 0, books: 0, value: 0, total: 0 };
            cur.gstr2b += 1;
            cur.total += 1;
            byVendor.set(key, cur);
          });
          recon.missingInGstr2b.forEach((p) => {
            const key = p.supplier_gstin || p.supplier_name || 'Unknown';
            const cur = byVendor.get(key) || { name: p.supplier_name || key, gstr2b: 0, books: 0, value: 0, total: 0 };
            cur.books += 1;
            cur.total += 1;
            byVendor.set(key, cur);
          });
          recon.partialMatches.forEach(({ gstr2b: g }) => {
            const key = g.supplier_gstin || g.supplier_name || 'Unknown';
            const cur = byVendor.get(key) || { name: g.supplier_name || key, gstr2b: 0, books: 0, value: 0, total: 0 };
            cur.value += 1;
            cur.total += 1;
            byVendor.set(key, cur);
          });
          return NextResponse.json({
            data: Array.from(byVendor.values()).sort((a, b) => b.total - a.total),
            stats: recon.stats,
            return_data: returnRow.return_data,
          });
        }

        return NextResponse.json({
          stats: recon.stats,
          return_data: returnRow.return_data,
          matched: recon.matchedPairs,
          partial: recon.partialMatches,
          missing_in_gstr2b: recon.missingInGstr2b,
          missing_in_books: recon.missingInBooks,
        });
      }

      // ============ GET GSTR3B DATA ============
      case 'gstr3b-data': {
        const returnId = url.searchParams.get('id');
        if (!returnId) return NextResponse.json({ error: 'Missing return ID' }, { status: 400 });
        
        const { data, error } = await supabase
          .from('gstr3b_data')
          .select('*')
          .eq('return_id', returnId)
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      // ============ GSTR1 RETURN SUMMARY (return_data JSON) ============
      case 'gstr1-summary': {
        if (!period || !user) return NextResponse.json({ error: 'Missing period or user' }, { status: 400 });
        const { data: returnRecord } = await supabase
          .from('gst_returns')
          .select('id, return_data, gstin, financial_year, status')
          .eq('return_type', 'GSTR1')
          .eq('return_period', period)
          .eq('user_id', user.id)
          .single();
        if (!returnRecord) return NextResponse.json({ data: null });
        return NextResponse.json({ data: returnRecord.return_data, return: returnRecord });
      }

      // ============ GENERATE GSTR1 FROM SALES REGISTER ============
      case 'generate-gstr1': {
        if (!period || !user) return NextResponse.json({ error: 'Missing period or user' }, { status: 400 });

        try {
          const profile = await loadBusinessProfile(supabase, user.id);
          const { startDate, endDate, month, year } = getReturnPeriodDateRange(period);
          const fy = getFinancialYear(month, year);

          // Sales uploads often have null user_id (admin insert) — include owned + unassigned rows
          const { data: salesRows, error: salesErr } = await supabase
            .from('sales_invoices')
            .select('*')
            .or(`user_id.eq.${user.id},user_id.is.null`);

          if (salesErr) {
            console.error('[GSTR-1 Generate] sales_invoices query error:', salesErr);
            return NextResponse.json({ error: salesErr.message }, { status: 500 });
          }

          const salesInPeriod = (salesRows || []).filter((inv) =>
            invoiceDateInPeriod(inv.invoice_date, startDate, endDate)
          );

          const { count: totalSalesCount } = await supabase
            .from('sales_invoices')
            .select('id', { count: 'exact', head: true })
            .or(`user_id.eq.${user.id},user_id.is.null`);

          const existingReturn = await supabase
            .from('gst_returns')
            .select('id')
            .eq('user_id', user.id)
            .eq('return_type', 'GSTR1')
            .eq('return_period', period)
            .maybeSingle();

          let returnId: string;

          if (existingReturn.data?.id) {
            returnId = existingReturn.data.id;
            await supabase.from('gstr1_invoices').delete().eq('return_id', returnId);
          } else {
            const { data: newReturn, error: createErr } = await supabase
              .from('gst_returns')
              .insert({
                user_id: user.id,
                gstin: profile.gstin,
                return_type: 'GSTR1',
                return_period: period,
                financial_year: fy,
                status: 'draft',
              })
              .select('id')
              .single();
            if (createErr) {
              console.error('[GSTR-1 Generate] create return error:', createErr);
              return NextResponse.json({ error: createErr.message }, { status: 500 });
            }
            returnId = newReturn!.id;
          }

          // Claim legacy rows without user_id for this account
          const unassignedIds = salesInPeriod.filter((inv) => !inv.user_id).map((inv) => inv.id);
          if (unassignedIds.length > 0) {
            await supabase
              .from('sales_invoices')
              .update({ user_id: user.id })
              .in('id', unassignedIds);
          }

          let gstr1Invoices: Gstr1InvoiceInsert[] = salesInPeriod.map((inv) =>
            mapSalesInvoiceToGstr1(inv, profile, returnId, user.id)
          );

          const usedDksDemo =
            gstr1Invoices.length === 0 && period === DKS_MARCH_PERIOD;
          if (usedDksDemo) {
            gstr1Invoices = buildDksMarchMockInvoices(returnId, user.id);
          }

          if (gstr1Invoices.length > 0) {
            const { error: insertErr } = await supabase.from('gstr1_invoices').insert(gstr1Invoices);
            if (insertErr) {
              console.error('[GSTR-1 Generate] insert gstr1_invoices error:', insertErr);
              return NextResponse.json({ error: insertErr.message }, { status: 500 });
            }
          }

          const returnData = buildGstr1ReturnData(gstr1Invoices, profile, fy, period);
          const totals = returnData.total_liability;

          const { error: updateErr } = await supabase
            .from('gst_returns')
            .update({
              gstin: profile.gstin,
              status: 'generated',
              total_taxable_value: totals.value,
              total_igst: totals.igst,
              total_cgst: totals.cgst,
              total_sgst: totals.sgst,
              total_cess: totals.cess,
              total_tax: totals.igst + totals.cgst + totals.sgst + totals.cess,
              total_invoices: gstr1Invoices.length,
              return_data: returnData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', returnId);

          if (updateErr) {
            console.error('[GSTR-1 Generate] update return error:', updateErr);
            return NextResponse.json({ error: updateErr.message }, { status: 500 });
          }

          const diagnostics = {
            period,
            dateRange: { startDate, endDate },
            salesInPeriod: salesInPeriod.length,
            salesTotal: totalSalesCount ?? 0,
            unassignedClaimed: unassignedIds.length,
            dksMarchDemo: usedDksDemo,
          };

          return NextResponse.json({
            success: true,
            returnId,
            totalInvoices: gstr1Invoices.length,
            returnData,
            diagnostics,
            message:
              gstr1Invoices.length === 0
                ? `No sales invoices found between ${startDate} and ${endDate}. Upload invoices in Sales Register for this month.`
                : usedDksDemo
                  ? 'GSTR-1 draft generated using DKS March 2025 demo data.'
                  : undefined,
            totals: {
              taxable: totals.value,
              igst: totals.igst,
              cgst: totals.cgst,
              sgst: totals.sgst,
              cess: totals.cess,
            },
          });
        } catch (err: unknown) {
          console.error('[GSTR-1 Generate] unexpected error:', err);
          const message = err instanceof Error ? err.message : 'Failed to generate GSTR-1';
          return NextResponse.json({ error: message }, { status: 500 });
        }
      }

      // ============ GENERATE GSTR3B FROM REGISTERS ============
      case 'generate-gstr3b': {
        if (!period || !user) return NextResponse.json({ error: 'Missing period or user' }, { status: 400 });
        
        const { month, year } = parseReturnPeriod(period);
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        
        // Fetch sales invoices for output tax computation (include null user_id for legacy data)
        const { data: salesInvoices } = await supabase
          .from('sales_invoices')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate);

        // Fetch purchase invoices for ITC computation (purchase_register has no user_id column)
        const { data: purchaseInvoices } = await supabase
          .from('purchase_register')
          .select('*')
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate);

        // Compute Section 3.1 totals from sales
        const sales = salesInvoices || [];
        const sec_3_1_a = sales.filter((s: any) => !s.reverse_charge);
        const sec_3_1_d = (purchaseInvoices || []).filter((p: any) => p.is_reverse_charge);

        const s31a = sec_3_1_a.reduce((acc: any, s: any) => ({
          taxable: acc.taxable + (s.taxable_value || 0),
          igst: acc.igst + (s.igst_amount || 0),
          cgst: acc.cgst + (s.cgst_amount || 0),
          sgst: acc.sgst + (s.sgst_amount || 0),
          cess: acc.cess + (s.tcs_cess || 0),
        }), { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });

        const s31d = sec_3_1_d.reduce((acc: any, p: any) => ({
          taxable: acc.taxable + (p.taxable_value || 0),
          igst: acc.igst + (p.igst_amount || 0),
          cgst: acc.cgst + (p.cgst_amount || 0),
          sgst: acc.sgst + (p.sgst_amount || 0),
          cess: acc.cess + (p.cess_amount || 0),
        }), { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });

        // Compute Section 4 ITC — prefer GSTR-2B when fetched for period
        const { data: gstr2bReturn } = await supabase
          .from('gst_returns')
          .select('id')
          .eq('user_id', user.id)
          .eq('return_type', 'GSTR2B')
          .eq('return_period', period)
          .maybeSingle();

        let itcSource: 'gstr2b' | 'purchase_register' = 'purchase_register';
        let itc = { igst: 0, cgst: 0, sgst: 0, cess: 0 };

        if (gstr2bReturn?.id) {
          const { data: gstr2bRows } = await supabase
            .from('gstr2b_data')
            .select('itc_eligible, itc_igst, itc_cgst, itc_sgst, itc_cess')
            .eq('return_id', gstr2bReturn.id);

          const eligible2b = (gstr2bRows || []).filter((r) => r.itc_eligible !== false);
          if (eligible2b.length > 0) {
            itcSource = 'gstr2b';
            itc = eligible2b.reduce(
              (acc, r) => ({
                igst: acc.igst + (r.itc_igst || 0),
                cgst: acc.cgst + (r.itc_cgst || 0),
                sgst: acc.sgst + (r.itc_sgst || 0),
                cess: acc.cess + (r.itc_cess || 0),
              }),
              { igst: 0, cgst: 0, sgst: 0, cess: 0 }
            );
          }
        }

        if (itcSource === 'purchase_register') {
          const eligiblePurchases = (purchaseInvoices || []).filter((p: { is_itc_eligible?: boolean }) => p.is_itc_eligible);
          itc = eligiblePurchases.reduce(
            (acc: { igst: number; cgst: number; sgst: number; cess: number }, p: { igst_amount?: number; cgst_amount?: number; sgst_amount?: number; cess_amount?: number }) => ({
              igst: acc.igst + (p.igst_amount || 0),
              cgst: acc.cgst + (p.cgst_amount || 0),
              sgst: acc.sgst + (p.sgst_amount || 0),
              cess: acc.cess + (p.cess_amount || 0),
            }),
            { igst: 0, cgst: 0, sgst: 0, cess: 0 }
          );
        }

        // Create/update return
        const existingReturn = await supabase
          .from('gst_returns')
          .select('id')
          .eq('user_id', user.id)
          .eq('return_type', 'GSTR3B')
          .eq('return_period', period)
          .single();

        let returnId: string;
        const fy = getFinancialYear(month, year);

        if (existingReturn.data) {
          returnId = existingReturn.data.id;
          await supabase.from('gstr3b_data').delete().eq('return_id', returnId);
        } else {
          const { data: newReturn, error: createErr } = await supabase
            .from('gst_returns')
            .insert({
              user_id: user.id,
              gstin: MASTERGST_CONFIG.gstin,
              return_type: 'GSTR3B',
              return_period: period,
              financial_year: fy,
              status: 'draft',
            })
            .select('id')
            .single();
          if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
          returnId = newReturn.id;
        }

        // Compute payment section
        const totalOutputTax = {
          igst: s31a.igst + s31d.igst,
          cgst: s31a.cgst + s31d.cgst,
          sgst: s31a.sgst + s31d.sgst,
          cess: s31a.cess + s31d.cess,
        };
        const totalITC = itc;
        
        const cashPayable = {
          igst: Math.max(0, totalOutputTax.igst - totalITC.igst),
          cgst: Math.max(0, totalOutputTax.cgst - totalITC.cgst),
          sgst: Math.max(0, totalOutputTax.sgst - totalITC.sgst),
          cess: Math.max(0, totalOutputTax.cess - totalITC.cess),
        };

        // Insert GSTR3B data
        const { error: insertErr } = await supabase
          .from('gstr3b_data')
          .insert({
            return_id: returnId,
            user_id: user.id,
            sec_3_1_a_taxable: s31a.taxable,
            sec_3_1_a_igst: s31a.igst,
            sec_3_1_a_cgst: s31a.cgst,
            sec_3_1_a_sgst: s31a.sgst,
            sec_3_1_a_cess: s31a.cess,
            sec_3_1_d_taxable: s31d.taxable,
            sec_3_1_d_igst: s31d.igst,
            sec_3_1_d_cgst: s31d.cgst,
            sec_3_1_d_sgst: s31d.sgst,
            sec_3_1_d_cess: s31d.cess,
            sec_4_a5_igst: itc.igst,
            sec_4_a5_cgst: itc.cgst,
            sec_4_a5_sgst: itc.sgst,
            sec_4_a5_cess: itc.cess,
            sec_6_1_igst_tax: totalOutputTax.igst,
            sec_6_1_igst_itc: Math.min(totalOutputTax.igst, totalITC.igst),
            sec_6_1_igst_cash: cashPayable.igst,
            sec_6_1_cgst_tax: totalOutputTax.cgst,
            sec_6_1_cgst_itc: Math.min(totalOutputTax.cgst, totalITC.cgst),
            sec_6_1_cgst_cash: cashPayable.cgst,
            sec_6_1_sgst_tax: totalOutputTax.sgst,
            sec_6_1_sgst_itc: Math.min(totalOutputTax.sgst, totalITC.sgst),
            sec_6_1_sgst_cash: cashPayable.sgst,
            sec_6_1_cess_tax: totalOutputTax.cess,
            sec_6_1_cess_cash: cashPayable.cess,
          });
        
        if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

        const totalTax = totalOutputTax.igst + totalOutputTax.cgst + totalOutputTax.sgst + totalOutputTax.cess;
        const totalCash = cashPayable.igst + cashPayable.cgst + cashPayable.sgst + cashPayable.cess;
        
        await supabase
          .from('gst_returns')
          .update({
            status: 'generated',
            total_taxable_value: s31a.taxable + s31d.taxable,
            total_igst: totalOutputTax.igst,
            total_cgst: totalOutputTax.cgst,
            total_sgst: totalOutputTax.sgst,
            total_cess: totalOutputTax.cess,
            total_tax: totalTax,
            total_invoices: sales.length,
            return_data: { itc_source: itcSource, generated_at: new Date().toISOString() },
          })
          .eq('id', returnId);

        return NextResponse.json({
          success: true,
          returnId,
          outputTax: totalOutputTax,
          itcAvailable: totalITC,
          itcSource,
          cashPayable,
          totalTax,
          totalCash,
          warning:
            itcSource === 'purchase_register'
              ? 'GSTR-2B not fetched for this period — ITC computed from purchase register.'
              : undefined,
        });
      }

      // ============ FILING HISTORY ============
      case 'history': {
        const fy = url.searchParams.get('fy');
        let query = supabase
          .from('gst_returns')
          .select('*')
          .order('filed_date', { ascending: false });
        
        if (user) query = query.eq('user_id', user.id);
        if (fy) query = query.eq('financial_year', fy);
        if (returnType) query = query.eq('return_type', returnType);
        
        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      // ============ CHECK AUTH TOKEN ============
      case 'check-auth': {
        if (!user) return NextResponse.json({ authenticated: false });
        const { data: tokenData } = await supabase
          .from('mastergst_auth_tokens')
          .select('txn, expires_at')
          .eq('user_id', user.id)
          .eq('gstin', MASTERGST_CONFIG.gstin)
          .single();
        
        if (!tokenData?.txn || !tokenData?.expires_at) {
          return NextResponse.json({ authenticated: false });
        }
        // Check if token is expired (if expires_at is set)
        if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
          return NextResponse.json({ authenticated: false, reason: 'expired' });
        }
        return NextResponse.json({ authenticated: true, expires_at: tokenData.expires_at, txn: tokenData.txn });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/returns - Create/Update/File returns
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      // ============ REQUEST OTP ============
      case 'request-otp': {
        console.log('[Returns API] Requesting OTP...');
        const result = await requestOTP();
        console.log('[Returns API] OTP result:', JSON.stringify(result).substring(0, 300));
        if (!result.success && result.error?.includes('Maximum session allowed')) {
          const { data: existingToken } = await supabase
            .from('mastergst_auth_tokens')
            .select('txn, expires_at')
            .eq('user_id', user.id)
            .eq('gstin', MASTERGST_CONFIG.gstin)
            .single();

          if (existingToken?.txn && existingToken.expires_at && new Date(existingToken.expires_at) > new Date()) {
            return NextResponse.json({
              success: true,
              alreadyAuthenticated: true,
              txn: existingToken.txn,
              expires_at: existingToken.expires_at,
            });
          }
        }
        if (result.success) {
          // Store txn for later use
          const { error: upsertErr } = await supabase.from('mastergst_auth_tokens').upsert({
            user_id: user.id,
            gstin: MASTERGST_CONFIG.gstin,
            txn: result.txn,
          }, { onConflict: 'user_id,gstin' });
          if (upsertErr) {
            console.error('[Returns API] Failed to store txn:', upsertErr);
          }
        }
        return NextResponse.json(result);
      }

      // ============ VERIFY OTP & GET AUTH TOKEN ============
      case 'verify-otp': {
        const { otp } = body;
        console.log('[Returns API] Verifying OTP...');
        // Get stored txn
        const { data: tokenData } = await supabase
          .from('mastergst_auth_tokens')
          .select('txn')
          .eq('user_id', user.id)
          .eq('gstin', MASTERGST_CONFIG.gstin)
          .single();
        
        if (!tokenData?.txn) {
          return NextResponse.json({ error: 'No pending OTP request. Please request OTP first.' }, { status: 400 });
        }

        console.log('[Returns API] Using txn:', tokenData.txn);
        const result = await getAuthToken(otp, tokenData.txn);
        console.log('[Returns API] Auth result:', JSON.stringify(result).substring(0, 300));
        if (result.success) {
          const { error: upsertErr } = await supabase.from('mastergst_auth_tokens').upsert({
            user_id: user.id,
            gstin: MASTERGST_CONFIG.gstin,
            auth_token: result.authToken || null,
            txn: result.txn || tokenData.txn,
            expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hrs
          }, { onConflict: 'user_id,gstin' });
          if (upsertErr) {
            console.error('[Returns API] verify-otp: Failed to store auth token:', upsertErr);
            // Do NOT fail the request — auth token is valid, just couldn't persist
          } else {
            console.log('[Returns API] Auth token stored for user:', user.id);
          }
        }
        return NextResponse.json(result);
      }

      // ============ PREVIEW GSTR1 JSON ============
      case 'preview-gstr1-json': {
        const { returnId, period } = body;
        const profile = await loadBusinessProfile(supabase, user.id);
        const { data: returnRow } = await supabase
          .from('gst_returns')
          .select('return_data')
          .eq('id', returnId)
          .eq('user_id', user.id)
          .single();
        const { data: invoices } = await supabase
          .from('gstr1_invoices')
          .select('*')
          .eq('return_id', returnId);
        const returnData = (returnRow?.return_data || {}) as Gstr1ReturnData;
        const portalConfig = getPortalFilerConfig();
        const payload = buildGstnPayload(invoices || [], returnData, period, portalConfig.gstin);
        return NextResponse.json({ payload });
      }

      // ============ VALIDATE GSTR1 ============
      case 'validate-gstr1': {
        const { returnId } = body;
        if (!returnId) return NextResponse.json({ error: 'Missing returnId' }, { status: 400 });

        const profile = await loadBusinessProfile(supabase, user.id);
        const { data: returnRow } = await supabase
          .from('gst_returns')
          .select('id, return_data, return_period')
          .eq('id', returnId)
          .eq('user_id', user.id)
          .single();

        if (!returnRow) return NextResponse.json({ error: 'Return not found' }, { status: 404 });

        const { data: invoices } = await supabase
          .from('gstr1_invoices')
          .select('*')
          .eq('return_id', returnId);

        const returnData = (returnRow.return_data || {}) as Gstr1ReturnData;
        if (!returnData.sections) {
          return NextResponse.json({ error: 'Generate draft before validating' }, { status: 400 });
        }

        const portalConfig = getPortalFilerConfig();
        const validation = validateGstr1Return(invoices || [], returnData, profile);
        const gstinIssues = getPortalGstinIssues(invoices || [], portalConfig.gstin);
        validation.errors.push(...gstinIssues);
        validation.isValid = validation.errors.length === 0;
        const status = validation.isValid ? 'validated' : 'error';

        await supabase.from('gst_returns').update({
          status,
          return_data: {
            ...returnData,
            validation: { errors: validation.errors, warnings: validation.warnings, validated_at: new Date().toISOString() },
          },
        }).eq('id', returnId);

        return NextResponse.json({ success: validation.isValid, ...validation });
      }

      // ============ SAVE GSTR1 TO PORTAL ============
      case 'save-gstr1': {
        try {
          const { returnId, period } = body;

          const portalConfig = getPortalFilerConfig();
          const txn = await getPortalTxn(supabase, user.id, MASTERGST_CONFIG.gstin);

          if (!txn) {
            return NextResponse.json({ error: 'Not authenticated with GST portal. Please verify OTP first.' }, { status: 401 });
          }

          const { data: returnRow } = await supabase
            .from('gst_returns')
            .select('return_data')
            .eq('id', returnId)
            .eq('user_id', user.id)
            .single();

          const { data: invoices } = await supabase
            .from('gstr1_invoices')
            .select('*')
            .eq('return_id', returnId);

          const gstinIssues = getPortalGstinIssues(invoices || [], portalConfig.gstin);
          if (gstinIssues.length > 0) {
            return NextResponse.json({
              error: gstinIssues.map((i) => i.message).join(' '),
              gstinIssues,
            }, { status: 400 });
          }

          const returnData = (returnRow?.return_data || {}) as Gstr1ReturnData;
          const payload = buildGstnPayload(invoices || [], returnData, period, portalConfig.gstin);
          const result = await saveGSTR1(period, txn, payload, portalConfig);

          if (result?.error === true) {
            return NextResponse.json({ error: result.message || 'Failed to save GSTR-1 to portal' }, { status: 500 });
          }

          if (result?.status_cd !== '1' && result?.status_cd !== 1 && result?.status !== 'Success' && result?.success !== true) {
            return NextResponse.json({
              error: getPortalErrorMessage(result?.error, 'Failed to save GSTR-1 to portal'),
            }, { status: 409 });
          }

          await supabase.from('gst_returns').update({
            status: 'submitted',
            api_reference_id: result.reference_id || result.ref_id,
            api_status: result.status_cd === '1' ? 'success' : 'error',
            api_response: result,
          }).eq('id', returnId);

          return NextResponse.json(result);
        } catch (err: unknown) {
          console.error('[Returns API] save-gstr1 failed:', err);
          return NextResponse.json({
            error: err instanceof Error ? err.message : 'Failed to save GSTR-1 to portal',
          }, { status: 500 });
        }
      }

      // ============ SUBMIT GSTR1 TO PORTAL ============
      case 'submit-gstr1': {
        try {
          const { returnId, period } = body;
          const portalConfig = getPortalFilerConfig();
          const txn = await getPortalTxn(supabase, user.id, MASTERGST_CONFIG.gstin);

          if (!txn) {
            return NextResponse.json({ error: 'Not authenticated with GST portal. Please verify OTP first.' }, { status: 401 });
          }

          const result = await submitGSTR1(period, txn, portalConfig);

          if (result?.error === true) {
            return NextResponse.json({ error: result.message || 'Failed to submit GSTR-1' }, { status: 500 });
          }

          if (result?.status_cd !== '1' && result?.status_cd !== 1 && result?.status !== 'Success' && result?.success !== true) {
            return NextResponse.json({
              error: getPortalErrorMessage(result?.error, 'Failed to submit GSTR-1'),
            }, { status: 409 });
          }

          await supabase.from('gst_returns').update({
            status: 'submitted',
            api_reference_id: result.reference_id || result.ref_id,
            api_response: result,
          }).eq('id', returnId);

          return NextResponse.json({ success: true, ...result });
        } catch (err: unknown) {
          console.error('[Returns API] submit-gstr1 failed:', err);
          return NextResponse.json({
            error: err instanceof Error ? err.message : 'Failed to submit GSTR-1',
          }, { status: 500 });
        }
      }

      // ============ FILE GSTR1 WITH EVC ============
      case 'file-gstr1': {
        const { returnId, period, pan, evcOtp } = body;
        if (!pan || !evcOtp) {
          return NextResponse.json({ error: 'PAN and EVC OTP are required to file' }, { status: 400 });
        }

        const portalConfig = getPortalFilerConfig();
        const txn = await getPortalTxn(supabase, user.id, MASTERGST_CONFIG.gstin);

        if (!txn) {
          return NextResponse.json({ error: 'Not authenticated with GST portal. Please verify OTP first.' }, { status: 401 });
        }

        const result = await fileGSTR1(period, txn, pan, evcOtp, portalConfig);

        if (result?.error === true) {
          return NextResponse.json({ error: result.message || 'Failed to file GSTR-1' }, { status: 500 });
        }

        if (result?.status_cd !== '1' && result?.status_cd !== 1 && result?.status !== 'Success' && result?.success !== true) {
          return NextResponse.json({
            error: getPortalErrorMessage(result?.error, 'Failed to file GSTR-1'),
          }, { status: 409 });
        }

        const arn = result.arn || result.data?.arn || result.reference_id;

        await supabase.from('gst_returns').update({
          status: 'filed',
          arn: arn || null,
          filed_date: new Date().toISOString(),
          filed_by: user.email || 'System',
          api_response: result,
        }).eq('id', returnId).eq('user_id', user.id);

        return NextResponse.json({ success: true, arn, ...result });
      }

      // ============ SAVE GSTR3B TO PORTAL ============ 
      case 'save-gstr3b': {
        const { returnId, period } = body;
        
        const { data: tokenData } = await supabase
          .from('mastergst_auth_tokens')
          .select('txn, expires_at')
          .eq('user_id', user.id)
          .eq('gstin', MASTERGST_CONFIG.gstin)
          .single();

        if (!tokenData?.txn || (tokenData.expires_at && new Date(tokenData.expires_at) < new Date())) {
          return NextResponse.json({ error: 'Not authenticated with GST portal. Please verify OTP first.' }, { status: 401 });
        }

        // Fetch GSTR3B data
        const { data: gstr3b } = await supabase
          .from('gstr3b_data')
          .select('*')
          .eq('return_id', returnId)
          .single();

        if (!gstr3b) {
          return NextResponse.json({ error: 'No GSTR-3B data found' }, { status: 404 });
        }

        // Transform to GSTN format
        const payload = transformGSTR3BToGSTNFormat(gstr3b, period);
        const result = await saveGSTR3B(period, tokenData.txn, payload);

        if (result?.error === true) {
          return NextResponse.json({ error: result.message || 'Failed to save GSTR-3B to portal' }, { status: 500 });
        }

        if (result?.status_cd !== '1' && result?.status_cd !== 1 && result?.status !== 'Success' && result?.success !== true) {
          return NextResponse.json({
            error: getPortalErrorMessage(result?.error, 'Failed to save GSTR-3B to portal'),
          }, { status: 409 });
        }

        await supabase.from('gst_returns').update({
          status: 'submitted',
          api_reference_id: result.reference_id || result.ref_id,
          api_status: result.status_cd === '1' ? 'success' : 'error',
          api_response: result,
        }).eq('id', returnId);

        return NextResponse.json(result);
      }

      // ============ FETCH GSTR2B (static portal payload for demo page) ============
      case 'fetch-gstr2b': {
        const { period } = body;
        if (!period) return NextResponse.json({ error: 'Missing period' }, { status: 400 });

        const portalConfig = getPortalFilerConfig();
        const result = getStaticGstr2bPortalResponse(period);

        try {
          const persisted = await persistGstr2bFetch(
            supabase,
            user.id,
            period,
            portalConfig,
            result,
            {
              source: 'portal',
              seedPurchaseBooks: true,
            }
          );

          return NextResponse.json({
            success: true,
            returnId: persisted.returnId,
            totalInvoices: persisted.gstr2bInvoices.length,
            returnData: sanitizeGstr2bReturnDataForClient(persisted.returnData),
            totals: persisted.totals,
            period,
            message: 'GSTR-2B data fetched successfully.',
          });
        } catch (err: unknown) {
          return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to save GSTR-2B data' },
            { status: 500 }
          );
        }
      }

      // ============ RECONCILE GSTR2B WITH PURCHASE REGISTER ============
      case 'reconcile-gstr2b': {
        const { returnId, period: bodyPeriod } = body;
        if (!returnId) return NextResponse.json({ error: 'Missing returnId' }, { status: 400 });

        const { data: returnRow } = await supabase
          .from('gst_returns')
          .select('id, return_period, return_data')
          .eq('id', returnId)
          .eq('user_id', user.id)
          .eq('return_type', 'GSTR2B')
          .single();

        if (!returnRow) return NextResponse.json({ error: 'GSTR-2B return not found' }, { status: 404 });

        const period = bodyPeriod || returnRow.return_period;
        const { startDate, endDate } = getReturnPeriodDateRange(period);

        const { data: gstr2bRows } = await supabase
          .from('gstr2b_data')
          .select('*')
          .eq('return_id', returnId);

        const { data: purchaseRows } = await supabase
          .from('purchase_register')
          .select('*')
          .gte('invoice_date', startDate)
          .lte('invoice_date', endDate);

        const recon = reconcileGstr2bWithPurchase(
          (gstr2bRows || []) as Parameters<typeof reconcileGstr2bWithPurchase>[0],
          purchaseRows || []
        );

        for (const upd of recon.gstr2bUpdates) {
          await supabase
            .from('gstr2b_data')
            .update({
              match_status: upd.match_status,
              matched_purchase_id: upd.matched_purchase_id,
            })
            .eq('id', upd.id);
        }

        const returnData = (returnRow.return_data || {}) as Gstr2bReturnData;
        returnData.reconciliation = recon.stats;

        await supabase
          .from('gst_returns')
          .update({ return_data: returnData, updated_at: new Date().toISOString() })
          .eq('id', returnId);

        const purchaseCount = (purchaseRows || []).length;
        const periodLabel = formatPeriodLabel(period);
        let hint: string | undefined;
        if (purchaseCount === 0) {
          hint = `No purchase invoices in your books for ${periodLabel}. Upload purchase bills for this month, or use "Seed purchase books" if you loaded the sandbox GSTR-2B sample.`;
        } else if (recon.stats.matched === 0 && recon.stats.partial === 0) {
          hint = `${purchaseCount} purchase invoice(s) found for ${periodLabel}, but none matched GSTR-2B on GSTIN, invoice number, date, or amounts. Check supplier GSTIN and invoice details.`;
        }

        return NextResponse.json({
          success: true,
          stats: recon.stats,
          matched: recon.matchedPairs.length,
          partial: recon.partialMatches.length,
          missing_in_gstr2b: recon.missingInGstr2b.length,
          missing_in_books: recon.missingInBooks.length,
          purchase_in_period: purchaseCount,
          hint,
        });
      }

      case 'seed-purchase-for-gstr2b': {
        const { returnId } = body;
        if (!returnId) return NextResponse.json({ error: 'Missing returnId' }, { status: 400 });

        const { data: returnRow } = await supabase
          .from('gst_returns')
          .select('id, return_period')
          .eq('id', returnId)
          .eq('user_id', user.id)
          .eq('return_type', 'GSTR2B')
          .single();

        if (!returnRow) return NextResponse.json({ error: 'GSTR-2B return not found' }, { status: 404 });

        const { data: gstr2bRows } = await supabase
          .from('gstr2b_data')
          .select('*')
          .eq('return_id', returnId);

        if (!gstr2bRows?.length) {
          return NextResponse.json({ error: 'No GSTR-2B documents to match. Fetch GSTR-2B first.' }, { status: 400 });
        }

        const portalConfig = getPortalFilerConfig();
        const seed = await seedSandboxPurchaseBooks(
          supabase,
          gstr2bRows as Parameters<typeof seedSandboxPurchaseBooks>[1],
          returnRow.return_period,
          portalConfig.gstin
        );

        return NextResponse.json({
          success: true,
          inserted: seed.inserted,
          skipped: seed.skipped,
          message:
            seed.inserted > 0
              ? `Added ${seed.inserted} purchase book entries for ${formatPeriodLabel(returnRow.return_period)}. Run reconciliation again.`
              : `Purchase books already have matching entries for this period (${seed.skipped} skipped). Run reconciliation.`,
        });
      }

      // ============ UPDATE GSTR3B DATA ============
      case 'update-gstr3b': {
        const { returnId, data } = body;
        
        const { error } = await supabase
          .from('gstr3b_data')
          .update(data)
          .eq('return_id', returnId)
          .eq('user_id', user.id);
        
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      // ============ MARK RETURN AS FILED (manual) ============
      case 'mark-filed': {
        const { returnId, arn } = body;
        
        await supabase.from('gst_returns').update({
          status: 'filed',
          arn,
          filed_date: new Date().toISOString(),
          filed_by: user.email || 'System',
        }).eq('id', returnId).eq('user_id', user.id);
        
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function transformGSTR3BToGSTNFormat(data: any, period: string) {
  return {
    gstin: MASTERGST_CONFIG.gstin,
    ret_period: period,
    sup_details: {
      osup_det: {
        txval: data.sec_3_1_a_taxable || 0,
        iamt: data.sec_3_1_a_igst || 0,
        camt: data.sec_3_1_a_cgst || 0,
        samt: data.sec_3_1_a_sgst || 0,
        csamt: data.sec_3_1_a_cess || 0,
      },
      osup_zero: {
        txval: data.sec_3_1_b_taxable || 0,
        iamt: data.sec_3_1_b_igst || 0,
        csamt: 0,
      },
      osup_nil_exmp: {
        txval: data.sec_3_1_c_taxable || 0,
      },
      isup_rev: {
        txval: data.sec_3_1_d_taxable || 0,
        iamt: data.sec_3_1_d_igst || 0,
        camt: data.sec_3_1_d_cgst || 0,
        samt: data.sec_3_1_d_sgst || 0,
        csamt: data.sec_3_1_d_cess || 0,
      },
      osup_nongst: {
        txval: data.sec_3_1_e_taxable || 0,
      },
    },
    itc_elg: {
      itc_avl: [
        { ty: 'IMPG', iamt: data.sec_4_a1_igst || 0, camt: 0, samt: 0, csamt: data.sec_4_a1_cess || 0 },
        { ty: 'IMPS', iamt: data.sec_4_a2_igst || 0, camt: 0, samt: 0, csamt: data.sec_4_a2_cess || 0 },
        { ty: 'ISRC', iamt: data.sec_4_a3_igst || 0, camt: data.sec_4_a3_cgst || 0, samt: data.sec_4_a3_sgst || 0, csamt: data.sec_4_a3_cess || 0 },
        { ty: 'ISD', iamt: data.sec_4_a4_igst || 0, camt: data.sec_4_a4_cgst || 0, samt: data.sec_4_a4_sgst || 0, csamt: data.sec_4_a4_cess || 0 },
        { ty: 'OTH', iamt: data.sec_4_a5_igst || 0, camt: data.sec_4_a5_cgst || 0, samt: data.sec_4_a5_sgst || 0, csamt: data.sec_4_a5_cess || 0 },
      ],
      itc_rev: [
        { ty: 'RUL', iamt: data.sec_4_b1_igst || 0, camt: data.sec_4_b1_cgst || 0, samt: data.sec_4_b1_sgst || 0, csamt: data.sec_4_b1_cess || 0 },
        { ty: 'OTH', iamt: data.sec_4_b2_igst || 0, camt: data.sec_4_b2_cgst || 0, samt: data.sec_4_b2_sgst || 0, csamt: data.sec_4_b2_cess || 0 },
      ],
      itc_net: {
        iamt: (data.sec_4_a5_igst || 0) - (data.sec_4_b1_igst || 0) - (data.sec_4_b2_igst || 0),
        camt: (data.sec_4_a5_cgst || 0) - (data.sec_4_b1_cgst || 0) - (data.sec_4_b2_cgst || 0),
        samt: (data.sec_4_a5_sgst || 0) - (data.sec_4_b1_sgst || 0) - (data.sec_4_b2_sgst || 0),
        csamt: (data.sec_4_a5_cess || 0) - (data.sec_4_b1_cess || 0) - (data.sec_4_b2_cess || 0),
      },
    },
  };
}

