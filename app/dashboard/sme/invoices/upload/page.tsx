'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud, FileText, MessageSquare, CheckCircle2,
  AlertCircle, X, Download, RefreshCw, Eye, Trash2,
  HelpCircle, Filter, Loader2, Clock, Phone,
  FileSpreadsheet, ChevronRight,
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
  updated_at: string;
}

/* ─── helpers ─── */
function statusLabel(s: string | null): string {
  if (!s) return 'Pending';
  const map: Record<string, string> = {
    extracted: 'Validated', verified: 'Validated',
    needs_review: 'Needs Review', error: 'Failed',
    pending: 'Processing', validated: 'Validated',
    rejected: 'Failed',
  };
  return map[s] ?? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}
function statusStyle(s: string | null): string {
  const l = s ?? '';
  if (l === 'extracted' || l === 'verified' || l === 'validated') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (l === 'needs_review' || l === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (l === 'error' || l === 'rejected' || l === 'failed') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`;
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

  // WhatsApp integration state
  const [waConfig, setWaConfig] = useState<{ configured: boolean; businessNumber: string | null; webhookConfigured: boolean } | null>(null);
  const [waQueue, setWaQueue] = useState<any[]>([]);
  const [loadingWaQueue, setLoadingWaQueue] = useState(false);

  // Tab Stats
  const [stats, setStats] = useState({
    whatsapp: 0,
    email: 0
  });

  // Fetch recent invoices on mount
  useEffect(() => {
    fetchRecentInvoices();
    fetchWaConfig();
  }, []);

  // Load the WhatsApp quarantine/needs-review queue when the tab is opened.
  useEffect(() => {
    if (activeTab === 'whatsapp') {
      fetchWaQueue();
    }
  }, [activeTab]);

  const fetchWaConfig = async () => {
    try {
      const res = await fetch('/api/whatsapp/config');
      const data = await res.json();
      setWaConfig(data);
    } catch (error) {
      console.error('Error fetching WhatsApp config:', error);
    }
  };

  const fetchWaQueue = async () => {
    try {
      setLoadingWaQueue(true);
      // Quarantined (failed validation, awaiting resend) + escalated to manual review.
      const [quarantineRes, reviewRes] = await Promise.all([
        fetch('/api/invoice/purchase?status=wa_quarantine'),
        fetch('/api/invoice/purchase?status=needs_review&source=whatsapp'),
      ]);
      const quarantine = await quarantineRes.json();
      const review = await reviewRes.json();
      const combined = [
        ...(quarantine.invoices || []),
        ...(review.invoices || []),
      ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setWaQueue(combined);
    } catch (error) {
      console.error('Error fetching WhatsApp queue:', error);
    } finally {
      setLoadingWaQueue(false);
    }
  };

  const fetchRecentInvoices = async () => {
    try {
      setLoadingRecent(true);
      const response = await fetch('/api/invoice/purchase');
      const data = await response.json();

      if (data.success && data.invoices) {
        const sorted = [...data.invoices].sort(
          (a: PurchaseInvoice, b: PurchaseInvoice) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
  }, [statusFilter, refreshKey]); // eslint-disable-line

  /* ── fetch whatsapp intake ── */
  const fetchWaQueue = useCallback(async () => {
    setLoadingWa(true);
    try {
      const { data, count, error } = await supabase
        .from('whatsapp_intake')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) {
        setWaQueue((data as WaIntake[]) ?? []);
        setWaCount(count ?? 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingWa(false);
    }
  }, [supabase]);

  useEffect(() => { fetchRecentInvoices(); }, [fetchRecentInvoices]);
  useEffect(() => { fetchWaQueue(); }, [fetchWaQueue]);

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
      status: 'uploading',
    }));
    setUploadQueue(prev => [...newFiles, ...prev]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fid = newFiles[i].id;
      try {
        updateFileStatus(fid, 'uploading', 20);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('source', 'manual');

        updateFileStatus(fid, 'uploading', 40);
        const res = await fetch('/api/invoice/process', { method: 'POST', body: formData });
        updateFileStatus(fid, 'extracting', 60);
        const result = await res.json();

        if (!res.ok || !result.success) throw new Error(result.error || 'Failed to process');
        updateFileStatus(fid, 'validating', 85);
        await new Promise(r => setTimeout(r, 400));
        updateFileStatus(fid, 'completed', 100);

        // Refresh recent list after each successful upload
        setRefreshKey(k => k + 1);
      } catch (err: any) {
        updateFileStatus(fid, 'failed', 100, err.message);
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

  const renderUploadStatus = (file: UploadedFile) => {
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
        if (statusFilter === 'failed') return s === 'error';
        if (statusFilter === 'processing') return s === 'pending' || s === 'needs_review';
        return true;
      });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">

        {/* ── HEADER ── */}
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
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm"
            >
              View All Invoices <ChevronRight className="h-4 w-4" />
            </button>
            <div className="relative group">
              <button className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm">
                <HelpCircle className="h-5 w-5" />
              </button>
              <div className="absolute right-0 top-12 w-64 p-3 rounded-xl bg-white border border-gray-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-gray-600">
                Supported formats: PDF, JPG, PNG. Max size 10 MB per file.
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex border-b border-gray-200 bg-white rounded-t-2xl">
          {[
            { id: 'whatsapp' as TabType, label: 'WhatsApp', icon: MessageSquare, badge: waCount },
            { id: 'manual' as TabType, label: 'Manual Upload', icon: UploadCloud },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {'badge' in tab && (tab.badge ?? 0) > 0 && (
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

      {/* 3. UPLOAD AREA (Changes per Tab) */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 shadow-lg p-6 min-h-[300px]">
        
        {/* TAB 1: WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Connected Status */}
               {(() => {
                 const connected = Boolean(waConfig?.configured && waConfig?.webhookConfigured);
                 const number = waConfig?.businessNumber || 'Not configured';
                 return (
                   <div className={`bg-gradient-to-br ${connected ? 'from-emerald-50' : 'from-amber-50'} to-white rounded-2xl border ${connected ? 'border-emerald-200' : 'border-amber-200'} shadow-lg p-6 flex flex-col items-center justify-center text-center space-y-4`}>
                      <div className={`h-16 w-16 rounded-full ${connected ? 'bg-emerald-100' : 'bg-amber-100'} flex items-center justify-center relative`}>
                        <MessageSquare className={`h-8 w-8 ${connected ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-white border-2 border-emerald-200 flex items-center justify-center">
                          {connected
                            ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            : <AlertCircle className="h-5 w-5 text-amber-600" />}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {connected ? 'WhatsApp Connected' : 'WhatsApp Setup Pending'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{number}</p>
                        <p className={`text-xs mt-2 font-medium ${connected ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {connected ? 'Auto-extraction active' : 'Configure Slide API + webhook secret'}
                        </p>
                      </div>
                   </div>
                 );
               })()}
               
               {/* Instructions */}
               <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works</h3>
                  <div className="space-y-4">
                     <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        <li>Share invoices (PDF/Image) to your registered WhatsApp Business number.</li>
                        <li>Our system automatically extracts attachments and processes them.</li>
                        <li>You receive a notification once the GST validation is complete.</li>
                     </ol>
                     <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                       Invoices are validated automatically; only correct ones appear in your register. Vendors are asked over WhatsApp to fix and resend the rest.
                     </div>
                  </div>
                </div>
              </div>

            {/* Quarantine / Needs-Review Queue */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                 <div>
                   <h3 className="font-semibold text-gray-900">Held for Correction (WhatsApp)</h3>
                   <p className="text-xs text-gray-500 mt-0.5">Invoices that failed validation — the vendor has been asked to resend. These do not appear in your register.</p>
                 </div>
                 <button
                   onClick={fetchWaQueue}
                   className="text-gray-600 hover:text-gray-900 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                   title="Refresh"
                 >
                   <RefreshCw className={`h-4 w-4 ${loadingWaQueue ? 'animate-spin' : ''}`} />
                 </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="text-gray-500 font-medium border-b border-gray-200 bg-gray-50">
                       <tr>
                         <th className="px-6 py-3">Vendor Phone</th>
                         <th className="px-6 py-3">Invoice #</th>
                         <th className="px-6 py-3">Received</th>
                         <th className="px-6 py-3">Attempts</th>
                         <th className="px-6 py-3">Status</th>
                         <th className="px-6 py-3 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {loadingWaQueue ? (
                         <tr>
                           <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                             <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading…
                           </td>
                         </tr>
                       ) : waQueue.length === 0 ? (
                         <tr>
                           <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                             Nothing held for correction. 🎉
                           </td>
                         </tr>
                       ) : (
                         waQueue.map((inv) => {
                           const isReview = inv.invoice_status === 'needs_review';
                           const received = inv.created_at
                             ? new Date(inv.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                             : 'N/A';
                           return (
                             <tr key={inv.id} className="group hover:bg-gray-50 transition-colors">
                               <td className="px-6 py-3 text-gray-900 font-medium flex items-center gap-2">
                                 <Phone className="h-3.5 w-3.5 text-gray-400" /> {inv.wa_sender_phone || 'Unknown'}
                               </td>
                               <td className="px-6 py-3 text-gray-700">{inv.invoice_number || '—'}</td>
                               <td className="px-6 py-3 text-gray-600">{received}</td>
                               <td className="px-6 py-3 text-gray-600">{inv.wa_attempt_count || 1}</td>
                               <td className="px-6 py-3">
                                 {isReview ? (
                                   <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                                     <AlertCircle className="h-3 w-3" /> Needs Review
                                   </span>
                                 ) : (
                                   <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                     <AlertCircle className="h-3 w-3" /> Awaiting Resend
                                   </span>
                                 )}
                               </td>
                               <td className="px-6 py-3 text-right">
                                  {inv.invoice_bucket_url ? (
                                    <a
                                      href={inv.invoice_bucket_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-700 hover:text-gray-900 px-3 py-1.5 border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors inline-block"
                                    >
                                      View File
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 text-xs">—</span>
                                  )}
                               </td>
                             </tr>
                           );
                         })
                       )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL */}
        {/* {activeTab === 'email' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <GlassPanel className="p-5">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-white">Connected Inboxes</h3>
                      <button className="text-xs text-primary hover:underline">+ Add Account</button>
                   </div>
                   <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-white/5">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-red-500/20 flex items-center justify-center text-red-500 font-bold">G</div>
                            <div>
                               <p className="text-sm font-medium text-white">accounts@company.com</p>
                               <p className="text-xs text-zinc-500">Synced: Just now</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
                            <button className="text-zinc-500 hover:text-white"><RefreshCw className="h-4 w-4" /></button>
                         </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-white/5">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">O</div>
                            <div>
                               <p className="text-sm font-medium text-white">purchase@company.com</p>
                               <p className="text-xs text-zinc-500">Synced: 1 hour ago</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
                            <button className="text-zinc-500 hover:text-white"><RefreshCw className="h-4 w-4" /></button>
                         </div>
                      </div>
                   </div>
                </GlassPanel>

                <BentoCard title="Email Auto-Capture">
                   <p className="text-sm text-zinc-400 mb-4">
                     We automatically scan your inbox for emails containing keywords like "Invoice", "Bill", or "GST" and extract attachments.
                   </p>
                   <div className="flex gap-2">
                     <button className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                        Sync Now
                     </button>
                     <button className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors border border-white/5">
                        Settings
                     </button>
                   </div>
                </BentoCard>
             </div>

       
             <GlassPanel className="p-0 overflow-hidden">
               <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                 <h3 className="font-semibold text-white">Inbox Preview</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="text-zinc-500 font-medium border-b border-white/5">
                       <tr>
                         <th className="px-6 py-3">From</th>
                         <th className="px-6 py-3">Subject</th>
                         <th className="px-6 py-3">Attachment</th>
                         <th className="px-6 py-3">Date</th>
                         <th className="px-6 py-3">Status</th>
                         <th className="px-6 py-3 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {[
                         { from: 'billing@aws.com', subject: 'Invoice for Oct 2025', file: 'inv_oct.pdf', status: 'Extracted' },
                         { from: 'vendors@steel.com', subject: 'Material Bill 123', file: 'bill.jpg', status: 'Pending' }
                       ].map((mail, i) => (
                         <tr key={i} className="group hover:bg-white/5 transition-colors">
                           <td className="px-6 py-3 text-white">{mail.from}</td>
                           <td className="px-6 py-3 text-zinc-300">{mail.subject}</td>
                           <td className="px-6 py-3 text-zinc-400 flex items-center gap-2">
                             <FileText className="h-3 w-3" /> {mail.file}
                           </td>
                           <td className="px-6 py-3 text-zinc-500">Today, 10:00 AM</td>
                           <td className="px-6 py-3">
                             {mail.status === 'Extracted' ? (
                               <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Extracted</span>
                             ) : (
                               <span className="text-xs text-zinc-500 flex items-center gap-1"><Loader2 className="h-3 w-3" /> Pending</span>
                             )}
                           </td>
                           <td className="px-6 py-3 text-right">
                              <button className="text-zinc-400 hover:text-white px-2 py-1 border border-zinc-700 rounded text-xs">Process</button>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </GlassPanel>
          </div>
        )} */}

          {/* MANUAL UPLOAD TAB */}
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
                      <div className="p-1.5 bg-emerald-100 rounded-full mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-emerald-700">Smart OCR Enabled</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          AI automatically detects vendor GSTIN, Invoice #, Date, HSN codes, and all tax amounts.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                    <span>Each uploaded invoice is automatically added to your <strong>Purchase Register</strong> and flagged for reconciliation.</span>
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
                    >Clear done</button>
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
                          <p className="text-xs text-red-600 mt-1">{file.errorMessage}</p>
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

        {/* ── RECENTLY UPLOADED SECTION ── */}
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
              {/* Status filter */}
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
                  <div
                    key={invoice.id}
                    className="group p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-emerald-300 hover:bg-white transition-all cursor-pointer"
                  >
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
                              : <span className="text-gray-400 italic text-xs">No invoice #</span>
                            }
                            {invoice.supplier_name && (
                              <span className="text-gray-500 font-normal ml-2 text-xs">• {invoice.supplier_name}</span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {invoiceDate && <span className="text-xs text-gray-500">{invoiceDate}</span>}
                            {fileName && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span className="text-xs text-gray-400 truncate max-w-[120px]">{fileName}</span>
                              </>
                            )}
                            {invoice.source && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                <span className="text-[10px] font-medium text-gray-500 capitalize">{invoice.source}</span>
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
                            : <span className="text-gray-400 text-xs">—</span>
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

              <div className="mt-2 flex justify-center">
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