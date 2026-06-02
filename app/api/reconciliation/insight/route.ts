import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildInsightCacheKey,
  classifyDiscrepancy,
} from '@/lib/reconciliation/classifyDiscrepancy';
import type {
  CachedReconciliationInsight,
  InsightRequestBody,
} from '@/lib/reconciliation/insightTypes';
import { generateReconciliationInsight } from '@/lib/services/geminiReconciliationInsightService';
import { DKS_RECON_RETURN_ID } from '@/lib/reconciliation/dksMarchConstants';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const dksInsightCache = new Map<string, CachedReconciliationInsight>();
const RATE_LIMIT_MAX = 30;
const rateLimitMap = new Map<string, number[]>();

async function getAuthenticatedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (user) return user;
  if (!error) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

type ReturnDataWithInsights = {
  reconciliation_insights?: Record<string, CachedReconciliationInsight>;
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Too many insight requests. Please try again later.' },
      { status: 429 }
    );
  }

  let body: InsightRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    returnId: bodyReturnId,
    dksMarch,
    discrepancyType,
    gstr2b,
    purchase,
    diff,
    period,
    matchType,
  } = body;

  if (!discrepancyType) {
    return NextResponse.json({ error: 'discrepancyType is required' }, { status: 400 });
  }

  const validTypes = [
    'missing_in_books',
    'missing_in_gstr2b',
    'value_mismatch',
    'matched',
  ];
  if (!validTypes.includes(discrepancyType)) {
    return NextResponse.json({ error: 'Invalid discrepancyType' }, { status: 400 });
  }

  const returnId = dksMarch ? DKS_RECON_RETURN_ID : bodyReturnId;
  if (!returnId) {
    return NextResponse.json({ error: 'returnId is required' }, { status: 400 });
  }

  const cacheKey = buildInsightCacheKey({
    returnId,
    discrepancyType,
    gstr2b,
    purchase,
    diff,
  });

  if (dksMarch) {
    const dksCacheId = `${user.id}:${cacheKey}`;
    const cachedDks = dksInsightCache.get(dksCacheId);
    if (cachedDks) {
      return NextResponse.json({
        insight: {
          classification: cachedDks.classification,
          narrative: cachedDks.narrative,
          audit: cachedDks.audit,
          source: cachedDks.source,
        },
        cached: true,
      });
    }
  } else {
    const { data: returnRow, error: returnErr } = await supabase
      .from('gst_returns')
      .select('id, return_data, return_period')
      .eq('id', returnId)
      .eq('user_id', user.id)
      .eq('return_type', 'GSTR2B')
      .single();

    if (returnErr || !returnRow) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    const returnData = (returnRow.return_data || {}) as ReturnDataWithInsights;
    const cached = returnData.reconciliation_insights?.[cacheKey];
    if (cached) {
      return NextResponse.json({
        insight: {
          classification: cached.classification,
          narrative: cached.narrative,
          audit: cached.audit,
          source: cached.source,
        },
        cached: true,
      });
    }
  }

  let returnPeriod = period || '032025';
  if (!dksMarch && bodyReturnId) {
    const { data: returnRow } = await supabase
      .from('gst_returns')
      .select('return_period')
      .eq('id', bodyReturnId)
      .eq('user_id', user.id)
      .single();
    returnPeriod = period || returnRow?.return_period || returnPeriod;
  }

  const classification = classifyDiscrepancy(discrepancyType, {
    gstr2b,
    purchase,
    diff,
    returnPeriod,
    matchType,
  });

  const bundle = await generateReconciliationInsight(discrepancyType, classification, {
    period: returnPeriod,
    gstr2b,
    purchase,
    diff,
  });

  const toStore: CachedReconciliationInsight = {
    ...bundle,
    cacheKey,
    createdAt: new Date().toISOString(),
  };

  if (dksMarch) {
    dksInsightCache.set(`${user.id}:${cacheKey}`, toStore);
  } else if (bodyReturnId) {
    const { data: returnRow } = await supabase
      .from('gst_returns')
      .select('return_data')
      .eq('id', bodyReturnId)
      .eq('user_id', user.id)
      .single();
    const returnData = (returnRow?.return_data || {}) as ReturnDataWithInsights;
    const insights = { ...(returnData.reconciliation_insights || {}), [cacheKey]: toStore };
    await supabase
      .from('gst_returns')
      .update({
        return_data: { ...returnData, reconciliation_insights: insights },
        updated_at: new Date().toISOString(),
      })
      .eq('id', bodyReturnId)
      .eq('user_id', user.id);
  }

  return NextResponse.json({
    insight: {
      classification: bundle.classification,
      narrative: bundle.narrative,
      audit: bundle.audit,
      source: bundle.source,
    },
    cached: false,
  });
}
