'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  X,
} from 'lucide-react';
import { InsightPanel } from '@/components/reconciliation/InsightPanel';
import { DksSourceBanner } from '@/components/reconciliation/DksSourceBanner';
import { fetchReconciliationPayload } from '@/lib/reconciliation/clientFetch';
import { buildReconciliationPeriodOptions } from '@/lib/reconciliation/periodOptions';
import { DKS_MARCH_PERIOD } from '@/lib/reconciliation/dksMarchConstants';
import type {
  DiscrepancyType,
  InsightInvoicePayload,
  InsightPurchasePayload,
} from '@/lib/reconciliation/insightTypes';

const PERIODS = buildReconciliationPeriodOptions();

function taxFromRow(row: Record<string, unknown>): number {
  return (
    (Number(row.igst_amount) || 0) +
    (Number(row.cgst_amount) || 0) +
    (Number(row.sgst_amount) || 0) +
    (Number(row.cess_amount) || 0)
  );
}

function toGstr2bPayload(g: Record<string, unknown>): InsightInvoicePayload {
  return {
    id: g.id != null ? String(g.id) : undefined,
    invoice_number: g.invoice_number != null ? String(g.invoice_number) : null,
    invoice_date: g.invoice_date != null ? String(g.invoice_date) : null,
    supplier_gstin: g.supplier_gstin != null ? String(g.supplier_gstin) : null,
    supplier_name: g.supplier_name != null ? String(g.supplier_name) : null,
    taxable_value: Number(g.taxable_value) || 0,
    igst_amount: Number(g.igst_amount) || 0,
    cgst_amount: Number(g.cgst_amount) || 0,
    sgst_amount: Number(g.sgst_amount) || 0,
    cess_amount: Number(g.cess_amount) || 0,
    place_of_supply: g.place_of_supply != null ? String(g.place_of_supply) : null,
    section:
      g.section != null && typeof g.section === 'string'
        ? (g.section as InsightInvoicePayload['section'])
        : undefined,
    itc_eligible: g.itc_eligible === true,
    reverse_charge: g.reverse_charge === true,
  };
}

function toPurchasePayload(p: Record<string, unknown>): InsightPurchasePayload {
  return {
    id: p.id != null ? String(p.id) : undefined,
    invoice_number: p.invoice_number != null ? String(p.invoice_number) : null,
    invoice_date: p.invoice_date != null ? String(p.invoice_date) : null,
    supplier_gstin: p.supplier_gstin != null ? String(p.supplier_gstin) : null,
    supplier_name: p.supplier_name != null ? String(p.supplier_name) : null,
    taxable_value: Number(p.taxable_value) || 0,
    total_invoice_value: Number(p.total_invoice_value) || 0,
    igst_amount: Number(p.igst_amount) || 0,
    cgst_amount: Number(p.cgst_amount) || 0,
    sgst_amount: Number(p.sgst_amount) || 0,
    cess_amount: Number(p.cess_amount) || 0,
  };
}

interface DiscrepancyInvoiceRow {
  id: string;
  date: string;
  vendor: string;
  gstin: string;
  amount: number;
  gst: number;
  reason?: string;
  status?: string;
  daysPending: number;
  filingStatus?: string;
  lastReminder?: string;
  placeOfSupply?: string;
  gstr2b?: InsightInvoicePayload | null;
  purchase?: InsightPurchasePayload | null;
}

interface ValueMismatchRow {
  id: string;
  date: string;
  vendor: string;
  bookAmount: number;
  gstr2bAmount: number;
  diff: number;
  taxDiff: number;
  type: string;
  withinTolerance: boolean;
  gstr2b?: InsightInvoicePayload | null;
  purchase?: InsightPurchasePayload | null;
}

