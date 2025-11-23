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
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

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
  
  // Tab Stats (Mock)
  const stats = {
    whatsapp: 3,
    email: 5
  };

  // Mock Recent Invoices
  const recentInvoices = [
    { id: 'INV-001234', file: 'invoice_nov_2025.pdf', party: 'TechSol Pvt Ltd', date: '18 Nov 2025', amount: 45600, gst: 8208, type: 'Purchase', status: 'Validated' },
    { id: 'INV-001235', file: 'bill_materials.jpg', party: 'Alpha Traders', date: '18 Nov 2025', amount: 12500, gst: 2250, type: 'Sales', status: 'Processing' },
    { id: 'INV-001236', file: 'scan_001.pdf', party: 'Gamma Logistics', date: '17 Nov 2025', amount: 89000, gst: 16020, type: 'Purchase', status: 'Failed' },
    { id: 'INV-001237', file: 'invoice_draft.pdf', party: 'Beta Retail', date: '17 Nov 2025', amount: 3400, gst: 612, type: 'Purchase', status: 'Validated' },
  ];

  // Helper to simulate upload progress
  useEffect(() => {
    const interval = setInterval(() => {
      setUploadQueue(prev => prev.map(file => {
        if (file.status === 'completed' || file.status === 'failed') return file;
        
        let newProgress = file.progress + Math.random() * 10;
        let newStatus: UploadStatus = file.status;

        if (newProgress >= 30 && newStatus === 'uploading') newStatus = 'extracting';
        if (newProgress >= 70 && newStatus === 'extracting') newStatus = 'validating';
        if (newProgress >= 100) {
          newProgress = 100;
          newStatus = 'completed';
        }

        return { ...file, progress: newProgress, status: newStatus };
      }));
    }, 800);

    return () => clearInterval(interval);
  }, []);

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

  const handleFiles = (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      progress: 0,
      status: 'uploading'
    }));
    setUploadQueue(prev => [...newFiles, ...prev]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Validated': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Processing': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Partial Match': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const renderUploadStatus = (file: UploadedFile) => {
    switch(file.status) {
      case 'uploading': return <span className="text-blue-400 text-xs flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</span>;
      case 'extracting': return <span className="text-amber-400 text-xs flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Extracting Data...</span>;
      case 'validating': return <span className="text-purple-400 text-xs flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Validating...</span>;
      case 'completed': return <span className="text-emerald-500 text-xs flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</span>;
      case 'failed': return <span className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Failed</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Upload Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">Automatically extract and validate GST details from your invoices.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => router.push('/dashboard/sme/invoices/purchase')}
             className="px-4 py-2 bg-secondary/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-secondary transition-all"
           >
             View All Invoices
           </button>
           <div className="relative group">
             <button className="p-2 rounded-lg bg-secondary/50 border border-white/10 text-zinc-400 hover:text-white hover:bg-secondary transition-all">
               <HelpCircle className="h-5 w-5" />
             </button>
             <div className="absolute right-0 top-12 w-64 p-3 rounded-xl bg-zinc-900 border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-zinc-400">
               Supported formats: PDF, JPG, PNG, Excel, CSV. Max size 10MB per file.
             </div>
           </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-1">
         {[
           { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, badge: stats.whatsapp },
           { id: 'email', label: 'Email', icon: Mail, badge: stats.email },
           { id: 'manual', label: 'Manual Upload', icon: UploadCloud },
           { id: 'bulk', label: 'Bulk Import (CSV)', icon: FileSpreadsheet },
         ].map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as TabType)}
             className={`
               relative flex items-center gap-2 px-5 py-3 rounded-t-lg text-sm font-medium transition-all
               ${activeTab === tab.id 
                 ? 'bg-zinc-800/80 text-white border-b-2 border-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' 
                 : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
             `}
           >
             <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-primary' : ''}`} />
             {tab.label}
             {tab.badge && (
               <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                 {tab.badge} New
               </span>
             )}
           </button>
         ))}
      </div>

      {/* 3. UPLOAD AREA (Changes per Tab) */}
      <div className="min-h-[300px]">
        
        {/* TAB 1: WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Connected Status */}
               <GlassPanel className="p-6 flex flex-col items-center justify-center text-center space-y-4 border-l-4 border-l-emerald-500">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center relative">
                    <MessageSquare className="h-8 w-8 text-emerald-500" />
                    <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-zinc-900 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">WhatsApp Connected</h3>
                    <p className="text-sm text-zinc-400 mt-1">+91 98765 43210</p>
                    <p className="text-xs text-zinc-500 mt-2">Last synced: 2 mins ago</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                    Configure Settings
                  </button>
               </GlassPanel>
               
               {/* Instructions */}
               <BentoCard className="lg:col-span-2" title="How it works">
                  <div className="space-y-4">
                     <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-400">
                        <li>Share invoices (PDF/Image) to your registered WhatsApp Business number.</li>
                        <li>Our system automatically extracts attachments and processes them.</li>
                        <li>You receive a notification once the GST validation is complete.</li>
                     </ol>
                     <div className="p-3 rounded bg-zinc-900 border border-white/5 text-xs text-zinc-500 flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                       Auto-extraction active for +91 98765 43210
                     </div>
                  </div>
               </BentoCard>
            </div>

            {/* Pending Queue */}
            <GlassPanel className="p-0 overflow-hidden">
               <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                 <h3 className="font-semibold text-white">Pending Processing Queue (WhatsApp)</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="text-zinc-500 font-medium border-b border-white/5">
                       <tr>
                         <th className="px-6 py-3">Vendor Phone</th>
                         <th className="px-6 py-3">File Name</th>
                         <th className="px-6 py-3">Received Time</th>
                         <th className="px-6 py-3">Status</th>
                         <th className="px-6 py-3 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {[1,2,3].map((i) => (
                         <tr key={i} className="group hover:bg-white/5 transition-colors">
                           <td className="px-6 py-3 text-white">+91 99887 76655</td>
                           <td className="px-6 py-3 text-zinc-300 flex items-center gap-2">
                             <FileText className="h-4 w-4 text-zinc-500" /> img_invoice_00{i}.jpg
                           </td>
                           <td className="px-6 py-3 text-zinc-500">10 mins ago</td>
                           <td className="px-6 py-3">
                             <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                               <Loader2 className="h-3 w-3 animate-spin" /> Processing
                             </span>
                           </td>
                           <td className="px-6 py-3 text-right">
                              <button className="text-primary hover:underline text-xs">View</button>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </GlassPanel>
          </div>
        )}

        {/* TAB 2: EMAIL */}
        {activeTab === 'email' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Connected Accounts */}
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

                {/* Instructions */}
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

             {/* Inbox Preview */}
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
        )}

        {/* TAB 3: MANUAL UPLOAD (Default) */}
        {activeTab === 'manual' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             
             {/* Upload Area */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Drag & Drop Zone */}
                <div 
                  className={`
                    border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer h-64 relative overflow-hidden
                    ${dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 hover:bg-zinc-900'}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                   <input type="file" id="file-upload" className="hidden" multiple onChange={handleFileInput} />
                   
                   <div className="h-14 w-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                     <UploadCloud className="h-7 w-7 text-zinc-400" />
                   </div>
                   <h3 className="text-lg font-semibold text-white">Drag & drop invoices here</h3>
                   <p className="text-sm text-zinc-500 mt-2">or click to browse from your computer</p>
                   <p className="text-xs text-zinc-600 mt-4 bg-zinc-900/50 px-3 py-1 rounded-full border border-white/5">
                     Supports: PDF, JPG, PNG (Max 10MB)
                   </p>
                </div>

                {/* Camera / Instructions */}
                <div className="flex flex-col gap-4 h-64">
                   <div className="flex-1 rounded-xl bg-zinc-900/50 border border-zinc-800 p-6 flex flex-col items-center justify-center text-center hover:border-zinc-600 transition-colors cursor-pointer group">
                      <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3 group-hover:text-primary transition-colors">
                        <Camera className="h-6 w-6 text-zinc-400 group-hover:text-primary" />
                      </div>
                      <h3 className="font-semibold text-white">Capture from Camera</h3>
                      <p className="text-xs text-zinc-500 mt-1">Take a photo of physical invoice</p>
                   </div>
                   <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                      <div className="flex items-start gap-3">
                         <div className="p-1.5 bg-primary/20 rounded-full mt-0.5">
                           <CheckCircle2 className="h-4 w-4 text-primary" />
                         </div>
                         <div>
                            <h4 className="text-sm font-semibold text-primary">Smart OCR Enabled</h4>
                            <p className="text-xs text-zinc-400 mt-1">
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
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Upload Progress</h3>
                  {uploadQueue.map((file) => (
                    <GlassPanel key={file.id} className="p-3 flex items-center gap-4">
                       <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-zinc-400" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                             <p className="text-sm font-medium text-white truncate">{file.name}</p>
                             <span className="text-xs">{renderUploadStatus(file)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                             <div 
                               className={`h-full rounded-full transition-all duration-300 ${file.status === 'failed' ? 'bg-red-500' : 'bg-primary'}`} 
                               style={{ width: `${file.progress}%` }}
                             ></div>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                          {file.status === 'completed' && (
                             <button className="p-1.5 rounded hover:bg-white/10 text-primary font-medium text-xs border border-primary/30 hover:border-primary">View Details</button>
                          )}
                          <button className="p-1.5 rounded hover:bg-white/10 text-zinc-500 hover:text-red-400">
                             <X className="h-4 w-4" />
                          </button>
                       </div>
                    </GlassPanel>
                  ))}
               </div>
             )}
          </div>
        )}

        {/* TAB 4: BULK IMPORT */}
        {activeTab === 'bulk' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Step 1: Download */}
                <BentoCard title="Step 1: Download Template">
                   <p className="text-sm text-zinc-400 mb-6">Use our standardized template to ensure all fields are mapped correctly for bulk processing.</p>
                   <div className="space-y-3">
                      <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-emerald-500 hover:bg-zinc-800 transition-all group">
                         <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                            <div className="text-left">
                               <p className="text-sm font-medium text-white">Excel Template (.xlsx)</p>
                               <p className="text-[10px] text-zinc-500">Recommended for most users</p>
                            </div>
                         </div>
                         <Download className="h-4 w-4 text-zinc-500 group-hover:text-white" />
                      </button>
                      <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-blue-500 hover:bg-zinc-800 transition-all group">
                         <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div className="text-left">
                               <p className="text-sm font-medium text-white">CSV Template (.csv)</p>
                               <p className="text-[10px] text-zinc-500">For programmatic exports</p>
                            </div>
                         </div>
                         <Download className="h-4 w-4 text-zinc-500 group-hover:text-white" />
                      </button>
                   </div>
                </BentoCard>

                {/* Step 2: Upload */}
                <BentoCard title="Step 2: Upload Filled File">
                   <div className="border-2 border-dashed border-zinc-700 rounded-lg h-40 flex flex-col items-center justify-center hover:border-zinc-500 hover:bg-white/5 transition-all cursor-pointer">
                      <UploadCloud className="h-8 w-8 text-zinc-500 mb-2" />
                      <p className="text-sm text-zinc-300">Drag & drop your Excel/CSV here</p>
                   </div>
                   <div className="mt-4 p-3 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      Ensure dates are in DD-MM-YYYY format and GSTINs are valid to avoid errors.
                   </div>
                </BentoCard>
             </div>
          </div>
        )}
      </div>

      {/* 4. RECENTLY UPLOADED INVOICES */}
      <div className="mt-8">
         <GlassPanel className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-2">
                 <h3 className="text-lg font-semibold text-white">Recently Uploaded</h3>
                 <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full">Last 24h</span>
               </div>
               
               <div className="flex gap-2">
                  <div className="relative">
                     <select className="appearance-none bg-zinc-900 border border-white/10 text-xs rounded-lg pl-3 pr-8 py-2 focus:ring-1 focus:ring-primary outline-none text-zinc-300 cursor-pointer hover:bg-zinc-800">
                        <option>All Status</option>
                        <option>Validated</option>
                        <option>Failed</option>
                        <option>Processing</option>
                     </select>
                     <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
               {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="group p-4 rounded-xl bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/80 transition-all">
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        
                        {/* Left: File Info */}
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                           <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                              {invoice.file.endsWith('.pdf') ? <FileText className="h-5 w-5 text-red-400" /> : <FileText className="h-5 w-5 text-blue-400" />}
                           </div>
                           <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{invoice.id} <span className="text-zinc-500 font-normal mx-1">•</span> {invoice.party}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <p className="text-xs text-zinc-500">{invoice.date}</p>
                                 <span className="h-1 w-1 rounded-full bg-zinc-700"></span>
                                 <p className="text-xs text-zinc-500">{invoice.file}</p>
                              </div>
                           </div>
                        </div>

                        {/* Middle: Amount */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0 pl-14 sm:pl-0">
                           <p className="text-sm font-bold text-white">₹{invoice.amount.toLocaleString()}</p>
                           <p className="text-xs text-zinc-500">GST: ₹{invoice.gst.toLocaleString()}</p>
                        </div>

                        {/* Right: Status & Actions */}
                        <div className="flex items-center gap-4 pl-14 sm:pl-0 w-full sm:w-auto justify-between sm:justify-end">
                           <div className="flex flex-col items-end gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(invoice.status)}`}>
                                 {invoice.status}
                              </span>
                              <span className={`text-[10px] ${invoice.type === 'Purchase' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                 {invoice.type}
                              </span>
                           </div>
                           
                           <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white" title="View Data">
                                 <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white" title="Edit">
                                 <Edit3 className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-red-400" title="Delete">
                                 <Trash2 className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </GlassPanel>
      </div>

    </div>
  );
}