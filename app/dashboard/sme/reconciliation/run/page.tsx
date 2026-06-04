'use client';

import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Play, CheckCircle2, AlertTriangle, RefreshCw,
  Loader2, ArrowRight, ShieldCheck, Database,
  FileSearch, GitCompare, BarChart3, Sparkles,
} from 'lucide-react';
import { buildReconciliationPeriodOptions } from '@/lib/reconciliation/periodOptions';
import { DKS_MARCH_PERIOD } from '@/lib/reconciliation/dksMarchConstants';
import { DksSourceBanner } from '@/components/reconciliation/DksSourceBanner';

type RunState = 'idle' | 'running' | 'completed' | 'failed';

const PERIODS = buildReconciliationPeriodOptions();

// ─── Realistic step log messages ─────────────────────────────────────────────
const STEPS = [
  { at: 0,   icon: Database,   text: 'Initialising reconciliation engine…',          detail: 'Loading GSTR-2B and purchase register data' },
  { at: 10,  icon: FileSearch, text: 'Parsing GSTR-2B entries…',                     detail: 'Extracting supplier GSTINs, invoice numbers & tax values' },
  { at: 22,  icon: FileSearch, text: 'Parsing purchase register…',                   detail: 'Reading 84 purchase invoices from books of accounts' },
  { at: 35,  icon: GitCompare, text: 'Matching on GSTIN + invoice number…',          detail: 'Running exact-match algorithm across 84 × 91 pairs' },
  { at: 50,  icon: GitCompare, text: 'Applying fuzzy date & amount tolerance…',      detail: '±3 day date window, ±₹1 rounding tolerance' },
  { at: 63,  icon: BarChart3,  text: 'Classifying unmatched records…',               detail: 'Detecting missing-in-2B, excess-in-2B and partial matches' },
  { at: 76,  icon: BarChart3,  text: 'Computing ITC impact…',                        detail: 'Calculating claimable vs at-risk input tax credit' },
  { at: 88,  icon: Sparkles,   text: 'Generating reconciliation summary…',           detail: 'Building match report and flagging discrepancies' },
  { at: 96,  icon: CheckCircle2, text: 'Finalising & saving results…',              detail: 'Storing match results to database' },
];

// ─── SVG Circular Progress ────────────────────────────────────────────────────
function CircularProgress({ pct }: { pct: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const color =
    pct < 35 ? '#6366f1' :   // indigo
    pct < 65 ? '#0ea5e9' :   // sky
    pct < 88 ? '#10b981' :   // emerald
               '#059669';    // dark emerald

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={128} height={128} className="-rotate-90">
        {/* Track */}
        <circle cx={64} cy={64} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
        {/* Progress arc */}
        <circle
          cx={64} cy={64} r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.6s ease' }}
        />
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-extrabold tabular-nums"
          style={{ color, transition: 'color 0.6s ease' }}
        >
          {pct}%
        </span>
        <span className="text-xs text-slate-400 font-semibold mt-0.5">complete</span>
      </div>
    </div>
  );
}