function formatCompactInr(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function DiscrepanciesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'books' | 'gstr2b' | 'value'>('books');
  const defaultPeriod =
    PERIODS.find((p) => p.value === DKS_MARCH_PERIOD)?.value ?? PERIODS[0].value;
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [loading, setLoading] = useState(true);
  const [returnId, setReturnId] = useState<string | null>(null);
  const [dksSources, setDksSources] = useState<{ gstr2bFile: string; gstr1File: string } | null>(
    null
  );
  const [gstr1Meta, setGstr1Meta] = useState<Record<string, unknown> | null>(null);
  const [missingInBooks, setMissingInBooks] = useState<DiscrepancyInvoiceRow[]>([]);
  const [missingInGSTR2B, setMissingInGSTR2B] = useState<DiscrepancyInvoiceRow[]>([]);
  const [valueMismatches, setValueMismatches] = useState<ValueMismatchRow[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { payload: data, returnId: rid, isDks } = await fetchReconciliationPayload(
        selectedPeriod
      );
      if (!data || !rid) {
        setReturnId(null);
        setDksSources(null);
        setGstr1Meta(null);
        setMissingInBooks([]);
        setMissingInGSTR2B([]);
        setValueMismatches([]);
        return;
      }
      setReturnId(rid);
      if (isDks && data.sources) {
        setDksSources(data.sources);
        setGstr1Meta((data.gstr1Meta as Record<string, unknown>) || null);
      } else {
        setDksSources(null);
        setGstr1Meta(null);
      }
      const missingBooksRaw = (data.missing_in_books || []) as Record<string, unknown>[];
      setMissingInBooks(
        missingBooksRaw.map((g) => {
          const payload = toGstr2bPayload(g);
          return {
            id: String(g.invoice_number || g.id || ''),
            date: String(g.invoice_date || ''),
            vendor: String(g.supplier_name || ''),
            gstin: String(g.supplier_gstin || ''),
            amount: Number(g.taxable_value) || 0,
            gst: taxFromRow(g),
            reason: 'In GSTR-2B only',
            status: 'Active',
            daysPending: 0,
            placeOfSupply: g.place_of_supply != null ? String(g.place_of_supply) : undefined,
            gstr2b: payload,
            purchase: null,
          };
        })
      );
      const missingGstr2bRaw = (data.missing_in_gstr2b || []) as Record<string, unknown>[];
      setMissingInGSTR2B(
        missingGstr2bRaw.map((p) => {
          const payload = toPurchasePayload(p);
          return {
            id: String(p.invoice_number || p.id || ''),
            date: String(p.invoice_date || ''),
            vendor: String(p.supplier_name || ''),
            gstin: String(p.supplier_gstin || ''),
            amount: Number(p.taxable_value || p.total_invoice_value) || 0,
            gst: taxFromRow(p),
            daysPending: 0,
            filingStatus: 'Not in GSTR-2B',
            lastReminder: '—',
            gstr2b: null,
            purchase: payload,
          };
        })
      );
      const partialRaw = (data.partial || []) as Array<{
        gstr2b: Record<string, unknown>;
        purchase: Record<string, unknown>;
        diff: { taxable: number; tax: number };
      }>;
      setValueMismatches(
        partialRaw.map((pair) => {
            const bookAmount = Number(pair.purchase.taxable_value) || 0;
            const gstr2bAmount = Number(pair.gstr2b.taxable_value) || 0;
            const diffVal = pair.diff?.taxable ?? pair.diff?.tax ?? 0;
            const taxDiff = pair.diff?.tax ?? 0;
            return {
              id: String(pair.gstr2b.invoice_number || pair.gstr2b.id || ''),
              date: String(pair.gstr2b.invoice_date || ''),
              vendor: String(pair.gstr2b.supplier_name || ''),
              bookAmount,
              gstr2bAmount,
              diff: diffVal,
              taxDiff,
              type: Math.abs(pair.diff?.taxable || 0) <= 1 ? 'Rounding' : 'Value/GST',
              withinTolerance: Math.abs(pair.diff?.taxable || 0) <= 1,
              gstr2b: toGstr2bPayload(pair.gstr2b),
              purchase: toPurchasePayload(pair.purchase),
            };
          }
        )
      );
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const booksGst = missingInBooks.reduce((s, r) => s + r.gst, 0);
    const gstr2bGst = missingInGSTR2B.reduce((s, r) => s + r.gst, 0);
    const gstr2bAmount = missingInGSTR2B.reduce((s, r) => s + r.amount, 0);
    const avgDiff =
      valueMismatches.length > 0
        ? valueMismatches.reduce((s, r) => s + Math.abs(r.diff), 0) / valueMismatches.length
        : 0;
    const total = missingInBooks.length + missingInGSTR2B.length + valueMismatches.length;
    return { total, booksGst, gstr2bGst, gstr2bAmount, avgDiff };
  }, [missingInBooks, missingInGSTR2B, valueMismatches]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const rowInsight = (
    type: DiscrepancyType,
    rowId: string,
    opts: {
      gstr2b?: InsightInvoicePayload | null;
      purchase?: InsightPurchasePayload | null;
      diff?: { taxable?: number; tax?: number };
    }
  ) => (
    <InsightPanel
      returnId={returnId}
      discrepancyType={type}
      period={selectedPeriod}
      dksMarch={selectedPeriod === DKS_MARCH_PERIOD}
      gstr2b={opts.gstr2b}
      purchase={opts.purchase}
      diff={opts.diff}
      enabled={expandedRows.includes(rowId) && Boolean(returnId)}
    />
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-2">
              <span className="text-emerald-700 text-xs font-semibold">RECONCILIATION</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Discrepancies</h1>
            <p className="text-gray-600 text-sm mt-1">Invoices that didn&apos;t match or have differences</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {!returnId && selectedPeriod !== DKS_MARCH_PERIOD && (
              <button
                onClick={() => router.push('/dashboard/sme/returns/gstr2b')}
                className="text-sm text-emerald-700 underline"
              >
                Fetch GSTR-2B first
              </button>
            )}
          </div>
        </div>

        {dksSources && (
          <DksSourceBanner
            sources={dksSources}
            gstr1Meta={
              gstr1Meta as {
                legalName?: string;
                gstin?: string;
                arn?: string;
                b2bInvoiceCount?: number;
              }
            }
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <div className="flex flex-col h-full justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Discrepancies</p>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                <p className="text-xs text-gray-500 mt-1">For selected period</p>
              </div>
            </div>
          </div>

          <div
            className={`bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-200 shadow-lg p-5 cursor-pointer transition-all ${activeTab === 'books' ? 'ring-2 ring-orange-400' : 'hover:border-orange-300'}`}
            onClick={() => setActiveTab('books')}
          >
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <AlertOctagon className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-xs text-orange-700 uppercase tracking-wider font-semibold">Missing in Books</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{missingInBooks.length}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  ITC at Risk:{' '}
                  <span className="text-orange-700 font-semibold">{formatCompactInr(stats.booksGst)}</span>
                </p>
              </div>
            </div>
          </div>

          <div
            className={`bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-200 shadow-lg p-5 cursor-pointer transition-all ${activeTab === 'gstr2b' ? 'ring-2 ring-red-400' : 'hover:border-red-300'}`}
            onClick={() => setActiveTab('gstr2b')}
          >
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-xs text-red-700 uppercase tracking-wider font-semibold">Missing in GSTR-2B</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{missingInGSTR2B.length}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Amount: <span className="text-red-700 font-semibold">{formatCompactInr(stats.gstr2bAmount)}</span>
                </p>
              </div>
            </div>
          </div>

          <div
            className={`bg-gradient-to-br from-yellow-50 to-white rounded-2xl border border-yellow-200 shadow-lg p-5 cursor-pointer transition-all ${activeTab === 'value' ? 'ring-2 ring-yellow-400' : 'hover:border-yellow-300'}`}
            onClick={() => setActiveTab('value')}
          >
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-lg">
                  <HelpCircle className="h-4 w-4 text-yellow-600" />
                </div>
                <p className="text-xs text-yellow-700 uppercase tracking-wider font-semibold">Value Mismatches</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{valueMismatches.length}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Avg Diff:{' '}
                  <span className="text-yellow-700 font-semibold">
                    {valueMismatches.length > 0 ? formatCompactInr(stats.avgDiff) : '—'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200 bg-white rounded-t-2xl">
          <button
            onClick={() => setActiveTab('books')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'books' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Missing in Books{' '}
            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">
              {missingInBooks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('gstr2b')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'gstr2b' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Missing in GSTR-2B{' '}
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">
              {missingInGSTR2B.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('value')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'value' ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Value Mismatches{' '}
            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-semibold">
              {valueMismatches.length}
            </span>
          </button>
        </div>

        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 shadow-lg overflow-hidden min-h-[400px]">
          {activeTab === 'books' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="p-4 bg-orange-50 border-b border-orange-200 text-orange-700 text-sm flex items-center gap-2">
                <AlertOctagon className="h-4 w-4" />
                These invoices are reported in GSTR-2B but not found in your purchase register. Add them to claim ITC.
              </div>

              {missingInBooks.length === 0 && (
                <p className="p-8 text-center text-gray-500 text-sm">No discrepancies in this category.</p>
              )}

              {missingInBooks.map((inv) => (
                <div key={inv.id} className="border-b border-gray-100 last:border-0">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleRow(inv.id)}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleRowSelection(inv.id)}
                        checked={selectedRows.includes(inv.id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <button
                        className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-gray-900' : 'text-gray-400'}`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">{inv.id}</span>
                          <span className="text-xs text-gray-500">{inv.date}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{inv.vendor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">₹{inv.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">GSTR-2B Amount</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-600">₹{inv.gst.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">ITC at Risk</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-orange-50 text-orange-700 text-xs border border-orange-200">
                        {inv.reason}
                      </span>
                    </div>
                  </div>

                  {expandedRows.includes(inv.id) && (
                    <div className="bg-gray-50 p-6 animate-in slide-in-from-top-2 duration-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">GSTR-2B Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-xl mb-4">
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">Taxable Value</span>
                          <span className="text-gray-900 font-medium">₹{inv.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">Tax Amount</span>
                          <span className="text-gray-900 font-medium">₹{inv.gst.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">GSTIN</span>
                          <span className="text-gray-900 font-medium font-mono text-xs">{inv.gstin || '—'}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">Place of Supply</span>
                          <span className="text-gray-900 font-medium">{inv.placeOfSupply || '—'}</span>
                        </div>
                      </div>
                      {rowInsight('missing_in_books', inv.id, { gstr2b: inv.gstr2b })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'gstr2b' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                These invoices are in your books but missing from GSTR-2B. Follow up with vendor to avoid ITC reversal.
              </div>

              {missingInGSTR2B.length === 0 && (
                <p className="p-8 text-center text-gray-500 text-sm">No discrepancies in this category.</p>
              )}

              {missingInGSTR2B.map((inv) => (
                <div key={inv.id} className="border-b border-gray-100 last:border-0">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleRow(inv.id)}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleRowSelection(inv.id)}
                        checked={selectedRows.includes(inv.id)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <button
                        className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-gray-900' : 'text-gray-400'}`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">{inv.id}</span>
                          <span className="text-xs text-gray-500">{inv.date}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{inv.vendor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">₹{inv.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">Your Amount</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">₹{inv.gst.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">ITC at Risk</p>
                      </div>
                    </div>
                  </div>

                  {expandedRows.includes(inv.id) && (
                    <div className="bg-gray-50 p-6 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Book entry</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status</span>
                                <span className="text-red-600 font-medium">{inv.filingStatus}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">GSTIN</span>
                                <span className="text-gray-900 font-medium font-mono text-xs">
                                  {inv.gstin || 'Not recorded'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Taxable value</span>
                                <span className="text-gray-900 font-medium">₹{inv.amount.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          {rowInsight('missing_in_gstr2b', inv.id, { purchase: inv.purchase })}
                        </div>

                        <div className="flex flex-col gap-3 justify-start">
                          <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 shadow-sm">
                            <MessageSquare className="h-4 w-4" /> Send Reminder
                          </button>
                          <div className="flex gap-2">
                            <button className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                              <Phone className="h-4 w-4" /> Call
                            </button>
                            <button className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                              <Mail className="h-4 w-4" /> Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'value' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="p-4 bg-yellow-50 border-b border-yellow-200 text-yellow-700 text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Invoice numbers match but amounts differ. Verify if differences are due to rounding or calculation errors.
              </div>

              {valueMismatches.length === 0 && (
                <p className="p-8 text-center text-gray-500 text-sm">No discrepancies in this category.</p>
              )}

              {valueMismatches.map((inv) => (
                <div key={inv.id} className="border-b border-gray-100 last:border-0">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleRow(inv.id)}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleRowSelection(inv.id)}
                        checked={selectedRows.includes(inv.id)}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <button
                        className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-gray-900' : 'text-gray-400'}`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">{inv.id}</span>
                          <span className="text-xs text-gray-500">{inv.date}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{inv.vendor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">₹{inv.bookAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">Your Books</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-600">₹{inv.gstr2bAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">GSTR-2B</p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p
                          className={`text-sm font-bold ${inv.withinTolerance ? 'text-yellow-600' : 'text-red-600'}`}
                        >
                          {inv.bookAmount > inv.gstr2bAmount ? '+' : '-'}₹{Math.abs(inv.diff)}
                        </p>
                        <p className="text-[10px] text-gray-500">{inv.type}</p>
                      </div>
                      <div className="text-center">
                        {inv.withinTolerance ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Tolerable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <X className="h-3 w-3" /> Exceeds
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedRows.includes(inv.id) && (
                    <div className="bg-gray-50 p-6 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">Comparison Analysis</h4>
                        {inv.withinTolerance && (
                          <p className="text-xs text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Difference is within configured tolerance of ₹1
                          </p>
                        )}
                      </div>

                      <div className="flex gap-4 items-center justify-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Your Value</p>
                          <p className="text-xl font-bold text-blue-600">₹{inv.bookAmount}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">GSTR-2B Value</p>
                          <p className="text-xl font-bold text-orange-600">₹{inv.gstr2bAmount}</p>
                        </div>
                        <div className="ml-8 pl-8 border-l border-gray-200 text-left">
                          <p className="text-xs text-gray-500 mb-1">Difference</p>
                          <p
                            className={`text-xl font-bold ${inv.withinTolerance ? 'text-yellow-600' : 'text-red-600'}`}
                          >
                            ₹{inv.diff}
                          </p>
                        </div>
                      </div>

                      {rowInsight('value_mismatch', inv.id, {
                        gstr2b: inv.gstr2b,
                        purchase: inv.purchase,
                        diff: { taxable: inv.diff, tax: inv.taxDiff },
                      })}

                      <div className="flex justify-end gap-3 mt-4">
                        <button className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm">
                          Accept GSTR-2B Value
                        </button>
                        <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                          Request Vendor Amendment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
