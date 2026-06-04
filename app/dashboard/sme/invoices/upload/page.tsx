'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud, FileText, MessageSquare, CheckCircle2,
  AlertCircle, X, RefreshCw, Eye, Trash2,
  HelpCircle, Filter, Loader2, Clock, Phone, ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/* ─── types ─── */
type TabType = 'whatsapp' | 'manual';
type UploadStatus = 'uploading' | 'extracting' | 'validating' | 'completed' | 'failed';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
}

interface PurchaseInvoice {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  supplier_name: string | null;
  supplier_gstin: string | null;
  total_invoice_value: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  invoice_status: string | null;
  invoice_bucket_url: string | null;
  source: string | null;
  created_at: string;
}

interface WaIntake {
  id: string;
  sender_phone: string;
  invoice_number: string | null;
  last_status: string | null;
  attempt_count: number;
  created_at: string;
}

/* ─── helpers ─── */
function statusLabel(s: string | null): string {
  if (!s) return 'Pending';
  const map: Record<string, string> = {
    extracted: 'Validated', verified: 'Validated',
    needs_review: 'Needs Review', error: 'Failed',
    pending: 'Processing', validated: 'Validated',
    rejected: 'Failed', wa_quarantine: 'Quarantined',
  };
  return map[s] ?? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function statusStyle(s: string | null): string {
  const l = s ?? '';
  if (l === 'extracted' || l === 'verified' || l === 'validated') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (l === 'needs_review' || l === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (l === 'error' || l === 'rejected' || l === 'failed' || l === 'wa_quarantine') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className ?? ''}`} />;
}

/* ═══════════════════════════ PAGE ═══════════════════════════ */
export default function UploadInvoicesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadedFile[]>([]);

  /* recent invoices */
  const [recentInvoices, setRecentInvoices] = useState<PurchaseInvoice[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  /* whatsapp intake */
  const [waQueue, setWaQueue] = useState<WaIntake[]>([]);
  const [loadingWa, setLoadingWa] = useState(false);
  const [waCount, setWaCount] = useState(0);

  /* ── fetch recent purchase invoices ── */
  const fetchRecentInvoices = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/invoice/purchase?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.invoices) {
        const sorted = [...(data.invoices as PurchaseInvoice[])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentInvoices(sorted.slice(0, 15));
      } else {
        setRecentInvoices([]);
      }
    } catch {
      setRecentInvoices([]);
    } finally {
      setLoadingRecent(false);
    }
  }, [statusFilter, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── fetch whatsapp intake ── */
  const fetchWaQueue = useCallback(async () => {
    setLoadingWa(true);
    try {
      const { data, count, error } = await supabase
        .from('whatsapp_intake')
        .select('id, sender_phone, invoice_number, last_status, attempt_count, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) {
        setWaQueue((data as WaIntake[]) ?? []);
        setWaCount(count ?? 0);
      }
    } catch {
      /* silently fail */
    } finally {
      setLoadingWa(false);
    }
  }, [supabase]);

  useEffect(() => { fetchRecentInvoices(); }, [fetchRecentInvoices]);

  useEffect(() => {
    if (activeTab === 'whatsapp') fetchWaQueue();
  }, [activeTab, fetchWaQueue]);

  /* ── upload handlers ── */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFiles(e.target.files);
  };

  const updateFileStatus = (id: string, status: UploadStatus, progress: number, errorMessage?: string) => {
    setUploadQueue(prev => prev.map(f => f.id === id ? { ...f, status, progress, errorMessage } : f));
  };

  const handleFiles = async (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map(f => ({
      id: Math.random().toString(36).slice(2, 9),
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
      progress: 0,
      status: 'uploading' as UploadStatus,
    }));
    setUploadQueue(prev => [...newFiles, ...prev]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fid = newFiles[i].id;
      try {
        updateFileStatus(fid, 'uploading', 25);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('source', 'manual');
        updateFileStatus(fid, 'uploading', 45);
        const res = await fetch('/api/invoice/process', { method: 'POST', body: formData });
        updateFileStatus(fid, 'extracting', 65);
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.error || 'Failed to process');
        updateFileStatus(fid, 'validating', 85);
        await new Promise(r => setTimeout(r, 400));
        updateFileStatus(fid, 'completed', 100);
        setRefreshKey(k => k + 1);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        updateFileStatus(fid, 'failed', 100, msg);
      }
    }
  };

  const handleDelete = async (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this invoice?')) return;
    try {
      const res = await fetch(`/api/invoice/purchase/${invoiceId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRecentInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Failed to delete invoice');
    }
  };

  const renderUploadStatus = (file: UploadedFile): React.ReactNode => {
    const map: Record<UploadStatus, React.ReactNode> = {
      uploading: <span className="text-blue-600 text-xs flex items-center gap-1 font-medium"><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</span>,
      extracting: <span className="text-amber-600 text-xs flex items-center gap-1 font-medium"><Loader2 className="h-3 w-3 animate-spin" /> Extracting…</span>,
      validating: <span className="text-purple-600 text-xs flex items-center gap-1 font-medium"><Loader2 className="h-3 w-3 animate-spin" /> Validating…</span>,
      completed: <span className="text-emerald-600 text-xs flex items-center gap-1 font-medium"><CheckCircle2 className="h-3 w-3" /> Done</span>,
      failed: <span className="text-red-600 text-xs flex items-center gap-1 font-medium"><AlertCircle className="h-3 w-3" /> Failed</span>,
    };
    return map[file.status];
  };

  const filteredInvoices = statusFilter === 'all'
    ? recentInvoices
    : recentInvoices.filter(inv => {
        const s = inv.invoice_status ?? '';
        if (statusFilter === 'validated') return s === 'extracted' || s === 'verified';
        if (statusFilter === 'failed') return s === 'error' || s === 'wa_quarantine';
        if (statusFilter === 'processing') return s === 'pending' || s === 'needs_review';
        return true;
      });

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-2">
              <span className="text-emerald-700 text-xs font-semibold">INVOICE MANAGEMENT</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Upload Invoices</h1>
            <p className="text-gray-600 text-sm mt-1">Automatically extract and validate GST details from your invoices.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/sme/invoices/purchase')}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm"
            >
              View All Invoices <ChevronRight className="h-4 w-4" />
            </button>
            <div className="relative group">
              <button className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm">
                <HelpCircle className="h-5 w-5" />
              </button>
              <div className="absolute right-0 top-12 w-64 p-3 rounded-xl bg-white border border-gray-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-gray-600">
                Supported: PDF, JPG, PNG — Max 10 MB per file.
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-200 bg-white rounded-t-2xl">
          {([
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, badge: waCount },
            { id: 'manual', label: 'Manual Upload', icon: UploadCloud, badge: null },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* UPLOAD AREA */}
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 shadow-lg p-6 min-h-[280px]">

          {/* ── WHATSAPP TAB ── */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status card */}
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-200 shadow-lg p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center relative">
                    <MessageSquare className="h-8 w-8 text-emerald-600" />
                    <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-white border-2 border-emerald-200 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">WhatsApp Intake</h3>
                    <p className="text-xs text-gray-500 mt-1">Invoices received via WhatsApp</p>
                    {loadingWa ? (
                      <Skeleton className="h-7 w-12 mx-auto mt-2" />
                    ) : (
                      <p className="text-3xl font-bold text-emerald-600 mt-2">{waCount}</p>
                    )}
                    <p className="text-xs text-gray-400">total entries</p>
                  </div>
                  <button
                    onClick={fetchWaQueue}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingWa ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                {/* How it works */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works</h3>
                  <ol className="list-decimal list-inside space-y-2.5 text-sm text-gray-600">
                    <li>Vendors share invoice PDFs/images to your registered WhatsApp Business number.</li>
                    <li>Our system automatically extracts attachments and processes them via AI OCR.</li>
                    <li>Extracted data appears in the table below — review and accept to add to Purchase Register.</li>
                  </ol>
                  <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                    Invoices are auto-linked to your purchase register after successful extraction.
                  </div>
                </div>
              </div>

              {/* WhatsApp queue table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">WhatsApp Intake Queue</h3>
                  <span className="text-xs text-gray-500">{waCount} total</span>
                </div>
                {loadingWa ? (
                  <div className="p-6 space-y-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
                  </div>
                ) : waQueue.length === 0 ? (
                  <div className="flex flex-col items-center py-14 text-gray-400 gap-2">
                    <MessageSquare className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">No WhatsApp invoices received yet.</p>
                    <p className="text-xs text-gray-400">Ask vendors to share invoices to your WhatsApp number.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-600">Sender Phone</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-600">Invoice #</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-600 text-center">Attempts</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-600">Received</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {waQueue.map(wa => (
                          <tr key={wa.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                {wa.sender_phone}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-gray-600 font-mono text-xs">
                              {wa.invoice_number ?? <span className="text-gray-300 italic not-italic">—</span>}
                            </td>
                            <td className="px-6 py-3 text-gray-600 text-center">{wa.attempt_count}</td>
                            <td className="px-6 py-3 text-gray-500 text-xs">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {relativeTime(wa.created_at)}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle(wa.last_status)}`}>
                                {(wa.last_status === 'pending') && <Loader2 className="h-3 w-3 animate-spin" />}
                                {(wa.last_status === 'validated') && <CheckCircle2 className="h-3 w-3" />}
                                {statusLabel(wa.last_status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MANUAL UPLOAD TAB ── */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer h-64 ${
                    dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/30'
                  }`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input type="file" id="file-upload" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileInput} />
                  <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <UploadCloud className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Drag & drop invoices here</h3>
                  <p className="text-sm text-gray-600 mt-2">or click to browse from your computer</p>
                  <p className="text-xs text-gray-500 mt-4 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    Supports: PDF, JPG, PNG (Max 10 MB)
                  </p>
                </div>

                {/* Info card */}
                <div className="flex flex-col gap-4 h-64">
                  <div className="flex-1 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 shadow-sm flex flex-col justify-center">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-emerald-100 rounded-full mt-0.5 shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-emerald-700">Smart OCR Enabled</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          AI automatically detects vendor GSTIN, Invoice #, Date, HSN codes and all tax amounts. No manual entry needed.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                    Each uploaded invoice is automatically added to your <strong className="mx-0.5">Purchase Register</strong> and flagged for reconciliation.
                  </div>
                </div>
              </div>

              {/* Upload progress */}
              {uploadQueue.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Upload Progress</h3>
                    <button
                      onClick={() => setUploadQueue(q => q.filter(f => f.status !== 'completed' && f.status !== 'failed'))}
                      className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                    >
                      Clear done
                    </button>
                  </div>
                  {uploadQueue.map(file => (
                    <div key={file.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
                        <FileText className={`h-5 w-5 ${file.status === 'failed' ? 'text-red-500' : file.status === 'completed' ? 'text-emerald-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1.5">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <span>{renderUploadStatus(file)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${file.status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        {file.errorMessage && (
                          <p className="text-xs text-red-600 mt-1 truncate">{file.errorMessage}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setUploadQueue(q => q.filter(f => f.id !== file.id))}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RECENTLY UPLOADED SECTION */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Recently Uploaded</h3>
              {!loadingRecent && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 text-xs rounded-lg pl-3 pr-8 py-2 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-700 cursor-pointer hover:bg-gray-50"
                >
                  <option value="all">All Status</option>
                  <option value="validated">Validated</option>
                  <option value="processing">Needs Review</option>
                  <option value="failed">Failed</option>
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={() => setRefreshKey(k => k + 1)}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                title="Refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingRecent ? 'animate-spin text-emerald-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Invoice list */}
          {loadingRecent ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <FileText className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">
                {statusFilter !== 'all' ? `No ${statusFilter} invoices found.` : 'No invoices uploaded yet.'}
              </p>
              {statusFilter !== 'all' ? (
                <button onClick={() => setStatusFilter('all')} className="text-xs text-emerald-600 font-semibold hover:underline">Show all invoices</button>
              ) : (
                <button onClick={() => setActiveTab('manual')} className="text-xs text-emerald-600 font-semibold hover:underline">Upload your first invoice →</button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map(invoice => {
                const fileName = invoice.invoice_bucket_url?.split('/').pop() ?? null;
                const totalGst = (invoice.cgst_amount ?? 0) + (invoice.sgst_amount ?? 0) + (invoice.igst_amount ?? 0);
                const invoiceDate = invoice.invoice_date
                  ? new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : null;

                return (
                  <div key={invoice.id} className="group p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-emerald-300 hover:bg-white transition-all cursor-pointer">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      {/* Left: info */}
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                          <FileText className={`h-5 w-5 ${fileName?.endsWith('.pdf') ? 'text-red-500' : 'text-blue-500'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {invoice.invoice_number
                              ? <span className="font-mono">{invoice.invoice_number}</span>
                              : <span className="text-gray-400 italic text-xs font-normal">No invoice #</span>
                            }
                            {invoice.supplier_name && (
                              <span className="text-gray-500 font-normal ml-2 text-xs">• {invoice.supplier_name}</span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {invoiceDate && <span className="text-xs text-gray-500">{invoiceDate}</span>}
                            {invoice.source && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span className="text-[10px] font-medium text-gray-500 capitalize">{invoice.source}</span>
                              </>
                            )}
                            {fileName && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span className="text-[10px] text-gray-400 truncate max-w-[140px]">{fileName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: amounts */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0.5 pl-14 sm:pl-0 shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          {invoice.total_invoice_value != null
                            ? `₹${invoice.total_invoice_value.toLocaleString('en-IN')}`
                            : <span className="text-gray-400 text-xs font-normal">—</span>
                          }
                        </p>
                        <p className="text-xs text-gray-500">GST: ₹{totalGst.toLocaleString('en-IN')}</p>
                      </div>

                      {/* Right: status + actions */}
                      <div className="flex items-center gap-3 pl-14 sm:pl-0 w-full sm:w-auto justify-between sm:justify-end">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusStyle(invoice.invoice_status)}`}>
                          {statusLabel(invoice.invoice_status)}
                        </span>
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => router.push('/dashboard/sme/invoices/purchase')}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {invoice.invoice_bucket_url && (
                            <a
                              href={invoice.invoice_bucket_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition-colors"
                              title="Open PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={e => handleDelete(invoice.id, e)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-1 flex justify-center">
                <button
                  onClick={() => router.push('/dashboard/sme/invoices/purchase')}
                  className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                >
                  View all in Purchase Register <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
