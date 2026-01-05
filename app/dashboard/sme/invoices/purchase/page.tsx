'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Filter, 
  Download, 
  Plus, 
  Search, 
  Calendar, 
  MoreVertical, 
  Eye, 
  FileText, 
  Edit3, 
  RefreshCw, 
  CheckCircle2, 
  Trash2,
  ArrowUpRight,
  MessageSquare,
  Mail,
  UploadCloud,
  FileSpreadsheet,
  X,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  Save,
  History,
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';
import { PurchaseRegister } from '@/lib/services/purchaseInvoiceService';

// Mock Data for validation chart
const validationStatusData = [
  { name: 'Validated', value: 0, color: '#10B981' },
  { name: 'Partial', value: 0, color: '#F59E0B' },
  { name: 'Failed', value: 0, color: '#EF4444' },
];

export default function PurchaseRegisterPage() {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseRegister | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'validation' | 'history'>('details');
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalTax: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    validated: 0,
    partial: 0,
    failed: 0,
    count: 0
  });

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoice/purchase');
      const data = await response.json();

      if (data.success && data.invoices) {
        setPurchaseInvoices(data.invoices);
        calculateStats(data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoices: PurchaseRegister[]) => {
    const totalPurchases = invoices.reduce((sum, inv) => sum + (inv.total_invoice_value || 0), 0);
    const cgst = invoices.reduce((sum, inv) => sum + (inv.cgst_amount || 0), 0);
    const sgst = invoices.reduce((sum, inv) => sum + (inv.sgst_amount || 0), 0);
    const igst = invoices.reduce((sum, inv) => sum + (inv.igst_amount || 0), 0);
    const totalTax = cgst + sgst + igst;

    const validated = invoices.filter(inv => inv.invoice_status === 'extracted' || inv.invoice_status === 'verified').length;
    const partial = invoices.filter(inv => inv.invoice_status === 'needs_review').length;
    const failed = invoices.filter(inv => inv.invoice_status === 'error').length;

    setStats({
      totalPurchases,
      totalTax,
      cgst,
      sgst,
      igst,
      validated,
      partial,
      failed,
      count: invoices.length
    });

    // Update validation chart
    validationStatusData[0].value = validated;
    validationStatusData[1].value = partial;
    validationStatusData[2].value = failed;
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === purchaseInvoices.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(purchaseInvoices.map(inv => inv.id));
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'extracted':
      case 'verified':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'needs_review':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const getStatusLabel = (status: string | null | undefined) => {
    switch (status) {
      case 'extracted': return 'Validated';
      case 'verified': return 'Verified';
      case 'needs_review': return 'Partial';
      case 'error': return 'Failed';
      case 'pending': return 'Processing';
      default: return 'Unknown';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case 'email': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'manual': return <UploadCloud className="h-4 w-4 text-zinc-400" />;
      case 'bulk': return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      default: return <FileText className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Purchase Register</h1>
            <p className="text-muted-foreground text-sm mt-1">All inward invoices from vendors</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
                <Download className="h-4 w-4" /> Export
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 overflow-hidden pointer-events-none group-hover:pointer-events-auto">
                 <button className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5">Export to Excel</button>
                 <button className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5">Export to CSV</button>
                 <button className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5">Export to PDF</button>
                 <button className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5">GSTR-2A Format</button>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard/sme/invoices/upload')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Upload Invoice
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between backdrop-blur-sm">
           <div className="flex flex-wrap items-center gap-3 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                </div>
                <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2 appearance-none cursor-pointer hover:bg-black/40">
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Quarter</option>
                  <option>Custom Range</option>
                </select>
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 pointer-events-none hidden xl:block">1 Nov - 23 Nov</span>
              </div>

              <div className="w-px h-8 bg-white/5 hidden md:block"></div>

              <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
                <option>All Vendors</option>
                <option>ABC Enterprises</option>
                <option>TechSol Solutions</option>
              </select>

              <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
                <option>All Status</option>
                <option>Validated</option>
                <option>Partial</option>
                <option>Failed</option>
              </select>

              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-zinc-500" />
                </div>
                <input type="text" className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2 placeholder-zinc-600" placeholder="Search invoices..." />
              </div>
           </div>
           <button className="text-xs text-zinc-500 hover:text-white whitespace-nowrap">Clear Filters</button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <h3 className="text-3xl font-bold text-white mt-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  `₹ ${Math.round(stats.totalPurchases).toLocaleString()}`
                )}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">{stats.count} Invoices • This Month</p>
            </div>
            <div className="px-2 py-1 bg-emerald-500/10 rounded text-emerald-500 text-xs font-medium flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" /> New
            </div>
          </div>
        </BentoCard>

        <BentoCard className="p-6">
          <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-sm text-muted-foreground">Total Input Tax (ITC)</p>
               <h3 className="text-3xl font-bold text-emerald-500 mt-2">
                 {loading ? (
                   <Loader2 className="h-8 w-8 animate-spin" />
                 ) : (
                   `₹ ${Math.round(stats.totalTax).toLocaleString()}`
                 )}
               </h3>
             </div>
             <div className="p-2 bg-emerald-500/10 rounded-lg">
               <CheckCircle2 className="h-5 w-5 text-emerald-500" />
             </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-3">
             <div>
               <p className="text-[10px] text-zinc-500">CGST</p>
               <p className="text-xs font-mono text-white">₹{(stats.cgst / 1000).toFixed(1)}K</p>
             </div>
             <div>
               <p className="text-[10px] text-zinc-500">SGST</p>
               <p className="text-xs font-mono text-white">₹{(stats.sgst / 1000).toFixed(1)}K</p>
             </div>
             <div>
               <p className="text-[10px] text-zinc-500">IGST</p>
               <p className="text-xs font-mono text-white">₹{(stats.igst / 1000).toFixed(1)}K</p>
             </div>
          </div>
        </BentoCard>

        <BentoCard className="p-4 flex items-center gap-4">
           <div className="h-24 w-24 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={validationStatusData}
                    innerRadius={25}
                    outerRadius={35}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {validationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #333' }} itemStyle={{color: '#fff'}} />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-white mb-2">Validation Status</p>
              {validationStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                      <span className="text-zinc-400">{item.name}</span>
                   </div>
                   <span className="text-white font-mono">{item.value}</span>
                </div>
              ))}
           </div>
        </BentoCard>
      </div>

      {/* 3. DATA TABLE */}
      <GlassPanel className="p-0 overflow-hidden flex flex-col h-[600px]">
        {/* Table Actions Bar */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   className="rounded bg-zinc-800 border-zinc-600 text-primary focus:ring-primary"
                   checked={selectedRows.length === purchaseInvoices.length && purchaseInvoices.length > 0}
                   onChange={toggleSelectAll}
                 />
                 <span className="text-sm text-zinc-400">Select All</span>
              </div>
              <div className="h-4 w-px bg-white/10"></div>
              <span className="text-sm text-white font-medium">{stats.count} Invoices Found</span>
           </div>

           {selectedRows.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                 <span className="text-sm text-zinc-300">{selectedRows.length} selected</span>
                 <div className="flex items-center rounded-lg bg-zinc-800 border border-white/10 overflow-hidden">
                    <button className="px-3 py-1.5 text-xs hover:bg-white/5 text-zinc-300 border-r border-white/10">Mark Reviewed</button>
                    <button className="px-3 py-1.5 text-xs hover:bg-white/5 text-zinc-300 border-r border-white/10">Re-validate</button>
                    <button className="px-3 py-1.5 text-xs hover:bg-white/5 text-red-400 hover:text-red-300">Delete</button>
                 </div>
              </div>
           )}
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm relative">
            <thead className="text-zinc-500 font-medium bg-zinc-950/50 sticky top-0 z-10 backdrop-blur-sm">
               <tr>
                 <th className="px-6 py-3 w-12"></th>
                 <th className="px-6 py-3 cursor-pointer hover:text-white transition-colors">Invoice No</th>
                 <th className="px-6 py-3 cursor-pointer hover:text-white transition-colors">Date</th>
                 <th className="px-6 py-3 cursor-pointer hover:text-white transition-colors">Vendor</th>
                 <th className="px-6 py-3 text-right cursor-pointer hover:text-white transition-colors">Taxable</th>
                 <th className="px-6 py-3 text-right cursor-pointer hover:text-white transition-colors">GST</th>
                 <th className="px-6 py-3 text-right cursor-pointer hover:text-white transition-colors">Total</th>
                 <th className="px-6 py-3 text-center">HSN</th>
                 <th className="px-6 py-3 text-center">Status</th>
                 <th className="px-6 py-3 text-center">Source</th>
                 <th className="px-6 py-3 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {loading ? (
                 <tr>
                   <td colSpan={11} className="px-6 py-12 text-center">
                     <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                     <p className="text-sm text-zinc-500 mt-2">Loading invoices...</p>
                   </td>
                 </tr>
               ) : purchaseInvoices.length === 0 ? (
                 <tr>
                   <td colSpan={11} className="px-6 py-12 text-center">
                     <FileText className="h-12 w-12 mx-auto text-zinc-700 mb-2" />
                     <p className="text-sm text-zinc-500">No invoices found</p>
                     <button 
                       onClick={() => router.push('/dashboard/sme/invoices/upload')}
                       className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                     >
                       Upload First Invoice
                     </button>
                   </td>
                 </tr>
               ) : (
                 purchaseInvoices.map((inv) => (
                   <tr key={inv.id} className="group hover:bg-white/5 transition-colors">
                     <td className="px-6 py-4">
                       <input 
                         type="checkbox" 
                         className="rounded bg-zinc-800 border-zinc-600 text-primary focus:ring-primary"
                         checked={selectedRows.includes(inv.id || '')}
                         onChange={() => toggleRowSelection(inv.id || '')}
                       />
                     </td>
                     <td className="px-6 py-4">
                        <button onClick={() => setSelectedInvoice(inv)} className="font-medium text-white hover:text-primary hover:underline text-left">
                          {inv.invoice_number || 'N/A'}
                        </button>
                     </td>
                     <td className="px-6 py-4 text-zinc-400">
                       {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : 'N/A'}
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-zinc-200">{inv.supplier_name || 'Unknown'}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{inv.supplier_gstin || 'N/A'}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right text-zinc-300 font-mono">
                       ₹{(inv.taxable_value || 0).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-right text-zinc-300 font-mono group-hover:text-emerald-400 transition-colors cursor-help" title="CGST + SGST + IGST">
                       ₹{((inv.cgst_amount || 0) + (inv.sgst_amount || 0) + (inv.igst_amount || 0)).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-right font-bold text-white font-mono">
                       ₹{(inv.total_invoice_value || 0).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-center text-zinc-500 font-mono text-xs">
                       {inv.hsn_or_sac_code || 'N/A'}
                     </td>
                     <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(inv.invoice_status)}`}>
                           {getStatusLabel(inv.invoice_status)}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-center flex justify-center">
                        <div className="p-1.5 rounded-lg bg-zinc-900 border border-white/5" title={inv.source || 'unknown'}>
                          {getSourceIcon(inv.source || 'manual')}
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white" title="View Details">
                              <Eye className="h-4 w-4" />
                           </button>
                           {inv.invoice_bucket_url && (
                             <a 
                               href={inv.invoice_bucket_url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white" 
                               title="Download"
                             >
                               <Download className="h-4 w-4" />
                             </a>
                           )}
                           <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                           </button>
                        </div>
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-zinc-900/50">
           <div className="text-xs text-zinc-500">Showing 1-50 of 823</div>
           <div className="flex items-center gap-2">
              <select className="bg-zinc-900 border border-white/10 text-xs rounded p-1 text-zinc-400 outline-none">
                <option>25 / page</option>
                <option>50 / page</option>
                <option>100 / page</option>
              </select>
              <div className="flex gap-1">
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700" disabled>Previous</button>
                 <button className="px-2 py-1 rounded bg-primary text-white text-xs">1</button>
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">2</button>
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">3</button>
                 <span className="px-2 py-1 text-zinc-600 text-xs">...</span>
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">Next</button>
              </div>
           </div>
        </div>
      </GlassPanel>

      {/* DETAIL MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-zinc-950 border border-white/10 w-full max-w-6xl h-[90vh] rounded-2xl flex overflow-hidden shadow-2xl">
              {/* Left: Preview */}
              <div className="w-[40%] bg-zinc-900 border-r border-white/5 p-6 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-semibold">Original Invoice</h3>
                    <div className="flex gap-2">
                       {selectedInvoice.invoice_bucket_url && (
                         <a 
                           href={selectedInvoice.invoice_bucket_url} 
                           target="_blank"
                           rel="noopener noreferrer"
                           className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                         >
                           <Download className="h-4 w-4" />
                         </a>
                       )}
                    </div>
                 </div>
                 <div className="flex-1 bg-zinc-950 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
                    {selectedInvoice.invoice_bucket_url ? (
                      <iframe 
                        src={selectedInvoice.invoice_bucket_url} 
                        className="w-full h-full"
                        title="Invoice Preview"
                      />
                    ) : (
                      <>
                        <FileText className="h-16 w-16 text-zinc-700" />
                        <p className="mt-4 text-zinc-600 text-sm">No Preview Available</p>
                      </>
                    )}
                 </div>
              </div>

              {/* Right: Details */}
              <div className="w-[60%] flex flex-col bg-background">
                 {/* Modal Header */}
                 <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                    <div>
                       <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          {selectedInvoice.invoice_number || 'N/A'} 
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(selectedInvoice.invoice_status)}`}>
                            {getStatusLabel(selectedInvoice.invoice_status)}
                          </span>
                       </h2>
                    </div>
                    <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white">
                       <X className="h-5 w-5" />
                    </button>
                 </div>

                 {/* Tabs */}
                 <div className="flex border-b border-white/5 px-6">
                    <button 
                      onClick={() => setModalTab('details')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${modalTab === 'details' ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Invoice Details
                    </button>
                    <button 
                      onClick={() => setModalTab('validation')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${modalTab === 'validation' ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Validation Results
                    </button>
                    <button 
                      onClick={() => setModalTab('history')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${modalTab === 'history' ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                      History
                    </button>
                 </div>

                 {/* Tab Content */}
                 <div className="flex-1 overflow-y-auto p-6">
                    {modalTab === 'details' && (
                       <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-xs text-zinc-500 font-medium uppercase">Invoice Number</label>
                                <input type="text" defaultValue={selectedInvoice.invoice_number || ''} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs text-zinc-500 font-medium uppercase">Invoice Date</label>
                                <input type="date" defaultValue={selectedInvoice.invoice_date || ''} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                             </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-white/5">
                             <h4 className="text-sm font-semibold text-white">Vendor Details</h4>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-xs text-zinc-500 font-medium uppercase">Vendor Name</label>
                                   <input type="text" defaultValue={selectedInvoice.supplier_name || ''} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs text-zinc-500 font-medium uppercase">GSTIN</label>
                                   <input type="text" defaultValue={selectedInvoice.supplier_gstin || ''} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                                </div>
                             </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-white/5">
                             <h4 className="text-sm font-semibold text-white">Tax Breakdown</h4>
                             <div className="grid grid-cols-3 gap-4 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                <div className="space-y-1">
                                   <label className="text-xs text-zinc-500">Taxable Value</label>
                                   <input type="text" defaultValue={selectedInvoice.taxable_value || 0} className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white font-mono outline-none focus:border-primary text-right" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-zinc-500">CGST</label>
                                   <input type="text" defaultValue={selectedInvoice.cgst_amount || 0} className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white font-mono outline-none focus:border-primary text-right" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-zinc-500">SGST</label>
                                   <input type="text" defaultValue={selectedInvoice.sgst_amount || 0} className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white font-mono outline-none focus:border-primary text-right" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-zinc-500">IGST</label>
                                   <input type="text" defaultValue={selectedInvoice.igst_amount || 0} className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white font-mono outline-none focus:border-primary text-right" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-xs text-zinc-500">CESS</label>
                                   <input type="text" defaultValue={selectedInvoice.cess_amount || 0} className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white font-mono outline-none focus:border-primary text-right" />
                                </div>
                             </div>
                             <div className="flex justify-end items-center gap-4 pt-2">
                                <span className="text-sm text-zinc-400">Total Amount</span>
                                <span className="text-2xl font-bold text-white font-mono">₹ {(selectedInvoice.total_invoice_value || 0).toLocaleString()}</span>
                             </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-white/5">
                             <h4 className="text-sm font-semibold text-white">Additional Details</h4>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                   <label className="text-xs text-zinc-500 font-medium uppercase">HSN/SAC Code</label>
                                   <input type="text" defaultValue={selectedInvoice.hsn_or_sac_code || ''} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs text-zinc-500 font-medium uppercase">Invoice Type</label>
                                   <input type="text" defaultValue={selectedInvoice.invoice_type || ''} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                                </div>
                             </div>
                          </div>
                       </div>
                    )}

                    {modalTab === 'validation' && (
                       <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                             <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                             <div>
                                <h4 className="text-sm font-semibold text-emerald-500">GSTIN Validated</h4>
                                <p className="text-xs text-zinc-400 mt-1">Vendor GSTIN is active and filing frequency is Monthly.</p>
                             </div>
                          </div>
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                             <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                             <div>
                                <h4 className="text-sm font-semibold text-emerald-500">Mathematical Accuracy</h4>
                                <p className="text-xs text-zinc-400 mt-1">Taxable value + GST exactly matches Total Amount.</p>
                             </div>
                          </div>
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                             <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                             <div>
                                <h4 className="text-sm font-semibold text-emerald-500">No Duplicates</h4>
                                <p className="text-xs text-zinc-400 mt-1">Invoice number is unique for this fiscal year.</p>
                             </div>
                          </div>
                       </div>
                    )}
                    
                    {modalTab === 'history' && (
                       <div className="relative pl-6 border-l border-zinc-800 space-y-8">
                          {[
                             { time: 'Today, 2:30 PM', action: 'Validated Successfully', user: 'System', icon: CheckCircle2, color: 'text-emerald-500' },
                             { time: 'Today, 2:29 PM', action: 'Edited by User', user: 'Rahul Sharma', icon: Edit3, color: 'text-blue-500' },
                             { time: 'Today, 2:25 PM', action: 'Validation Failed (Total Mismatch)', user: 'System', icon: AlertTriangle, color: 'text-red-500' },
                             { time: 'Today, 2:24 PM', action: 'Uploaded via WhatsApp', user: 'System', icon: UploadCloud, color: 'text-zinc-400' },
                          ].map((item, i) => (
                             <div key={i} className="relative">
                                <div className={`absolute -left-[33px] top-0 h-4 w-4 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center`}>
                                   <div className={`h-1.5 w-1.5 rounded-full ${item.color.replace('text-', 'bg-')}`}></div>
                                </div>
                                <p className="text-xs text-zinc-500 mb-1">{item.time}</p>
                                <p className="text-sm text-white font-medium">{item.action}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">by {item.user}</p>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>

                 {/* Modal Footer */}
                 <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-zinc-900/50">
                    <button onClick={() => setSelectedInvoice(null)} className="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                    <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                       <Save className="h-4 w-4" /> Save Changes
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
