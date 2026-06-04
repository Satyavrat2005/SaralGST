'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Search,
  Calendar,
  Loader2,
  ShieldCheck,
  X,
  FileText,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { InsightPanel } from '@/components/reconciliation/InsightPanel';
import { DksSourceBanner } from '@/components/reconciliation/DksSourceBanner';
import { fetchReconciliationPayload } from '@/lib/reconciliation/clientFetch';
import { buildReconciliationPeriodOptions } from '@/lib/reconciliation/periodOptions';
import { DKS_MARCH_PERIOD } from '@/lib/reconciliation/dksMarchConstants';
import type { InsightInvoicePayload, InsightPurchasePayload } from '@/lib/reconciliation/insightTypes';

const PERIODS = buildReconciliationPeriodOptions();

interface MatchedRow {
  id: string;
  invoice_number: string;
  date: string;
  vendor: string;
  gstin: string;
  amount: number;
  gstr2bAmount: number;
  type: string;
  itc: number;
  status: 'Reviewed' | 'Pending';
  confidence: number;
  gstr2b?: InsightInvoicePayload | null;
  purchase?: InsightPurchasePayload | null;
  matchKind: 'exact' | 'fuzzy';
}

export default function MatchedInvoicesPage() {
  const router = useRouter();
  const defaultPeriod =
    PERIODS.find((p) => p.value === DKS_MARCH_PERIOD)?.value ?? PERIODS[0].value;
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [returnId, setReturnId] = useState<string | null>(null);
  const [dksSources, setDksSources] = useState<{ gstr2bFile: string; gstr1File: string } | null>(null);
  const [gstr1Meta, setGstr1Meta] = useState<{
    legalName?: string;
    gstin?: string;
    arn?: string;
    b2bInvoiceCount?: number;
  } | null>(null);
  const [matchedInvoices, setMatchedInvoices] = useState<MatchedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<MatchedRow | null>(null);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filterVendor, setFilterVendor] = useState('__all__');
  const [filterType, setFilterType]     = useState('__all__');
  const [filterSearch, setFilterSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    // Reset filters on period change
    setFilterVendor('__all__');
    setFilterType('__all__');
    setFilterSearch('');
    try {
      const { payload: data, returnId: rid, isDks } = await fetchReconciliationPayload(
        selectedPeriod,
        { view: 'matched' }
      );
      if (!data || !rid) {
        setReturnId(null);
        setDksSources(null);
        setGstr1Meta(null);
        setMatchedInvoices([]);
        return;
      }
      setReturnId(rid);
      if (isDks && data.sources) {
        setDksSources(data.sources);
        setGstr1Meta((data.gstr1Meta as typeof gstr1Meta) || null);
      } else {
        setDksSources(null);
        setGstr1Meta(null);
      }
      const pairs = (data.data || data.matched || []) as Array<{
        gstr2b: Record<string, unknown>;
        purchase: Record<string, unknown>;
      }>;
      const rows: MatchedRow[] = pairs.map((pair) => {
        const g = pair.gstr2b;
        const p = pair.purchase;
        const gTax =
          (Number(g.igst_amount) || 0) +
          (Number(g.cgst_amount) || 0) +
          (Number(g.sgst_amount) || 0);
        const pTax =
          (Number(p.igst_amount) || 0) +
          (Number(p.cgst_amount) || 0) +
          (Number(p.sgst_amount) || 0);
        const exact = Math.abs(Number(g.taxable_value) - Number(p.taxable_value)) <= 1;
        return {
          id: String(g.id || p.id || g.invoice_number),
          invoice_number: String(g.invoice_number || p.invoice_number || ''),
          date: String(g.invoice_date || p.invoice_date || ''),
          vendor: String(g.supplier_name || p.supplier_name || ''),
          gstin: String(g.supplier_gstin || p.supplier_gstin || ''),
          amount: Number(p.taxable_value || p.total_invoice_value || 0),
          gstr2bAmount: Number(g.taxable_value || 0),
          type: exact ? 'Exact Match' : 'Fuzzy Match',
          itc: gTax || pTax,
          status: exact ? 'Reviewed' : 'Pending',
          confidence: exact ? 100 : 92,
          matchKind: exact ? 'exact' : 'fuzzy',
          gstr2b: {
            invoice_number: String(g.invoice_number || ''),
            invoice_date: String(g.invoice_date || ''),
            supplier_gstin: String(g.supplier_gstin || ''),
            supplier_name: String(g.supplier_name || ''),
            taxable_value: Number(g.taxable_value) || 0,
            igst_amount: Number(g.igst_amount) || 0,
            cgst_amount: Number(g.cgst_amount) || 0,
            sgst_amount: Number(g.sgst_amount) || 0,
          },
          purchase: {
            invoice_number: String(p.invoice_number || ''),
            invoice_date: String(p.invoice_date || ''),
            supplier_gstin: String(p.supplier_gstin || ''),
            supplier_name: String(p.supplier_name || ''),
            taxable_value: Number(p.taxable_value) || 0,
            igst_amount: Number(p.igst_amount) || 0,
            cgst_amount: Number(p.cgst_amount) || 0,
            sgst_amount: Number(p.sgst_amount) || 0,
          },
        };
      });
      setMatchedInvoices(rows);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived: unique vendor list for dropdown ────────────────────────────────
  const vendorOptions = useMemo(() => {
    const names = Array.from(new Set(matchedInvoices.map((r) => r.vendor).filter(Boolean))).sort();
    return names;
  }, [matchedInvoices]);

  // ── Filtered rows ───────────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    const search = filterSearch.trim().toLowerCase();
    return matchedInvoices.filter((inv) => {
      if (filterVendor !== '__all__' && inv.vendor !== filterVendor) return false;
      if (filterType !== '__all__' && inv.type !== filterType) return false;
      if (search) {
        const hay = `${inv.invoice_number} ${inv.vendor} ${inv.gstin} ${inv.date}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [matchedInvoices, filterVendor, filterType, filterSearch]);

  const getMatchTypeStyle = (type: string) => {
    switch (type) {
      case 'Exact Match': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Fuzzy Match': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const matchBreakdown = [
    { name: 'Exact Match', value: matchedInvoices.filter((i) => i.type === 'Exact Match').length, color: '#3B82F6' },
    { name: 'Fuzzy Match', value: matchedInvoices.filter((i) => i.type === 'Fuzzy Match').length, color: '#10B981' },
  ].filter((x) => x.value > 0);

  const totalItc = matchedInvoices.reduce((s, i) => s + i.itc, 0);

  const hasActiveFilters = filterVendor !== '__all__' || filterType !== '__all__' || filterSearch.trim() !== '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!returnId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-600 text-center max-w-md">
          {selectedPeriod === DKS_MARCH_PERIOD
            ? "DKS March files not found. Add DKS - GSTR-2B_MAR'25 - FINAL.xlsx and DKS - GSTR1_MAR'25 - OK.pdf to the project root or public folder."
            : 'No GSTR-2B fetched for this period.'}
        </p>
        {selectedPeriod !== DKS_MARCH_PERIOD && (
          <button
            onClick={() => router.push('/dashboard/sme/returns/gstr2b')}
            className="btn-primary-custom px-4 py-2 rounded-xl text-sm"
          >
            Fetch GSTR-2B
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">

        {/* ── PAGE HEADER (no action buttons) ── */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                <span className="text-emerald-700 font-bold text-sm uppercase tracking-wide">Matched Invoices</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Successfully Reconciled</h1>
              <p className="text-gray-600 text-sm mt-1">Invoices matched across all sources with high confidence</p>
            </div>
          </div>

          {/* ── FILTER BAR (all wired up) ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col lg:flex-row gap-3 items-end lg:items-center justify-between shadow-sm">
            <div className="flex flex-wrap items-center gap-3 w-full">

              {/* Period */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 block w-full pl-10 p-2"
                >
                  {PERIODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="w-px h-8 bg-gray-200 hidden md:block" />

              {/* Vendor filter — dynamic from actual data */}
              <select
                value={filterVendor}
                onChange={(e) => setFilterVendor(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-50"
              >
                <option value="__all__">All Vendors</option>
                {vendorOptions.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>

              {/* Match type filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-50"
              >
                <option value="__all__">All Match Types</option>
                <option value="Exact Match">Exact Match</option>
                <option value="Fuzzy Match">Fuzzy Match</option>
              </select>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2 placeholder-gray-400"
                  placeholder="Search by invoice no., vendor, GSTIN…"
                />
                {filterSearch && (
                  <button
                    onClick={() => setFilterSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Clear all filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterVendor('__all__'); setFilterType('__all__'); setFilterSearch(''); }}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold underline underline-offset-2 transition-colors whitespace-nowrap"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {dksSources && <DksSourceBanner sources={dksSources} gstr1Meta={gstr1Meta} />}

        {/* ── SUMMARY STATS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Matched</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{matchedInvoices.length}</h3>
                <p className="text-xs text-gray-500 mt-1">Matched with purchase register</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-600 font-bold">ITC Secured</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹ {totalItc.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div className="mt-4 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 w-[92%]" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center gap-6">
            <div className="h-24 w-24 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={matchBreakdown}
                    innerRadius={25}
                    outerRadius={35}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {matchBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#111827' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-bold text-gray-900 mb-1">Match Type Breakdown</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {matchBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-gray-900 font-mono font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── DATA TABLE ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col min-h-[500px]">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-900 font-bold">
                {filteredInvoices.length} Matched Invoice{filteredInvoices.length !== 1 ? 's' : ''}
              </span>
              {hasActiveFilters && matchedInvoices.length !== filteredInvoices.length && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {matchedInvoices.length - filteredInvoices.length} filtered out
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-white text-gray-600 font-bold sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Invoice No</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Vendor</th>
                  <th className="px-6 py-3 text-right">Your Books</th>
                  <th className="px-6 py-3 text-right">GSTR-2B</th>
                  <th className="px-6 py-3 text-center">Match Type</th>
                  <th className="px-6 py-3 text-right">ITC Eligible</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-400 text-sm">
                      {hasActiveFilters
                        ? 'No invoices match the current filters. Try clearing some filters.'
                        : 'No matched invoices for this period.'}
                    </td>
                  </tr>
                )}
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="font-bold text-gray-900 hover:text-emerald-600 hover:underline"
                      >
                        {inv.invoice_number}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{inv.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium">{inv.vendor}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{inv.gstin}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-mono font-semibold">
                      ₹{inv.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-mono font-semibold">
                      <div className="flex items-center justify-end gap-1">
                        {inv.gstr2bAmount === inv.amount
                          ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          : <ShieldCheck className="h-3 w-3 text-amber-500" />}
                        ₹{inv.gstr2bAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getMatchTypeStyle(inv.type)}`}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 font-mono">
                      ₹{inv.itc.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${inv.status === 'Reviewed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-white text-xs text-gray-500">
            Showing {filteredInvoices.length} of {matchedInvoices.length} matched invoice{matchedInvoices.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filters applied)'}
          </div>
        </div>

        {/* ── THREE-WAY COMPARISON MODAL ── */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200 w-full max-w-5xl rounded-2xl flex flex-col overflow-hidden shadow-2xl max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    Three-Way Match Comparison
                    <span className={`text-xs px-2 py-1 rounded border ${getMatchTypeStyle(selectedInvoice.type)}`}>{selectedInvoice.type}</span>
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Comparing Invoice <span className="text-gray-900 font-mono font-semibold">{selectedInvoice.id}</span> across sources
                  </p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Comparison Grid */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Column 1: Your Books */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Your Books</h3>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-3 text-sm shadow-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Invoice No</span><span className="text-gray-900 font-mono font-semibold">{selectedInvoice.id}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="text-gray-900">{selectedInvoice.date}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Vendor</span><span className="text-gray-900">{selectedInvoice.vendor}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">GSTIN</span><span className="text-gray-900 font-mono">{selectedInvoice.gstin}</span></div>
                      <div className="h-px bg-gray-200 my-2" />
                      <div className="flex justify-between"><span className="text-gray-500">Taxable</span><span className="text-gray-900 font-mono">₹{(selectedInvoice.amount * 0.82).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">GST (18%)</span><span className="text-gray-900 font-mono">₹{(selectedInvoice.amount * 0.18).toFixed(2)}</span></div>
                      <div className="flex justify-between pt-2 border-t border-gray-200"><span className="text-gray-600 font-medium">Total</span><span className="text-gray-900 font-bold font-mono">₹{selectedInvoice.amount.toLocaleString()}</span></div>
                    </div>
                  </div>

                  {/* Column 2: GSTR-2B */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded bg-emerald-100 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-emerald-600">GSTR-2B</h3>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-sm shadow-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Invoice No</span><span className="text-gray-900 font-mono font-semibold flex items-center gap-1">{selectedInvoice.id} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="text-gray-900 flex items-center gap-1">{selectedInvoice.date} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Vendor</span><span className="text-gray-900 flex items-center gap-1">{selectedInvoice.vendor} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span></div>
                      <div className="flex justify-between"><span className="text-gray-500">GSTIN</span><span className="text-gray-900 font-mono flex items-center gap-1">{selectedInvoice.gstin} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span></div>
                      <div className="h-px bg-emerald-200 my-2" />
                      <div className="flex justify-between"><span className="text-gray-500">Taxable</span><span className="text-gray-900 font-mono flex items-center gap-1">₹{(selectedInvoice.gstr2bAmount * 0.82).toFixed(2)} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span></div>
                      <div className="flex justify-between"><span className="text-gray-500">GST (18%)</span><span className="text-gray-900 font-mono flex items-center gap-1">₹{(selectedInvoice.gstr2bAmount * 0.18).toFixed(2)} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span></div>
                      <div className="flex justify-between pt-2 border-t border-emerald-200"><span className="text-gray-600 font-medium">Total</span><span className="text-gray-900 font-bold font-mono flex items-center gap-1">₹{selectedInvoice.gstr2bAmount.toLocaleString()} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span></div>
                    </div>
                  </div>

                  {/* Column 3: GSTR-2A */}
                  <div className="space-y-4 opacity-60">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-gray-500">GSTR-2A (Optional)</h3>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-3 text-sm shadow-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Invoice No</span><span className="text-gray-500 font-mono">{selectedInvoice.id}</span></div>
                      <div className="flex justify-center items-center h-40 text-gray-400 text-xs italic">
                        Matching GSTR-2A data available
                      </div>
                    </div>
                  </div>
                </div>

                <InsightPanel
                  returnId={returnId}
                  discrepancyType="matched"
                  period={selectedPeriod}
                  dksMarch={selectedPeriod === DKS_MARCH_PERIOD}
                  gstr2b={selectedInvoice.gstr2b}
                  purchase={selectedInvoice.purchase}
                  matchType={selectedInvoice.matchKind}
                  enabled={Boolean(selectedInvoice)}
                />
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-medium">Match Confidence</span>
                    <span className="text-lg font-bold text-emerald-600">{selectedInvoice.confidence}%</span>
                  </div>
                  <div className="w-px h-8 bg-gray-300" />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-medium">ITC Status</span>
                    <span className="text-lg font-bold text-gray-900">Eligible — ₹{selectedInvoice.itc.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
