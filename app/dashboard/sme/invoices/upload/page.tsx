'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UploadCloud, 
  FileText, 
  MessageSquare, 
  Mail, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Camera, 
  Download, 
  RefreshCw, 
  Eye, 
  Trash2, 
  Edit3, 
  HelpCircle,
  MoreVertical,
  Filter,
  Loader2,
  Phone,
  Settings
} from 'lucide-react';

// Types
type TabType = 'whatsapp' | 'email' | 'manual' | 'bulk';
type UploadStatus = 'uploading' | 'extracting' | 'validating' | 'completed' | 'failed';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: UploadStatus;
  thumbnail?: string;
  errorMessage?: string;
}

export default function UploadInvoicesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadedFile[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
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
        // Get last 10 invoices sorted by created_at
        const recent = data.invoices
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);
        setRecentInvoices(recent);

        // Calculate stats
        const whatsappCount = data.invoices.filter((inv: any) => inv.source === 'whatsapp').length;
        const emailCount = data.invoices.filter((inv: any) => inv.source === 'email').length;
        setStats({ whatsapp: whatsappCount, email: emailCount });
      }
    } catch (error) {
      console.error('Error fetching recent invoices:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  // Helper to simulate upload progress
  // Removed - using real API calls now

  const handleDelete = async (invoiceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoice/purchase/${invoiceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setRecentInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
        alert('Invoice deleted successfully');
      } else {
        throw new Error(data.error || 'Failed to delete invoice');
      }
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      alert(`Failed to delete invoice: ${error.message}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      progress: 0,
      status: 'uploading'
    }));
    setUploadQueue(prev => [...newFiles, ...prev]);

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = newFiles[i].id;

      try {
        // Update to uploading
        updateFileStatus(fileId, 'uploading', 10);

        // Create FormData and upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('source', activeTab);

        // Simulate progress during upload
        updateFileStatus(fileId, 'uploading', 30);

        const response = await fetch('/api/invoice/process', {
          method: 'POST',
          body: formData,
        });

        updateFileStatus(fileId, 'extracting', 50);

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to process invoice');
        }

        updateFileStatus(fileId, 'validating', 80);

        // Wait a bit for validation animation
        await new Promise(resolve => setTimeout(resolve, 500));

        if (result.validation?.isValid) {
          updateFileStatus(fileId, 'completed', 100);
        } else {
          updateFileStatus(fileId, 'completed', 100, 'Completed with warnings');
        }

      } catch (error: any) {
        console.error('Error uploading file:', error);
        updateFileStatus(fileId, 'failed', 100, error.message);
      }
    }
  };

  const updateFileStatus = (
    fileId: string,
    status: UploadStatus,
    progress: number,
    errorMessage?: string
  ) => {
    setUploadQueue(prev =>
      prev.map(f =>
        f.id === fileId ? { ...f, status, progress, errorMessage } : f
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Validated': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Processing': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'Partial Match': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const renderUploadStatus = (file: UploadedFile) => {
    switch(file.status) {
      case 'uploading': return <span className="text-blue-600 text-xs flex items-center gap-1 font-medium"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</span>;
      case 'extracting': return <span className="text-amber-600 text-xs flex items-center gap-1 font-medium"><Loader2 className="h-3 w-3 animate-spin" /> Extracting Data...</span>;
      case 'validating': return <span className="text-purple-600 text-xs flex items-center gap-1 font-medium"><Loader2 className="h-3 w-3 animate-spin" /> Validating...</span>;
      case 'completed': return <span className="text-emerald-600 text-xs flex items-center gap-1 font-medium"><CheckCircle2 className="h-3 w-3" /> Completed</span>;
      case 'failed': return <span className="text-red-600 text-xs flex items-center gap-1 font-medium"><AlertCircle className="h-3 w-3" /> Failed</span>;
    }
  };

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
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
             View All Invoices
           </button>
           <div className="relative group">
             <button className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
               <HelpCircle className="h-5 w-5" />
             </button>
             <div className="absolute right-0 top-12 w-64 p-3 rounded-xl bg-white border border-gray-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-gray-600">
               Supported formats: PDF, JPG, PNG, Excel, CSV. Max size 10MB per file.
             </div>
           </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl">
         {[
           { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, badge: stats.whatsapp },
         //   { id: 'email', label: 'Gmail', icon: Mail, badge: stats.email },
           { id: 'manual', label: 'Manual Upload', icon: UploadCloud },
           //{ id: 'bulk', label: 'Bulk Import (CSV)', icon: FileSpreadsheet },
         ].map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as TabType)}
             className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
               activeTab === tab.id 
                 ? 'border-emerald-600 text-emerald-600' 
                 : 'border-transparent text-gray-500 hover:text-gray-700'
             }`}
           >
             <tab.icon className="h-4 w-4" />
             {tab.label}
             {tab.badge !== undefined && tab.badge > 0 && (
               <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                 {tab.badge}
               </span>
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
                          {connected ? 'Auto-extraction active' : 'Configure Evolution API + webhook secret'}
                        </p>
                      </div>
                   </div>
                 );
               })()}
               
               {/* Instructions */}
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

        {/* TAB 3: MANUAL UPLOAD (Default) */}
        {activeTab === 'manual' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
             
             {/* Upload Area */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Drag & Drop Zone */}
                <div 
                  className={`
                    border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer h-64 relative overflow-hidden
                    ${dragActive 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/30'}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                   <input type="file" id="file-upload" className="hidden" multiple onChange={handleFileInput} />
                   
                   <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                     <UploadCloud className="h-7 w-7 text-emerald-600" />
                   </div>
                   <h3 className="text-lg font-semibold text-gray-900">Drag & drop invoices here</h3>
                   <p className="text-sm text-gray-600 mt-2">or click to browse from your computer</p>
                   <p className="text-xs text-gray-500 mt-4 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                     Supports: PDF, JPG, PNG (Max 10MB)
                   </p>
                </div>

                {/* Camera / Instructions */}
                <div className="flex flex-col gap-4 h-64">
                   {/* <div className="flex-1 rounded-xl bg-white border border-gray-200 p-6 flex flex-col items-center justify-center text-center hover:border-emerald-300 transition-colors cursor-pointer group shadow-sm">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                        <Camera className="h-6 w-6 text-gray-600 group-hover:text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Capture from Camera</h3>
                      <p className="text-xs text-gray-600 mt-1">Take a photo of physical invoice</p>
                   </div> */}
                   <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 shadow-sm">
                      <div className="flex items-start gap-3">
                         <div className="p-1.5 bg-emerald-100 rounded-full mt-0.5">
                           <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                         </div>
                         <div>
                            <h4 className="text-sm font-semibold text-emerald-700">Smart OCR Enabled</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              Our AI automatically detects vendor GSTIN, Invoice #, Date, and tax amounts. No manual entry needed.
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Upload Progress List */}
             {uploadQueue.length > 0 && (
               <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Upload Progress</h3>
                  {uploadQueue.map((file) => (
                    <div key={file.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
                       <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-gray-600" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                             <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                             <span className="text-xs">{renderUploadStatus(file)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                             <div 
                               className={`h-full rounded-full transition-all duration-300 ${file.status === 'failed' ? 'bg-red-500' : 'bg-emerald-600'}`} 
                               style={{ width: `${file.progress}%` }}
                             ></div>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                          {file.status === 'completed' && (
                             <button className="px-3 py-1.5 rounded-lg hover:bg-gray-50 text-emerald-600 font-medium text-xs border border-emerald-200 hover:border-emerald-300 transition-colors">View Details</button>
                          )}
                          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors">
                             <X className="h-4 w-4" />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {/* TAB 4: BULK IMPORT */}
        {activeTab === 'bulk' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Step 1: Download */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Download Template</h3>
                   <p className="text-sm text-gray-600 mb-6">Use our standardized template to ensure all fields are mapped correctly for bulk processing.</p>
                   <div className="space-y-3">
                      <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group shadow-sm">
                         <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                            <div className="text-left">
                               <p className="text-sm font-medium text-gray-900">Excel Template (.xlsx)</p>
                               <p className="text-[10px] text-gray-600">Recommended for most users</p>
                            </div>
                         </div>
                         <Download className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                      </button>
                      <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group shadow-sm">
                         <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div className="text-left">
                               <p className="text-sm font-medium text-gray-900">CSV Template (.csv)</p>
                               <p className="text-[10px] text-gray-600">For programmatic exports</p>
                            </div>
                         </div>
                         <Download className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                   </div>
                </div>

                {/* Step 2: Upload */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Upload Filled File</h3>
                   <div className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex flex-col items-center justify-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer">
                      <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Drag & drop your Excel/CSV here</p>
                   </div>
                   <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      Ensure dates are in DD-MM-YYYY format and GSTINs are valid to avoid errors.
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* 4. RECENTLY UPLOADED INVOICES */}
      <div className="mt-8">
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-2">
                 <h3 className="text-lg font-semibold text-gray-900">Recently Uploaded</h3>
                 <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">Last 24h</span>
               </div>
               
               <div className="flex gap-2">
                  <div className="relative">
                     <select className="appearance-none bg-white border border-gray-200 text-xs rounded-lg pl-3 pr-8 py-2 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-700 cursor-pointer hover:bg-gray-50">
                        <option>All Status</option>
                        <option>Validated</option>
                        <option>Failed</option>
                        <option>Processing</option>
                     </select>
                     <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
               {loadingRecent ? (
                 <div className="flex items-center justify-center py-12">
                   <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                   <span className="ml-2 text-gray-500">Loading recent invoices...</span>
                 </div>
               ) : recentInvoices.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12">
                   <FileText className="h-12 w-12 text-gray-300 mb-2" />
                   <p className="text-gray-500 text-sm">No invoices uploaded yet</p>
                 </div>
               ) : (
                 recentInvoices.map((invoice) => {
                   const fileName = invoice.invoice_bucket_url 
                     ? invoice.invoice_bucket_url.split('/').pop() 
                     : 'invoice.pdf';
                   const totalGst = (invoice.cgst_amount || 0) + (invoice.sgst_amount || 0) + (invoice.igst_amount || 0);
                   const invoiceDate = invoice.invoice_date 
                     ? new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                     : 'N/A';
                   
                   const statusLabel = invoice.invoice_status === 'extracted' || invoice.invoice_status === 'verified' 
                     ? 'Validated' 
                     : invoice.invoice_status === 'needs_review' 
                     ? 'Needs Review' 
                     : invoice.invoice_status === 'error' 
                     ? 'Failed' 
                     : 'Processing';

                   return (
                     <div key={invoice.id} className="group p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-emerald-300 hover:bg-white transition-all cursor-pointer">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                           
                           {/* Left: File Info */}
                           <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                 {fileName?.endsWith('.pdf') ? <FileText className="h-5 w-5 text-red-500" /> : <FileText className="h-5 w-5 text-blue-500" />}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-sm font-semibold text-gray-900 truncate">
                                   {invoice.invoice_number || 'N/A'} 
                                   <span className="text-gray-400 font-normal mx-1">•</span> 
                                   {invoice.supplier_name || 'Unknown'}
                                 </p>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-gray-600">{invoiceDate}</p>
                                    <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                    <p className="text-xs text-gray-600">{fileName}</p>
                                 </div>
                              </div>
                           </div>

                           {/* Middle: Amount */}
                           <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0 pl-14 sm:pl-0">
                              <p className="text-sm font-bold text-gray-900">₹{(invoice.total_invoice_value || 0).toLocaleString()}</p>
                              <p className="text-xs text-gray-600">GST: ₹{totalGst.toLocaleString()}</p>
                           </div>

                           {/* Right: Status & Actions */}
                           <div className="flex items-center gap-4 pl-14 sm:pl-0 w-full sm:w-auto justify-between sm:justify-end">
                              <div className="flex flex-col items-end gap-1">
                                 <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(statusLabel)}`}>
                                    {statusLabel}
                                 </span>
                                 <span className="text-[10px] text-blue-600 font-medium">
                                    Purchase
                                 </span>
                              </div>
                              
                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={() => router.push('/dashboard/sme/invoices/purchase')}
                                   className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors" 
                                   title="View Data"
                                 >
                                    <Eye className="h-4 w-4" />
                                 </button>
                                 {invoice.invoice_bucket_url && (
                                   <a 
                                     href={invoice.invoice_bucket_url}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors" 
                                     title="View PDF"
                                   >
                                      <FileText className="h-4 w-4" />
                                   </a>
                                 )}
                                 <button 
                                   onClick={(e) => handleDelete(invoice.id, e)}
                                   className="p-1.5 hover:bg-red-50 rounded text-gray-600 hover:text-red-600 transition-colors" 
                                   title="Delete"
                                 >
                                    <Trash2 className="h-4 w-4" />
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                   );
                 })
               )}
            </div>
         </div>
      </div>

      </div>
    </div>
  );
}
