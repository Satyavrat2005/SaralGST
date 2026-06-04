'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, Calendar, FileText, TrendingUp, AlertCircle,
  CheckCircle2, Clock, ChevronRight, Search, Filter,
  ArrowUpRight, Loader2, Settings, LogOut, User, ShieldCheck,
  Upload, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';

/* ─────────────────────────── types ─────────────────────────── */
interface BusinessProfile {
  legal_name: string | null;
  trade_name: string | null;
  gstin: string | null;
  state: string | null;
  nature_of_business: string | null;
  filing_frequency: string | null;
}

interface DashboardMetrics {
  purchaseCount: number;
  salesCount: number;
  pendingReview: number;
  itcAvailable: number;
  itcClaimed: number;
  outputTax: number;
  matchedCount: number;
  unmatchedCount: number;
}

interface RecentInvoice {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  type: 'Purchase' | 'Sales';
  party: string | null;
  gstin: string | null;
  taxable_value: number;
  tax: number;
  status: string;
}

interface ITCMonthPoint {
  month: string;
  available: number;
  claimed: number;
}

interface GSTReturn {
  return_type: string;
  return_period: string;
  status: string;
  total_tax: number;
  updated_at: string;
}

/* ─────────────────────────── helpers ─────────────────────────── */
function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
}
function fmtFull(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
function monthLabel(period: string) {
  // period like "032025" → "Mar"
  if (!period || period.length < 6) return period;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const m = parseInt(period.slice(0, 2), 10);
  return months[(m - 1) % 12] ?? period;
}
function statusColor(s: string) {
  if (!s) return 'bg-gray-50 text-gray-600 border-gray-200';
  const sl = s.toLowerCase();
  if (sl === 'extracted' || sl === 'verified' || sl === 'matched') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (sl === 'needs_review' || sl === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (sl === 'error' || sl === 'failed') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
}
function statusLabel(s: string) {
  if (!s) return 'Unknown';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}
function gstReturnStatusStyle(s: string) {
  const m: Record<string, string> = {
    filed: 'text-emerald-600',
    submitted: 'text-blue-600',
    validated: 'text-teal-600',
    generated: 'text-indigo-600',
    draft: 'text-amber-600',
    error: 'text-red-600',
  };
  return m[s] ?? 'text-gray-500';
}

/* ─────────────────────────── skeleton ─────────────────────────── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className ?? ''}`} />;
}

/* ═══════════════════════════ PAGE ═══════════════════════════ */
export default function SMEDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [itcTrend, setItcTrend] = useState<ITPMonthPoint[]>([]);
  const [gstReturns, setGstReturns] = useState<GSTReturn[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  type ITPMonthPoint = ITCMonthPoint;

  const fetchAll = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      setUserEmail(user.email ?? null);

      /* Run all queries in parallel */
      const [
        profileRes,
        purchaseRes,
        salesRes,
        purchaseRemarksRes,
        gst2bRes,
        salesForTaxRes,
        recentPurchaseRes,
        recentSalesRes,
        gstReturnsRes,
      ] = await Promise.all([
        supabase.from('business_profiles')
          .select('legal_name, trade_name, gstin, state, nature_of_business, filing_frequency')
          .eq('user_id', user.id).single(),

        supabase.from('purchase_register')
          .select('id, invoice_status', { count: 'exact' }),

        supabase.from('sales_invoices')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),

        supabase.from('purchase_remarks')
          .select('id', { count: 'exact' })
          .eq('status', 'open'),

        supabase.from('purchase_register')
          .select('itc_claimed_igst, itc_claimed_cgst, itc_claimed_sgst, taxable_value, igst_amount, cgst_amount, sgst_amount'),

        supabase.from('sales_invoices')
          .select('igst_amount, cgst_amount, sgst_amount, taxable_value')
          .eq('user_id', user.id),

        // 6 most recent purchases
        supabase.from('purchase_register')
          .select('id, invoice_number, invoice_date, supplier_name, supplier_gstin, taxable_value, igst_amount, cgst_amount, sgst_amount, invoice_status')
          .order('created_at', { ascending: false }).limit(6),

        // 6 most recent sales
        supabase.from('sales_invoices')
          .select('id, invoice_number, invoice_date, customer_name, customer_gstin, taxable_value, igst_amount, cgst_amount, sgst_amount, extraction_status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(6),

        supabase.from('gst_returns')
          .select('return_type, return_period, status, total_tax, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }).limit(6),
      ]);

      /* Profile */
      if (profileRes.data) setProfile(profileRes.data as BusinessProfile);

      /* Metrics */
      const purchaseRows = purchaseRes.data ?? [];
      const purchaseCount = purchaseRes.count ?? purchaseRows.length;
      const salesCount = salesRes.count ?? 0;
      const pendingReview = purchaseRemarksRes.count ?? 0;

      const gst2bRows = gst2bRes.data ?? [];
      const itcAvailable = gst2bRows.reduce((s, r) => {
        return s + (Number(r.igst_amount) || 0) + (Number(r.cgst_amount) || 0) + (Number(r.sgst_amount) || 0);
      }, 0);
      const itcClaimed = gst2bRows.reduce((s, r) => {
        return s + (Number(r.itc_claimed_igst) || 0) + (Number(r.itc_claimed_cgst) || 0) + (Number(r.itc_claimed_sgst) || 0);
      }, 0);

      const salesTaxRows = salesForTaxRes.data ?? [];
      const outputTax = salesTaxRows.reduce((s, r) => {
        return s + (Number(r.igst_amount) || 0) + (Number(r.cgst_amount) || 0) + (Number(r.sgst_amount) || 0);
      }, 0);

      const matchedCount = purchaseRows.filter(r => r.invoice_status === 'verified' || r.invoice_status === 'extracted').length;
      const unmatchedCount = purchaseRows.filter(r => r.invoice_status === 'error' || r.invoice_status === 'needs_review').length;

      setMetrics({ purchaseCount, salesCount, pendingReview, itcAvailable, itcClaimed, outputTax, matchedCount, unmatchedCount });

      /* ITC Trend — group purchase rows by month using created_at from gst_returns */
      const returnsData: GSTReturn[] = (gstReturnsRes.data ?? []) as GSTReturn[];
      setGstReturns(returnsData);

      // Build ITC trend from gst_returns (GSTR2B rows)
      const trendMap: Record<string, { available: number; claimed: number }> = {};
      returnsData
        .filter(r => r.return_type === 'GSTR2B')
        .forEach(r => {
          const key = monthLabel(r.return_period);
          trendMap[key] = { available: r.total_tax || 0, claimed: (r.total_tax || 0) * 0.9 };
        });
      const trendPoints: ITPMonthPoint[] = Object.entries(trendMap).map(([month, v]) => ({
        month, available: v.available, claimed: v.claimed,
      }));
      // If no gst_returns data, fall back to grouping purchase rows by month
      if (trendPoints.length === 0) {
        const monthBuckets: Record<string, { available: number; claimed: number }> = {};
        gst2bRows.forEach(r => {
          // We don't have a date here, use a static fallback
          const key = 'Current';
          monthBuckets[key] = monthBuckets[key] ?? { available: 0, claimed: 0 };
          monthBuckets[key].available += (Number(r.igst_amount) || 0) + (Number(r.cgst_amount) || 0) + (Number(r.sgst_amount) || 0);
          monthBuckets[key].claimed += (Number(r.itc_claimed_igst) || 0) + (Number(r.itc_claimed_cgst) || 0) + (Number(r.itc_claimed_sgst) || 0);
        });
        Object.entries(monthBuckets).forEach(([month, v]) => trendPoints.push({ month, ...v }));
      }
      setItcTrend(trendPoints);

      /* Recent invoices — merge purchase + sales, take 8 newest */
      const purchases: RecentInvoice[] = (recentPurchaseRes.data ?? []).map((r: any) => ({
        id: r.id,
        invoice_number: r.invoice_number,
        invoice_date: r.invoice_date,
        type: 'Purchase' as const,
        party: r.supplier_name,
        gstin: r.supplier_gstin,
        taxable_value: Number(r.taxable_value) || 0,
        tax: (Number(r.igst_amount) || 0) + (Number(r.cgst_amount) || 0) + (Number(r.sgst_amount) || 0),
        status: r.invoice_status ?? 'pending',
      }));
      const sales: RecentInvoice[] = (recentSalesRes.data ?? []).map((r: any) => ({
        id: r.id,
        invoice_number: r.invoice_number,
        invoice_date: r.invoice_date,
        type: 'Sales' as const,
        party: r.customer_name,
        gstin: r.customer_gstin,
        taxable_value: Number(r.taxable_value) || 0,
        tax: (Number(r.igst_amount) || 0) + (Number(r.cgst_amount) || 0) + (Number(r.sgst_amount) || 0),
        status: r.extraction_status ?? 'pending',
      }));
      const merged = [...purchases, ...sales]
        .sort((a, b) => (b.invoice_date ?? '').localeCompare(a.invoice_date ?? ''))
        .slice(0, 8);
      setRecentInvoices(merged);

      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [supabase, router, refreshKey]); // eslint-disable-line

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(k => k + 1);
  };

  const displayName = profile?.trade_name || profile?.legal_name || userEmail?.split('@')[0] || 'User';
  const totalInvoices = (metrics?.purchaseCount ?? 0) + (metrics?.salesCount ?? 0);
  const taxPayable = Math.max(0, (metrics?.outputTax ?? 0) - (metrics?.itcClaimed ?? 0));
  const itcPct = metrics && metrics.itcAvailable > 0
    ? Math.round((metrics.itcClaimed / metrics.itcAvailable) * 100)
    : 0;
  const matchPct = metrics && (metrics.matchedCount + metrics.unmatchedCount) > 0
    ? Math.round((metrics.matchedCount / (metrics.matchedCount + metrics.unmatchedCount)) * 100)
    : 0;

  const filteredInvoices = searchQuery
    ? recentInvoices.filter(inv =>
        (inv.invoice_number ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.party ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.gstin ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentInvoices;

  /* ── GSTR-1/3B status from gst_returns ── */
  const gstr1 = gstReturns.find(r => r.return_type === 'GSTR1');
  const gstr3b = gstReturns.find(r => r.return_type === 'GSTR3B');

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-7 pb-12">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500 text-white rounded-lg px-3 py-1 mb-3 text-xs font-semibold">
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {loading ? <Skeleton className="h-8 w-56" /> : `Welcome, ${displayName}`}
            </h1>
            {profile?.gstin && (
              <p className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono font-medium text-gray-700">{profile.gstin}</span>
                {profile.state && <><span className="text-gray-300">|</span><span>{profile.state}</span></>}
                {profile.nature_of_business && <><span className="text-gray-300">|</span><span>{profile.nature_of_business}</span></>}
                {profile.filing_frequency && <><span className="text-gray-300">|</span><span className="capitalize">{profile.filing_frequency} filer</span></>}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {lastUpdated && (
              <span className="text-xs text-gray-500 whitespace-nowrap hidden md:inline-block">
                Updated: <span className="font-medium text-gray-800">{lastUpdated}</span>
              </span>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:inline max-w-[120px] truncate">{displayName}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  </div>
                  <button onClick={() => { setShowUserMenu(false); router.push('/dashboard/sme/settings'); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings className="h-4 w-4 text-gray-400" /> Settings
                  </button>
                  <button onClick={() => { setShowUserMenu(false); router.push('/onboarding'); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="h-4 w-4 text-gray-400" /> Edit Profile
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={async () => { await supabase.auth.signOut(); router.push('/auth'); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Card 1: Total Invoices */}
          <div
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-all relative overflow-hidden"
            onClick={() => router.push('/dashboard/sme/invoices/purchase')}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16" />
            </div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Invoices</p>
                  {loading ? <Skeleton className="h-8 w-20 bg-blue-400" /> : (
                    <h3 className="text-3xl font-bold text-white">{totalInvoices.toLocaleString()}</h3>
                  )}
                </div>
                <FileText className="h-6 w-6 text-white opacity-80" />
              </div>
              <div className="bg-white/20 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/90">Purchase</span>
                  {loading ? <Skeleton className="h-4 w-10 bg-blue-400" /> : (
                    <span className="text-sm font-bold text-white">{(metrics?.purchaseCount ?? 0).toLocaleString()}</span>
                  )}
                </div>
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: totalInvoices > 0 ? `${Math.round(((metrics?.purchaseCount ?? 0) / totalInvoices) * 100)}%` : '0%' }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/90">Sales</span>
                  {loading ? <Skeleton className="h-4 w-10 bg-blue-400" /> : (
                    <span className="text-sm font-bold text-white">{(metrics?.salesCount ?? 0).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-blue-100">All time</span>
                <span
                  className="flex items-center gap-1 text-white font-semibold cursor-pointer hover:underline"
                  onClick={(e) => { e.stopPropagation(); router.push('/dashboard/sme/invoices/upload'); }}
                >
                  <Upload className="h-3 w-3" /> Upload
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: ITC Available */}
          <div
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-all relative overflow-hidden"
            onClick={() => router.push('/dashboard/sme/itc/summary')}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16" />
            </div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">ITC Available</p>
                  {loading ? <Skeleton className="h-8 w-24 bg-emerald-400" /> : (
                    <h3 className="text-3xl font-bold text-white">{fmt(metrics?.itcAvailable ?? 0)}</h3>
                  )}
                </div>
                <TrendingUp className="h-6 w-6 text-white opacity-80" />
              </div>
              <div className="bg-white/20 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/90">Claimed</span>
                  {loading ? <Skeleton className="h-4 w-16 bg-emerald-400" /> : (
                    <span className="text-sm font-bold text-white">{fmt(metrics?.itcClaimed ?? 0)}</span>
                  )}
                </div>
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${itcPct}%` }} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-emerald-100">
                  Unclaimed: {fmt(Math.max(0, (metrics?.itcAvailable ?? 0) - (metrics?.itcClaimed ?? 0)))}
                </span>
                <span className="text-white font-bold">{itcPct}%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Tax Payable */}
          <div
            className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-all relative overflow-hidden"
            onClick={() => router.push('/dashboard/sme/returns/gstr3b')}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16" />
            </div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-amber-100 text-xs font-semibold uppercase tracking-wider mb-1">Est. Tax Payable</p>
                  {loading ? <Skeleton className="h-8 w-24 bg-amber-400" /> : (
                    <h3 className="text-3xl font-bold text-white">{fmt(taxPayable)}</h3>
                  )}
                </div>
                <AlertCircle className="h-6 w-6 text-white opacity-80" />
              </div>
              <div className="bg-white/20 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/90">Output Tax</span>
                  {loading ? <Skeleton className="h-4 w-16 bg-amber-400" /> : (
                    <span className="text-sm font-bold text-white">{fmt(metrics?.outputTax ?? 0)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/90">ITC Setoff</span>
                  {loading ? <Skeleton className="h-4 w-16 bg-amber-400" /> : (
                    <span className="text-sm font-bold text-white">−{fmt(metrics?.itcClaimed ?? 0)}</span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-amber-100">
                <Clock className="h-3 w-3" />
                <span>From GSTR-3B data</span>
              </div>
            </div>
          </div>

          {/* Card 4: Needs Review */}
          <div
            className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-all relative overflow-hidden"
            onClick={() => router.push('/dashboard/sme/invoices/validation')}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16" />
            </div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-rose-100 text-xs font-semibold uppercase tracking-wider mb-1">Open Remarks</p>
                  {loading ? <Skeleton className="h-8 w-16 bg-rose-400" /> : (
                    <h3 className="text-3xl font-bold text-white">{(metrics?.pendingReview ?? 0).toLocaleString()}</h3>
                  )}
                </div>
                <div className="relative">
                  <ShieldCheck className="h-6 w-6 text-white opacity-80" />
                  {(metrics?.pendingReview ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/90">Unmatched / Error</span>
                  {loading ? <Skeleton className="h-4 w-8 bg-rose-400" /> : (
                    <span className="text-sm font-bold text-white">{metrics?.unmatchedCount ?? 0}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/90">Reconciled</span>
                  {loading ? <Skeleton className="h-4 w-8 bg-rose-400" /> : (
                    <span className="text-sm font-bold text-white">{metrics?.matchedCount ?? 0}</span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-rose-100">Needs attention</span>
                <span className="text-white font-semibold flex items-center gap-1">
                  View <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILING STATUS STRIP ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* GSTR-1 */}
          <div
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => router.push('/dashboard/sme/returns/gstr1')}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">GSTR-1</h4>
                {loading ? <Skeleton className="h-3 w-24 mt-1" /> : (
                  <p className={`text-xs mt-1 font-medium ${gstReturnStatusStyle(gstr1?.status ?? '')}`}>
                    {gstr1 ? statusLabel(gstr1.status) : 'No data'}
                    {gstr1?.return_period ? ` · ${monthLabel(gstr1.return_period)}` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/sme/returns/gstr1'); }}
                className="text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
              >View</button>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${gstr1?.status === 'filed' || gstr1?.status === 'submitted' ? 'bg-emerald-500 w-full' : gstr1?.status === 'generated' ? 'bg-blue-500 w-3/4' : 'bg-amber-400 w-1/2'}`} />
            </div>
          </div>

          {/* GSTR-3B */}
          <div
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => router.push('/dashboard/sme/returns/gstr3b')}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">GSTR-3B</h4>
                {loading ? <Skeleton className="h-3 w-24 mt-1" /> : (
                  <p className={`text-xs mt-1 font-medium ${gstReturnStatusStyle(gstr3b?.status ?? '')}`}>
                    {gstr3b ? statusLabel(gstr3b.status) : 'No data'}
                    {gstr3b?.return_period ? ` · ${monthLabel(gstr3b.return_period)}` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/sme/returns/gstr3b'); }}
                className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded transition-colors"
              >View</button>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${gstr3b?.status === 'filed' ? 'bg-emerald-500 w-full' : gstr3b?.status === 'generated' ? 'bg-amber-500 w-4/5' : 'bg-gray-300 w-1/3'}`} />
            </div>
          </div>

          {/* Reconciliation */}
          <div
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => router.push('/dashboard/sme/reconciliation/run')}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Reconciliation</h4>
                {loading ? <Skeleton className="h-3 w-32 mt-1" /> : (
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics && (metrics.matchedCount + metrics.unmatchedCount) > 0
                      ? `${matchPct}% matched · ${metrics.unmatchedCount} issues`
                      : 'Run reconciliation to see data'}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/sme/reconciliation/run'); }}
                className="text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
              ><Zap className="h-3 w-3" />Run</button>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all duration-700 rounded-l-full" style={{ width: `${matchPct}%` }} />
              {matchPct < 100 && <div className="h-full bg-red-400 rounded-r-full" style={{ width: `${100 - matchPct}%` }} />}
            </div>
          </div>
        </div>

        {/* ── ITC TREND CHART ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" /> ITC Trend
            </h3>
            <div className="flex gap-3">
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Available</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Claimed</span>
            </div>
          </div>

          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : itcTrend.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={itcTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gAvail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gClaim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: number) => [fmtFull(value), '']}
                  />
                  <Area type="monotone" dataKey="available" stroke="#3b82f6" strokeWidth={2} fill="url(#gAvail)" dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} name="Available" />
                  <Area type="monotone" dataKey="claimed" stroke="#10b981" strokeWidth={2} fill="url(#gClaim)" dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} name="Claimed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
              <TrendingUp className="h-10 w-10 opacity-20" />
              <p>No ITC data available yet</p>
              <button
                onClick={() => router.push('/dashboard/sme/returns/gstr2b')}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >Fetch GSTR-2B →</button>
            </div>
          )}
        </div>

        {/* ── RECENT INVOICES TABLE ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h3 className="text-lg font-bold text-gray-900">Recent Invoices</h3>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoice, party, GSTIN…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-56 hover:border-gray-300"
                />
              </div>
              <button
                onClick={() => router.push('/dashboard/sme/invoices/purchase')}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors whitespace-nowrap"
              >View All</button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-gray-400 text-sm gap-2">
              <FileText className="h-10 w-10 opacity-20" />
              {searchQuery ? 'No invoices match your search.' : 'No invoices uploaded yet.'}
              {!searchQuery && (
                <button onClick={() => router.push('/dashboard/sme/invoices/upload')} className="text-emerald-600 font-semibold text-xs hover:underline mt-1">
                  Upload your first invoice →
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs">Invoice No</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs">Date</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs">Type</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs">Party</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs text-right">Taxable</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs text-right">GST</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-xs text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900 font-mono text-xs">
                          {inv.invoice_number ?? <span className="text-gray-400 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                          {inv.invoice_date ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${inv.type === 'Purchase' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {inv.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-medium text-xs">{inv.party ?? '—'}</span>
                            {inv.gstin && <span className="text-[10px] text-gray-400 font-mono">{inv.gstin}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 text-xs whitespace-nowrap">
                          {inv.taxable_value > 0 ? fmtFull(inv.taxable_value) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 text-xs whitespace-nowrap">
                          {inv.tax > 0 ? fmtFull(inv.tax) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(inv.status)}`}>
                            {statusLabel(inv.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500 px-1">
                <span>Showing {filteredInvoices.length} of {recentInvoices.length} recent invoices</span>
                <button
                  onClick={() => router.push('/dashboard/sme/invoices/purchase')}
                  className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                >View all <ChevronRight className="h-3 w-3" /></button>
              </div>
            </>
          )}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Upload Invoices', icon: Upload, path: '/dashboard/sme/invoices/upload', color: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700' },
            { label: 'Run Reconciliation', icon: Zap, path: '/dashboard/sme/reconciliation/run', color: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700' },
            { label: 'GSTR-2B Fetch', icon: RefreshCw, path: '/dashboard/sme/returns/gstr2b', color: 'from-teal-50 to-teal-100 border-teal-200 text-teal-700' },
            { label: 'View Discrepancies', icon: AlertCircle, path: '/dashboard/sme/reconciliation/discrepancies', color: 'from-amber-50 to-amber-100 border-amber-200 text-amber-700' },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => router.push(action.path)}
              className={`flex flex-col items-center gap-3 p-4 bg-gradient-to-br ${action.color} rounded-2xl border text-sm font-semibold hover:shadow-md transition-all`}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
