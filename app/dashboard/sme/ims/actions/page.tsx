'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  MoreVertical, 
  Download, 
  Eye, 
  MessageSquare, 
  FileText, 
  Gavel,
  Check,
  X,
  Clock
} from 'lucide-react';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Mock Data
const imsInvoices = [
  { id: 'INV-003456', date: '18 Nov 2025', vendor: 'XYZ Enterprises', gstin: '27ABCDE1234F1Z5', amount: 45600, gst: 8208, itcStatus: 'Eligible', issues: 0, decision: 'Pending', remark: '' },
  { id: 'INV-003457', date: '17 Nov 2025', vendor: 'TechSol Solutions', gstin: '29PQRST5678H1Z2', amount: 12000, gst: 2160, itcStatus: 'At Risk', issues: 2, decision: 'Pending', remark: 'Tax mismatch' },
  { id: 'INV-003458', date: '17 Nov 2025', vendor: 'Global Logistics', gstin: '07KLMNO4321J1Z9', amount: 89000, gst: 16020, itcStatus: 'Eligible', issues: 0, decision: 'Accept', remark: '' },
  { id: 'INV-003459', date: '16 Nov 2025', vendor: 'Reddy Traders', gstin: '33FGHIJ9876L1Z4', amount: 5600, gst: 1008, itcStatus: 'Blocked', issues: 1, decision: 'Reject', remark: 'Section 17(5)' },
  { id: 'INV-003460', date: '15 Nov 2025', vendor: 'Office Supplies Co', gstin: '19UVWXY8765K1Z3', amount: 23000, gst: 4140, itcStatus: 'Eligible', issues: 0, decision: 'Pending', remark: '' },
  { id: 'INV-003461', date: '15 Nov 2025', vendor: 'Alpha Systems', gstin: '33ALPHA9876Z1Z3', amount: 145000, gst: 26100, itcStatus: 'At Risk', issues: 1, decision: 'Pending', remark: 'Place of Supply mismatch' },
];

