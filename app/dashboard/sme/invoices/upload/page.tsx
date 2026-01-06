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
  
  // Tab Stats
  const [stats, setStats] = useState({
    whatsapp: 0,
    email: 0
  });

  // Fetch recent invoices on mount
  useEffect(() => {
    fetchRecentInvoices();
  }, []);

  const fetchRecentInvoices = async () => {
    try {
      setLoadingRecent(true);
      const response = await fetch('/api/invoice/purchase');
      const data = await response.json();

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
               <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-200 shadow-lg p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center relative">
                    <MessageSquare className="h-8 w-8 text-emerald-600" />
                    <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-white border-2 border-emerald-200 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">WhatsApp Connected</h3>
                    <p className="text-sm text-gray-600 mt-1">+91 98765 43210</p>
                    <p className="text-xs text-emerald-600 mt-2 font-medium">Last synced: 2 mins ago</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                    Configure Settings
                  </button>
               </div>
               
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
                       Auto-extraction active for +91 98765 43210
                     </div>
                  </div>
               </div>
            </div>

            {/* Pending Queue */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                 <h3 className="font-semibold text-gray-900">Pending Processing Queue (WhatsApp)</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="text-gray-500 font-medium border-b border-gray-200 bg-gray-50">
                       <tr>
                         <th className="px-6 py-3">Vendor Phone</th>
                         <th className="px-6 py-3">File Name</th>
                         <th className="px-6 py-3">Received Time</th>
                         <th className="px-6 py-3">Status</th>
                         <th className="px-6 py-3 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {[1,2,3].map((i) => (
                         <tr key={i} className="group hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-3 text-gray-900 font-medium">+91 99887 76655</td>
                           <td className="px-6 py-3 text-gray-700 flex items-center gap-2">
                             <FileText className="h-4 w-4 text-gray-400" /> img_invoice_00{i}.jpg
                           </td>
                           <td className="px-6 py-3 text-gray-600">10 mins ago</td>
                           <td className="px-6 py-3">
                             <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                               <Loader2 className="h-3 w-3 animate-spin" /> Processing
                             </span>
                           </td>
                           <td className="px-6 py-3 text-right">
                              <button className="text-gray-700 hover:text-gray-900 px-3 py-1.5 border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">View</button>
                           </td>
                         </tr>
                       ))}
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