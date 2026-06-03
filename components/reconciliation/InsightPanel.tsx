'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Lightbulb, Loader2 } from 'lucide-react';
import { buildInsightCacheKey } from '@/lib/reconciliation/classifyDiscrepancy';
import { ruleDisplayLabel } from '@/lib/reconciliation/taxEngineRules';
import type {
  DiscrepancyType,
  InsightInvoicePayload,
  InsightPurchasePayload,
  ReconciliationInsightBundle,
} from '@/lib/reconciliation/insightTypes';

interface InsightPanelProps {
  returnId: string | null;
  discrepancyType: DiscrepancyType;
  period?: string;
  gstr2b?: InsightInvoicePayload | null;
  purchase?: InsightPurchasePayload | null;
  diff?: { taxable?: number; tax?: number };
  matchType?: 'exact' | 'fuzzy';
  dksMarch?: boolean;
  enabled: boolean;
}

export function InsightPanel({
  returnId,
  discrepancyType,
  period,
  gstr2b,
  purchase,
  diff,
  matchType,
  dksMarch,
  enabled,
}: InsightPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<ReconciliationInsightBundle | null>(null);

  const requestKey =
    returnId && enabled
      ? buildInsightCacheKey({
          returnId,
          discrepancyType,
          gstr2b,
          purchase,
          diff,
        })
      : '';

  useEffect(() => {
    if (!enabled || !returnId || !requestKey) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/reconciliation/insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            returnId,
            dksMarch: dksMarch || period === '032025',
            discrepancyType,
            period,
            gstr2b: gstr2b || null,
            purchase: purchase || null,
            diff: diff || undefined,
            matchType,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Could not load insight');
        }
        if (!cancelled) {
          setBundle(data.insight as ReconciliationInsightBundle);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load insight');
          setBundle(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, returnId, requestKey, discrepancyType, period, gstr2b, purchase, diff, matchType, dksMarch]);

  if (!enabled) return null;

  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5">
        <div className="flex items-center gap-3 text-emerald-800">
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
          <p className="text-sm font-medium">Analyzing discrepancy…</p>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3 bg-emerald-100/80 rounded animate-pulse w-full" />
          <div className="h-3 bg-emerald-100/60 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-emerald-100/40 rounded animate-pulse w-3/5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-2 text-sm text-red-800">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    );
  }

  if (!bundle) return null;

  const { classification, narrative, audit } = bundle;
  const severityStyles = {
    low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
    high: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 border border-emerald-200">
            <Lightbulb className="h-4 w-4 text-emerald-700" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900">Compliance insight</h4>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${severityStyles[classification.severity]}`}
          >
            {classification.severity} priority
          </span>
          {audit?.ruleTriggered && (
            <span className="text-[10px] text-gray-500 font-medium">
              {ruleDisplayLabel(audit.ruleTriggered)}
            </span>
          )}
        </div>
      </div>

      {audit?.varianceDetails && (
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="rounded-lg bg-white/90 border border-gray-200 px-2 py-2">
            <p className="text-[10px] text-gray-500 uppercase">Books</p>
            <p className="text-xs font-semibold text-blue-700">
              ₹{audit.varianceDetails.purchase_register_val.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="rounded-lg bg-white/90 border border-gray-200 px-2 py-2">
            <p className="text-[10px] text-gray-500 uppercase">GSTR-2B</p>
            <p className="text-xs font-semibold text-orange-700">
              ₹{audit.varianceDetails.gstr_2b_val.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="rounded-lg bg-white/90 border border-gray-200 px-2 py-2">
            <p className="text-[10px] text-gray-500 uppercase">Tax variance</p>
            <p className="text-xs font-semibold text-red-700">
              ₹{Math.abs(audit.varianceDetails.tax_discrepancy).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Why this happened
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{narrative.summary}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Contributing factors
          </p>
          <ul className="flex flex-wrap gap-2">
            {classification.factors.map((f) => (
              <li
                key={f.code}
                title={f.evidence}
                className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm"
              >
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-white/80 border border-gray-200 px-3 py-2.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            ITC impact
          </p>
          <p className="text-sm text-gray-700">{narrative.impact}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Recommended actions
          </p>
          <ol className="space-y-2">
            {narrative.actions.map((action, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-800">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{action}</span>
              </li>
            ))}
          </ol>
        </div>

        {(narrative.confidenceNote || audit?.complianceHealthScore != null) && (
          <p className="text-xs text-gray-500 flex items-start gap-1.5 border-t border-gray-100 pt-3">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              {narrative.confidenceNote}
              {audit?.complianceHealthScore != null && (
                <>
                  {' '}
                  Compliance health index: {audit.complianceHealthScore}/100
                  {audit.complianceVerdict ? ` (${audit.complianceVerdict.replace(/_/g, ' ')})` : ''}.
                </>
              )}{' '}
              Verify with the original invoice and GST portal before filing GSTR-3B.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