export default function IMSActionsPage() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<Record<string, string>>({});

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === imsInvoices.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(imsInvoices.map(inv => inv.id));
    }
  };

  const handleDecision = (id: string, decision: string) => {
    setDecisions(prev => ({ ...prev, [id]: decision }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Eligible': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Eligible</span>;
      case 'Blocked': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">Blocked</span>;
      case 'At Risk': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">At Risk</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">GSTR-2B Actions</h1>
          <p className="text-muted-foreground text-sm mt-1">Accept, reject, or review 2B invoices for ITC eligibility</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-zinc-900 border border-white/10 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-primary outline-none text-zinc-300 cursor-pointer hover:bg-zinc-800">
               <option>Nov 2025</option>
               <option>Oct 2025</option>
               <option>Sep 2025</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
           </div>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Filter className="h-4 w-4" /> Filters
           </button>
        </div>
      </div>

      {/* 2. STATUS SUMMARY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard className="border-emerald-500/30 bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/10 transition-colors">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">Accepted</p>
               <h3 className="text-2xl font-bold text-white mt-2">654 <span className="text-sm font-normal text-zinc-400">/ 800</span></h3>
               <p className="text-xs text-zinc-500 mt-1">ITC: ₹ 6,45,210</p>
             </div>
             <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
               <CheckCircle2 className="h-5 w-5" />
             </div>
           </div>
        </BentoCard>

        <BentoCard className="border-red-500/30 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs text-red-400 uppercase tracking-wider font-semibold">Rejected</p>
               <h3 className="text-2xl font-bold text-white mt-2">37 <span className="text-sm font-normal text-zinc-400">/ 800</span></h3>
               <p className="text-xs text-zinc-500 mt-1">Blocked: ₹ 78,420</p>
             </div>
             <div className="p-2 rounded-full bg-red-500/10 text-red-500">
               <XCircle className="h-5 w-5" />
             </div>
           </div>
        </BentoCard>

        <BentoCard className="border-amber-500/30 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold">Pending</p>
               <h3 className="text-2xl font-bold text-white mt-2">102 <span className="text-sm font-normal text-zinc-400">/ 800</span></h3>
               <p className="text-xs text-zinc-500 mt-1">At Risk: ₹ 1,24,800</p>
             </div>
             <div className="p-2 rounded-full bg-amber-500/10 text-amber-500">
               <AlertTriangle className="h-5 w-5" />
             </div>
           </div>
        </BentoCard>
      </div>

      {/* 3. ACTION TABLE */}
      <GlassPanel className="p-0 overflow-hidden flex flex-col min-h-[500px]">
         {/* Table Controls */}
         <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="rounded bg-zinc-800 border-zinc-600 text-primary focus:ring-primary"
                    checked={selectedRows.length === imsInvoices.length}
                    onChange={toggleSelectAll}
                  />
                  <span className="text-sm text-zinc-400">Select All</span>
               </div>
               {selectedRows.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                     <div className="h-4 w-px bg-white/10 mx-2"></div>
                     <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded flex items-center gap-1 transition-colors">
                        <Check className="h-3 w-3" /> Accept ({selectedRows.length})
                     </button>
                     <button className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded flex items-center gap-1 transition-colors">
                        <X className="h-3 w-3" /> Reject ({selectedRows.length})
                     </button>
                     <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded border border-white/10 transition-colors">
                        More Actions
                     </button>
                  </div>
               )}
            </div>
            
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
               <input 
                 type="text" 
                 placeholder="Search invoices..." 
                 className="pl-9 pr-4 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:ring-1 focus:ring-primary outline-none w-64"
               />
            </div>
         </div>

         <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-white/5 text-zinc-500 font-medium sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                     <th className="px-6 py-3 w-12"></th>
                     <th className="px-6 py-3">Invoice No</th>
                     <th className="px-6 py-3">Date</th>
                     <th className="px-6 py-3">Vendor</th>
                     <th className="px-6 py-3 text-right">Amount</th>
                     <th className="px-6 py-3 text-right">GST</th>
                     <th className="px-6 py-3 text-center">ITC Status</th>
                     <th className="px-6 py-3 text-center">Issues</th>
                     <th className="px-6 py-3 text-center">Decision</th>
                     <th className="px-6 py-3 text-center">Remark</th>
                     <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {imsInvoices.map((inv) => {
                     const currentDecision = decisions[inv.id] || inv.decision;
                     return (
                        <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                           <td className="px-6 py-4">
                              <input 
                                type="checkbox" 
                                className="rounded bg-zinc-800 border-zinc-600 text-primary focus:ring-primary"
                                checked={selectedRows.includes(inv.id)}
                                onChange={() => toggleRowSelection(inv.id)}
                              />
                           </td>
                           <td className="px-6 py-4">
                              <span className="font-medium text-white hover:text-primary hover:underline cursor-pointer">{inv.id}</span>
                           </td>
                           <td className="px-6 py-4 text-zinc-400">{inv.date}</td>
                           <td className="px-6 py-4">
                              <div className="flex flex-col">
                                 <span className="text-zinc-200">{inv.vendor}</span>
                                 <span className="text-[10px] text-zinc-500 font-mono">{inv.gstin}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right text-zinc-300 font-mono">₹{inv.amount.toLocaleString()}</td>
                           <td className="px-6 py-4 text-right text-zinc-300 font-mono">₹{inv.gst.toLocaleString()}</td>
                           <td className="px-6 py-4 text-center">{getStatusBadge(inv.itcStatus)}</td>
                           <td className="px-6 py-4 text-center">
                              {inv.issues === 0 ? (
                                 <span className="text-emerald-500 text-xs flex items-center justify-center gap-1"><CheckCircle2 className="h-3 w-3" /> Valid</span>
                              ) : (
                                 <span className="text-amber-500 text-xs flex items-center justify-center gap-1 cursor-pointer hover:underline"><AlertTriangle className="h-3 w-3" /> {inv.issues} Issue{inv.issues > 1 ? 's' : ''}</span>
                              )}
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/10 w-fit mx-auto">
                                 <button 
                                    onClick={() => handleDecision(inv.id, 'Accept')}
                                    className={`p-1.5 rounded transition-all ${currentDecision === 'Accept' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Accept"
                                 >
                                    <Check className="h-3.5 w-3.5" />
                                 </button>
                                 <button 
                                    onClick={() => handleDecision(inv.id, 'Pending')}
                                    className={`p-1.5 rounded transition-all ${currentDecision === 'Pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Pending"
                                 >
                                    <Clock className="h-3.5 w-3.5" />
                                 </button>
                                 <button 
                                    onClick={() => handleDecision(inv.id, 'Reject')}
                                    className={`p-1.5 rounded transition-all ${currentDecision === 'Reject' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Reject"
                                 >
                                    <X className="h-3.5 w-3.5" />
                                 </button>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              {inv.remark ? (
                                 <div className="group/remark relative inline-block">
                                    <MessageSquare className="h-4 w-4 text-blue-400 cursor-pointer" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-white/10 rounded-lg shadow-xl text-xs text-zinc-300 opacity-0 group-hover/remark:opacity-100 pointer-events-none transition-opacity z-20">
                                       {inv.remark}
                                    </div>
                                 </div>
                              ) : (
                                 <button className="text-zinc-600 hover:text-zinc-400"><MessageSquare className="h-4 w-4" /></button>
                              )}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white" title="View Details">
                                    <Eye className="h-4 w-4" />
                                 </button>
                                 <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white" title="Download PDF">
                                    <Download className="h-4 w-4" />
                                 </button>
                                 <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white">
                                    <MoreVertical className="h-4 w-4" />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>

         {/* Pagination */}
         <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-zinc-900/50">
           <div className="text-xs text-zinc-500">Showing 1-6 of 102</div>
           <div className="flex items-center gap-2">
              <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700" disabled>Previous</button>
              <button className="px-2 py-1 rounded bg-primary text-white text-xs">1</button>
              <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">2</button>
              <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">Next</button>
           </div>
         </div>
      </GlassPanel>
    </div>
  );
}
