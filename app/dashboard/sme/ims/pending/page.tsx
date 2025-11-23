'use client';

import React, { useState } from 'react';
import { 
  Filter, 
  Search, 
  Clock, 
  AlertTriangle, 
  User, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  MoreVertical,
  ChevronDown,
  Briefcase
} from 'lucide-react';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Mock Data
const pendingInvoices = [
  { id: 'INV-003457', date: '17 Nov 2025', vendor: 'TechSol Solutions', amount: 12000, gst: 2160, assignedTo: 'Rahul S.', daysPending: 2, risk: 'Low', status: 'Assigned' },
  { id: 'INV-003461', date: '15 Nov 2025', vendor: 'Alpha Systems', amount: 145000, gst: 26100, assignedTo: 'Unassigned', daysPending: 4, risk: 'High', status: 'Not Assigned' },
  { id: 'INV-003462', date: '14 Nov 2025', vendor: 'Global Logistics', amount: 56000, gst: 10080, assignedTo: 'Priya M.', daysPending: 5, risk: 'Medium', status: 'Waiting Approval' },
  { id: 'INV-003463', date: '10 Nov 2025', vendor: 'XYZ Enterprises', amount: 23400, gst: 4212, assignedTo: 'Rahul S.', daysPending: 9, risk: 'Low', status: 'Returned' },
];

export default function IMSPendingPage() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'High': return <span className="text-red-500 font-medium">High</span>;
      case 'Medium': return <span className="text-amber-500 font-medium">Medium</span>;
      case 'Low': return <span className="text-emerald-500 font-medium">Low</span>;
      default: return <span className="text-zinc-500">Unknown</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Assigned': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Not Assigned': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'Waiting Approval': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Returned': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pending Approvals</h1>
          <p className="text-muted-foreground text-sm mt-1">Invoices awaiting decision from accountant or manager</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <User className="h-4 w-4" /> Assign Selected
           </button>
           <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
             <CheckCircle2 className="h-4 w-4" /> Approve All
           </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-wrap items-center gap-3">
         <div className="relative">
            <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary block pl-3 pr-8 py-2 appearance-none cursor-pointer hover:bg-black/40">
               <option>All Vendors</option>
               <option>Alpha Systems</option>
               <option>TechSol</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
         </div>
         <div className="relative">
            <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary block pl-3 pr-8 py-2 appearance-none cursor-pointer hover:bg-black/40">
               <option>Assigned To: All</option>
               <option>Me</option>
               <option>Rahul S.</option>
               <option>Priya M.</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
         </div>
         <div className="relative">
            <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary block pl-3 pr-8 py-2 appearance-none cursor-pointer hover:bg-black/40">
               <option>Age: All</option>
               <option>0-3 days</option>
               <option>4-7 days</option>
               <option>8+ days</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
         </div>
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search invoice..." 
              className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:ring-1 focus:ring-primary outline-none w-full"
            />
         </div>
      </div>

      {/* 2. PENDING APPROVAL TABLE */}
      <GlassPanel className="p-0 overflow-hidden flex flex-col min-h-[500px]">
         <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <span className="text-sm text-white font-medium">4 Invoices Pending</span>
            {selectedRows.length > 0 && <span className="text-sm text-zinc-400">{selectedRows.length} selected</span>}
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
                     <th className="px-6 py-3">Assigned To</th>
                     <th className="px-6 py-3 text-center">Pending</th>
                     <th className="px-6 py-3 text-center">Risk</th>
                     <th className="px-6 py-3 text-center">Status</th>
                     <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {pendingInvoices.map((inv) => (
                     <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                           <input 
                             type="checkbox" 
                             className="rounded bg-zinc-800 border-zinc-600 text-primary focus:ring-primary"
                             checked={selectedRows.includes(inv.id)}
                             onChange={() => toggleRowSelection(inv.id)}
                           />
                        </td>
                        <td className="px-6 py-4 font-medium text-white">{inv.id}</td>
                        <td className="px-6 py-4 text-zinc-400">{inv.date}</td>
                        <td className="px-6 py-4 text-zinc-200">{inv.vendor}</td>
                        <td className="px-6 py-4 text-right text-zinc-300 font-mono">₹{inv.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-zinc-300 font-mono">₹{inv.gst.toLocaleString()}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${inv.assignedTo === 'Unassigned' ? 'bg-zinc-800 text-zinc-500' : 'bg-primary/20 text-primary'}`}>
                                 {inv.assignedTo === 'Unassigned' ? '?' : inv.assignedTo.charAt(0)}
                              </div>
                              <span className={`text-xs ${inv.assignedTo === 'Unassigned' ? 'text-zinc-500 italic' : 'text-white'}`}>{inv.assignedTo}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`text-xs font-bold ${inv.daysPending > 7 ? 'text-red-500' : 'text-zinc-400'}`}>{inv.daysPending} Days</span>
                        </td>
                        <td className="px-6 py-4 text-center text-xs">{getRiskBadge(inv.risk)}</td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusBadge(inv.status)}`}>
                              {inv.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-emerald-500" title="Approve">
                                 <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-red-500" title="Reject">
                                 <XCircle className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white">
                                 <MoreVertical className="h-4 w-4" />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </GlassPanel>
    </div>
  );
}
