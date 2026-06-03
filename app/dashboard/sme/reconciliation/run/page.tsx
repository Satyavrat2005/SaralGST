'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { buildReconciliationPeriodOptions } from '@/lib/reconciliation/periodOptions';
import { DKS_MARCH_PERIOD } from '@/lib/reconciliation/dksMarchConstants';
import { DksSourceBanner } from '@/components/reconciliation/DksSourceBanner';

type RunState = 'idle' | 'running' | 'completed' | 'failed';

const PERIODS = buildReconciliationPeriodOptions();

function RunReconciliationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPeriod =
    searchParams.get('period') ||
    PERIODS.find((p) => p.value === DKS_MARCH_PERIOD)?.value ||
    PERIODS[0].value;

  const [runState, setRunState] = useState<RunState>('idle');
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [returnId, setReturnId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{
    match_pct: number;
    matched: number;
    partial: number;
    missing_in_gstr2b: number;
    total_gstr2b: number;
  } | null>(null);
  const [lastRun, setLastRun] = useState<{ ran_at: string; match_pct: number } | null>(null);
  const [dksSources, setDksSources] = useState<{ gstr2bFile: string; gstr1File: string } | null>(
    null
  );

  const loadGstr2bReturn = useCallback(async () => {
    if (selectedPeriod === DKS_MARCH_PERIOD) {
      const res = await fetch('/api/reconciliation/dks-march');
      const data = await res.json();
      if (data.stats) {
        setReturnId('dks-mar25');
        setDksSources(data.sources || null);
        setLastRun({ ran_at: data.stats.ran_at, match_pct: data.stats.match_pct });
      } else {
        setReturnId(null);
        setDksSources(null);
        setLastRun(null);
      }
      return;
    }
    setDksSources(null);
    const res = await fetch(`/api/returns?action=list&type=GSTR2B&period=${selectedPeriod}`);
    const data = await res.json();
    if (data.data?.[0]) {
      setReturnId(data.data[0].id);
      const recon = data.data[0].return_data?.reconciliation;
      if (recon?.ran_at) {
        setLastRun({ ran_at: recon.ran_at, match_pct: recon.match_pct });
      }
    } else {
      setReturnId(null);
      setLastRun(null);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadGstr2bReturn();
  }, [loadGstr2bReturn]);

  const startReconciliation = async () => {
    if (!returnId) {
      setError(
        selectedPeriod === DKS_MARCH_PERIOD
          ? 'DKS March files not found in project. Add the GSTR-1 PDF and GSTR-2B Excel to the repo.'
          : 'Fetch GSTR-2B for this period first (Returns → GSTR-2B).'
      );
      setRunState('failed');
      return;
    }
    setRunState('running');
    setError('');
    setStats(null);
    try {
      if (selectedPeriod === DKS_MARCH_PERIOD) {
        const res = await fetch('/api/reconciliation/dks-march');
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          setRunState('failed');
        } else {
          setStats(data.stats);
          setDksSources(data.sources || null);
          setLastRun({ ran_at: data.stats.ran_at, match_pct: data.stats.match_pct });
          setRunState('completed');
        }
        return;
      }
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reconcile-gstr2b',
          returnId,
          period: selectedPeriod,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setRunState('failed');
      } else {
        setStats(data.stats);
        setLastRun({ ran_at: data.stats.ran_at, match_pct: data.stats.match_pct });
        setRunState('completed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reconciliation failed');
      setRunState('failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-3">
              <RefreshCw className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              <span className="text-emerald-700 font-bold text-sm uppercase tracking-wide">Run Reconciliation</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reconciliation Engine</h1>
            <p className="text-gray-600 text-sm mt-1">
              Match purchase register (GSTR-1 / books) with GSTR-2B for ITC validation
            </p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white border border-gray-200 text-sm rounded-xl px-4 py-2.5"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {dksSources && <DksSourceBanner sources={dksSources} />}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 md:p-12 flex flex-col items-center text-center min-h-[360px] justify-center">
          {runState === 'idle' && (
            <div className="space-y-6 max-w-lg">
              <div className="h-20 w-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
                <RefreshCw className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Ready to reconcile</h2>
              <p className="text-gray-600 text-sm">
                {returnId
                  ? selectedPeriod === DKS_MARCH_PERIOD
                    ? 'DKS March 2025 files are loaded. Reconciliation uses only the GSTR-1 PDF and GSTR-2B Excel.'
                    : 'GSTR-2B is loaded for this period. Click below to match against your purchase register.'
                  : selectedPeriod === DKS_MARCH_PERIOD
                    ? 'Place DKS March files in the project to run reconciliation.'
                    : 'No GSTR-2B data for this period. Fetch from the GSTR-2B page first.'}
              </p>
              {lastRun && (
                <p className="text-xs text-gray-500">
                  Last run: {new Date(lastRun.ran_at).toLocaleString()} — {lastRun.match_pct}% matched
                </p>
              )}
              <button
                onClick={startReconciliation}
                disabled={!returnId}
                className="btn-primary-custom px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto disabled:opacity-40"
              >
                <Play className="h-5 w-5" /> Start Reconciliation
              </button>
            </div>
          )}

          {runState === 'running' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto" />
              <p className="text-gray-700 font-medium">Matching purchase register with GSTR-2B...</p>
            </div>
          )}

          {runState === 'completed' && stats && (
            <div className="space-y-6 max-w-md">
              <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900">Reconciliation Complete</h2>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3 bg-emerald-50 rounded-xl"><p className="text-xs text-gray-500">Matched</p><p className="text-lg font-bold">{stats.matched}</p></div>
                <div className="p-3 bg-amber-50 rounded-xl"><p className="text-xs text-gray-500">Partial</p><p className="text-lg font-bold">{stats.partial}</p></div>
                <div className="p-3 bg-red-50 rounded-xl"><p className="text-xs text-gray-500">Missing in 2B</p><p className="text-lg font-bold">{stats.missing_in_gstr2b}</p></div>
                <div className="p-3 bg-blue-50 rounded-xl"><p className="text-xs text-gray-500">Match rate</p><p className="text-lg font-bold">{stats.match_pct}%</p></div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => router.push('/dashboard/sme/reconciliation/matched')} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium flex items-center gap-1">
                  View Matched <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => router.push('/dashboard/sme/reconciliation/discrepancies')} className="px-4 py-2 rounded-xl border border-gray-300 text-sm">
                  View Discrepancies
                </button>
                <button onClick={() => setRunState('idle')} className="px-4 py-2 rounded-xl text-sm text-gray-600">Run Again</button>
              </div>
            </div>
          )}

          {runState === 'failed' && (
            <div className="space-y-4 max-w-md">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-red-700">{error || 'Reconciliation failed'}</p>
              <button onClick={() => setRunState('idle')} className="px-4 py-2 rounded-xl border border-gray-300 text-sm">Try Again</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> How it works
          </h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Fetch GSTR-2B from the GST portal for the return period</li>
            <li>Upload purchase invoices to the Purchase Register</li>
            <li>Run reconciliation — matches on GSTIN, invoice number, date, and amounts</li>
            <li>Review matched items and discrepancies before filing GSTR-3B</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function RunReconciliationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <RunReconciliationContent />
    </Suspense>
  );
}
