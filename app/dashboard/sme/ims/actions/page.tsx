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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <Gavel className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">IMS Actions</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GSTR-2B Actions</h1>
          <p className="text-gray-600 text-sm mt-1">Accept, reject, or review 2B invoices for ITC eligibility</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
               <option>Nov 2025</option>
               <option>Oct 2025</option>
               <option>Sep 2025</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
           </div>
           <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium">
             <Filter className="h-4 w-4" /> Filters
           </button>
        </div>
      </div>

      {/* 2. STATUS SUMMARY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-lg p-6 cursor-pointer hover:shadow-xl hover:border-emerald-300 transition-all">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">Accepted</p>
               <h3 className="text-2xl font-bold text-gray-900 mt-2">654 <span className="text-sm font-normal text-gray-600">/ 800</span></h3>
               <p className="text-xs text-gray-600 mt-1">ITC: ₹ 6,45,210</p>
             </div>
             <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
               <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
             </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-6 cursor-pointer hover:shadow-xl hover:border-red-300 transition-all">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs text-red-600 uppercase tracking-wider font-semibold">Rejected</p>
               <h3 className="text-2xl font-bold text-gray-900 mt-2">37 <span className="text-sm font-normal text-gray-600">/ 800</span></h3>
               <p className="text-xs text-gray-600 mt-1">Blocked: ₹ 78,420</p>
             </div>
             <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30">
               <XCircle className="h-5 w-5" strokeWidth={2.5} />
             </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 shadow-lg p-6 cursor-pointer hover:shadow-xl hover:border-amber-300 transition-all">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs text-amber-600 uppercase tracking-wider font-semibold">Pending</p>
               <h3 className="text-2xl font-bold text-gray-900 mt-2">102 <span className="text-sm font-normal text-gray-600">/ 800</span></h3>
               <p className="text-xs text-gray-600 mt-1">At Risk: ₹ 1,24,800</p>
             </div>
             <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30">
               <AlertTriangle className="h-5 w-5" strokeWidth={2.5} />
             </div>
           </div>
        </div>
      </div>

      {/* 3. ACTION TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col min-h-[500px]">
         {/* Table Controls */}
         <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="rounded bg-white border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    checked={selectedRows.length === imsInvoices.length}
                    onChange={toggleSelectAll}
                  />
                  <span className="text-sm text-gray-600">Select All</span>
               </div>
               {selectedRows.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                     <div className="h-4 w-px bg-gray-300 mx-2"></div>
                     <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors shadow-sm">
                        <Check className="h-3 w-3" /> Accept ({selectedRows.length})
                     </button>
                     <button className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors shadow-sm">
                        <X className="h-3 w-3" /> Reject ({selectedRows.length})
                     </button>
                     <button className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-300 transition-colors">
                        More Actions
                     </button>
                  </div>
               )}
            </div>
            
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search invoices..." 
                 className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-64"
               />
            </div>
         </div>

         <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gradient-to-r from-gray-50 to-white text-gray-700 font-semibold sticky top-0 backdrop-blur-sm z-10 border-b border-gray-200">
                  <tr>
                     <th className="px-4 py-3 w-12"></th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Invoice No</th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Date</th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Vendor</th>
                     <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Amount</th>
                     <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">GST</th>
                     <th className="px-4 py-3 text-center text-xs uppercase tracking-wider">ITC Status</th>
                     <th className="px-4 py-3 text-center text-xs uppercase tracking-wider">Issues</th>
                     <th className="px-4 py-3 text-center text-xs uppercase tracking-wider">Decision</th>
                     <th className="px-4 py-3 text-center text-xs uppercase tracking-wider">Remark</th>
                     <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {imsInvoices.map((inv) => {
                     const currentDecision = decisions[inv.id] || inv.decision;
                     return (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                           <td className="px-4 py-3">
                              <input 
                                type="checkbox" 
                                className="rounded bg-white border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                checked={selectedRows.includes(inv.id)}
                                onChange={() => toggleRowSelection(inv.id)}
                              />
                           </td>
                           <td className="px-4 py-3">
                              <span className="font-semibold text-gray-900 hover:text-emerald-600 hover:underline cursor-pointer">{inv.id}</span>
                           </td>
                           <td className="px-4 py-3 text-gray-600 text-xs">{inv.date}</td>
                           <td className="px-4 py-3">
                              <div className="flex flex-col">
                                 <span className="text-gray-900 text-xs font-medium">{inv.vendor}</span>
                                 <span className="text-[10px] text-gray-500 font-mono">{inv.gstin}</span>
                              </div>
                           </td>
                           <td className="px-4 py-3 text-right text-gray-900 font-semibold text-xs">₹{inv.amount.toLocaleString()}</td>
                           <td className="px-4 py-3 text-right text-gray-700 font-semibold text-xs">₹{inv.gst.toLocaleString()}</td>
                           <td className="px-4 py-3 text-center">{getStatusBadge(inv.itcStatus)}</td>
                           <td className="px-4 py-3 text-center">
                              {inv.issues === 0 ? (
                                 <span className="text-emerald-600 text-xs flex items-center justify-center gap-1 font-semibold"><CheckCircle2 className="h-3 w-3" /> Valid</span>
                              ) : (
                                 <span className="text-amber-600 text-xs flex items-center justify-center gap-1 cursor-pointer hover:underline font-semibold"><AlertTriangle className="h-3 w-3" /> {inv.issues} Issue{inv.issues > 1 ? 's' : ''}</span>
                              )}
                           </td>
                           <td className="px-4 py-3">
                              <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200 w-fit mx-auto">
                                 <button 
                                    onClick={() => handleDecision(inv.id, 'Accept')}
                                    className={`p-1.5 rounded transition-all ${currentDecision === 'Accept' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Accept"
                                 >
                                    <Check className="h-3.5 w-3.5" />
                                 </button>
                                 <button 
                                    onClick={() => handleDecision(inv.id, 'Pending')}
                                    className={`p-1.5 rounded transition-all ${currentDecision === 'Pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Pending"
                                 >
                                    <Clock className="h-3.5 w-3.5" />
                                 </button>
                                 <button 
                                    onClick={() => handleDecision(inv.id, 'Reject')}
                                    className={`p-1.5 rounded transition-all ${currentDecision === 'Reject' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Reject"
                                 >
                                    <X className="h-3.5 w-3.5" />
                                 </button>
                              </div>
                           </td>
                           <td className="px-4 py-3 text-center">
                              {inv.remark ? (
                                 <div className="group/remark relative inline-block">
                                    <MessageSquare className="h-4 w-4 text-blue-600 cursor-pointer" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl text-xs text-white opacity-0 group-hover/remark:opacity-100 pointer-events-none transition-opacity z-20">
                                       {inv.remark}
                                    </div>
                                 </div>
                              ) : (
                                 <button className="text-gray-400 hover:text-gray-600"><MessageSquare className="h-4 w-4" /></button>
                              )}
                           </td>
                           <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-all" title="View Details">
                                    <Eye className="h-4 w-4" />
                                 </button>
                                 <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-all" title="Download PDF">
                                    <Download className="h-4 w-4" />
                                 </button>
                                 <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-all">
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
         <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
           <div className="text-xs text-gray-600">Showing 1-6 of 102</div>
           <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-600 text-xs hover:text-gray-900 hover:bg-gray-50" disabled>Previous</button>
              <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">1</button>
              <button className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-600 text-xs hover:text-gray-900 hover:bg-gray-50">2</button>
              <button className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-600 text-xs hover:text-gray-900 hover:bg-gray-50">Next</button>
           </div>
         </div>
      </div>
    </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Eligible': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Eligible</span>;
    case 'Blocked': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Blocked</span>;
    case 'At Risk': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">At Risk</span>;
    default: return null;
  }
}