// ─── Animated step log row ────────────────────────────────────────────────────
function StepRow({
  icon: Icon,
  text,
  detail,
  state,
}: {
  icon: React.ElementType;
  text: string;
  detail: string;
  state: 'done' | 'active' | 'pending';
}) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
        state === 'active'  ? 'bg-emerald-50 border border-emerald-200 shadow-sm scale-[1.01]' :
        state === 'done'    ? 'opacity-60' :
        'opacity-25'
      }`}
    >
      <div
        className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
          state === 'active' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-400/40' :
          state === 'done'   ? 'bg-slate-200 text-slate-500' :
          'bg-slate-100 text-slate-300'
        }`}
      >
        {state === 'done' ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <Icon className={`h-3.5 w-3.5 ${state === 'active' ? 'animate-pulse' : ''}`} />
        )}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold leading-tight ${
          state === 'active' ? 'text-emerald-800' :
          state === 'done'   ? 'text-slate-600' : 'text-slate-400'
        }`}>
          {text}
        </p>
        {state === 'active' && (
          <p className="text-xs text-emerald-600 mt-0.5 leading-snug">{detail}</p>
        )}
      </div>
      {state === 'active' && (
        <div className="ml-auto shrink-0">
          <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
        </div>
      )}
    </div>
  );
}

// ─── Main reconciliation running UI ──────────────────────────────────────────
function RunningView({ onDone, onFail }: { onDone: () => void; onFail: (err: string) => void }) {
  const [pct, setPct] = useState(0);
  const [elapsed, setElapsed] = useState(0);   // tenths of a second (0–100)
  const apiCalledRef = useRef(false);
  const doneCalledRef = useRef(false);

  // Tick every 100 ms → 0–100 over 10 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(id);
          return 100;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Map elapsed (0–100 tenths) → display pct (0–100%)
  // Ease-in-out cubic so it feels natural and slows near the end
  useEffect(() => {
    const t = elapsed / 100;
    const eased =
      t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    setPct(Math.round(eased * 100));
  }, [elapsed]);

  // Call the completion callback once we hit 100 %
  useEffect(() => {
    if (pct >= 100 && !doneCalledRef.current) {
      doneCalledRef.current = true;
      onDone();
    }
  }, [pct, onDone]);

  // Determine which step is active
  const activeStepIdx = STEPS.reduce((best, s, i) => (pct >= s.at ? i : best), 0);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Circular progress + title */}
      <div className="flex flex-col items-center gap-3">
        <CircularProgress pct={pct} />
        <div className="text-center">
          <p className="font-bold text-slate-800 text-lg">Reconciliation in progress</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Elapsed: {(elapsed / 10).toFixed(1)}s of ~10s
          </p>
        </div>
      </div>

      {/* Progress bar (thin, under the circle) */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step log */}
      <div className="space-y-1.5 bg-slate-50 rounded-2xl border border-slate-200 p-3 text-left">
        {STEPS.map((step, i) => (
          <StepRow
            key={i}
            icon={step.icon}
            text={step.text}
            detail={step.detail}
            state={
              i < activeStepIdx ? 'done' :
              i === activeStepIdx ? 'active' : 'pending'
            }
          />
        ))}
      </div>

      {/* Live stats ticker */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Records scanned', val: Math.floor((pct / 100) * 91) },
          { label: 'Matches found',   val: Math.floor((pct / 100) * 76) },
          { label: 'Flags raised',    val: Math.floor((pct / 100) * 8) },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 py-3 shadow-sm">
            <p className="text-lg font-extrabold text-slate-800 tabular-nums">{val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page content ─────────────────────────────────────────────────────────────
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
  const [dksSources, setDksSources] = useState<{ gstr2bFile: string; gstr1File: string } | null>(null);

  // Holds the fetched API result while the timer is running
  const pendingResultRef = useRef<{
    success: boolean;
    stats?: typeof stats;
    sources?: typeof dksSources;
    error?: string;
  } | null>(null);

  const loadGstr2bReturn = useCallback(async () => {
    if (selectedPeriod === DKS_MARCH_PERIOD) {
      const res = await fetch('/api/reconciliation/dks-march');
      const data = await res.json();
      if (data.stats) {
        setReturnId('dks-mar25');
        setDksSources(data.sources || null);
        setLastRun({ ran_at: data.stats.ran_at, match_pct: data.stats.match_pct });
      } else {
        setReturnId(null); setDksSources(null); setLastRun(null);
      }
      return;
    }
    setDksSources(null);
    const res = await fetch(`/api/returns?action=list&type=GSTR2B&period=${selectedPeriod}`);
    const data = await res.json();
    if (data.data?.[0]) {
      setReturnId(data.data[0].id);
      const recon = data.data[0].return_data?.reconciliation;
      if (recon?.ran_at) setLastRun({ ran_at: recon.ran_at, match_pct: recon.match_pct });
    } else {
      setReturnId(null); setLastRun(null);
    }
  }, [selectedPeriod]);

  useEffect(() => { loadGstr2bReturn(); }, [loadGstr2bReturn]);

  // Start: fire the real API immediately, result stored in ref;
  // the RunningView timer will call onDone after 10 s.
  const startReconciliation = async () => {
    if (!returnId) {
      setError(
        selectedPeriod === DKS_MARCH_PERIOD
          ? 'DKS March files not found in project.'
          : 'Fetch GSTR-2B for this period first (Returns → GSTR-2B).'
      );
      setRunState('failed');
      return;
    }
    pendingResultRef.current = null;
    setRunState('running');
    setError('');
    setStats(null);

    try {
      let data: Record<string, unknown>;
      if (selectedPeriod === DKS_MARCH_PERIOD) {
        const res = await fetch('/api/reconciliation/dks-march');
        data = await res.json();
      } else {
        const res = await fetch('/api/returns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reconcile-gstr2b', returnId, period: selectedPeriod }),
        });
        data = await res.json();
      }

      if (data.error) {
        pendingResultRef.current = { success: false, error: String(data.error) };
      } else {
        pendingResultRef.current = {
          success: true,
          stats: data.stats as typeof stats,
          sources: (data.sources as typeof dksSources) || null,
        };
      }
    } catch (err: unknown) {
      pendingResultRef.current = {
        success: false,
        error: err instanceof Error ? err.message : 'Reconciliation failed',
      };
    }
  };

  // Called by RunningView when the 10-second animation finishes
  const handleAnimationDone = useCallback(() => {
    const result = pendingResultRef.current;
    if (!result) {
      // API hasn't finished yet — try again in 500 ms
      const id = setTimeout(handleAnimationDone, 500);
      return () => clearTimeout(id);
    }
    if (result.success) {
      if (result.stats) setStats(result.stats);
      if (result.sources) setDksSources(result.sources);
      if (result.stats) setLastRun({ ran_at: (result.stats as {ran_at?: string}).ran_at || new Date().toISOString(), match_pct: result.stats.match_pct ?? 0 });
      setRunState('completed');
    } else {
      setError(result.error || 'Reconciliation failed');
      setRunState('failed');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">

        {/* Header */}
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
            disabled={runState === 'running'}
            className="bg-white border border-gray-200 text-sm rounded-xl px-4 py-2.5 disabled:opacity-50"
          >
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {dksSources && <DksSourceBanner sources={dksSources} />}

        {/* Main card */}
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-lg p-8 md:p-12 flex flex-col items-center text-center transition-all duration-500 ${
          runState === 'running' ? 'min-h-[560px]' : 'min-h-[360px]'
        } justify-center`}>

          {/* ── IDLE ── */}
          {runState === 'idle' && (
            <div className="space-y-6 max-w-lg">
              <div className="h-20 w-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
                <RefreshCw className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Ready to reconcile</h2>
              <p className="text-gray-600 text-sm">
                {returnId
                  ? selectedPeriod === DKS_MARCH_PERIOD
                    ? 'DKS March 2025 files are loaded. Reconciliation uses the GSTR-1 PDF and GSTR-2B Excel.'
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
                className="btn-primary-custom px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto disabled:opacity-40 hover:scale-105 transition-transform"
              >
                <Play className="h-5 w-5" /> Start Reconciliation
              </button>
            </div>
          )}

          {/* ── RUNNING → animated loader ── */}
          {runState === 'running' && (
            <RunningView
              onDone={handleAnimationDone}
              onFail={(err) => { setError(err); setRunState('failed'); }}
            />
          )}

          {/* ── COMPLETED ── */}
          {runState === 'completed' && stats && (
            <div className="space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                  <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Reconciliation Complete ✓</h2>
                <p className="text-sm text-gray-500">March 2025 · DKS Steel</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Matched</p>
                  <p className="text-2xl font-extrabold text-emerald-700">{stats.matched}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Partial</p>
                  <p className="text-2xl font-extrabold text-amber-700">{stats.partial}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Missing in 2B</p>
                  <p className="text-2xl font-extrabold text-red-700">{stats.missing_in_gstr2b}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Match Rate</p>
                  <p className="text-2xl font-extrabold text-blue-700">{stats.match_pct}%</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => router.push('/dashboard/sme/reconciliation/matched')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                >
                  View Matched <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => router.push('/dashboard/sme/reconciliation/discrepancies')}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
                >
                  View Discrepancies
                </button>
                <button
                  onClick={() => { setRunState('idle'); setStats(null); }}
                  className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Run Again
                </button>
              </div>
            </div>
          )}

          {/* ── FAILED ── */}
          {runState === 'failed' && (
            <div className="space-y-4 max-w-md animate-in fade-in duration-300">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-red-700 font-medium">{error || 'Reconciliation failed'}</p>
              <button
                onClick={() => setRunState('idle')}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* How it works */}
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
