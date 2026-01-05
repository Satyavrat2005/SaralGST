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
      case 'High': return <span className="text-red-600 font-semibold">High</span>;
      case 'Medium': return <span className="text-amber-600 font-semibold">Medium</span>;
      case 'Low': return <span className="text-emerald-600 font-semibold">Low</span>;
      default: return <span className="text-gray-500">Unknown</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Assigned': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Not Assigned': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'Waiting Approval': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Returned': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <Clock className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Pending Actions</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pending Approvals</h1>
          <p className="text-gray-600 text-sm mt-1">Invoices awaiting decision from accountant or manager</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium">
             <User className="h-4 w-4" /> Assign Selected
           </button>
           <button className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2">
             <CheckCircle2 className="h-4 w-4" /> Approve All
           </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
         <div className="relative">
            <select className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block pl-3 pr-8 py-2.5 appearance-none cursor-pointer hover:border-gray-300 outline-none transition-all">
               <option>All Vendors</option>
               <option>Alpha Systems</option>
               <option>TechSol</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
         </div>
         <div className="relative">
            <select className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block pl-3 pr-8 py-2.5 appearance-none cursor-pointer hover:border-gray-300 outline-none transition-all">
               <option>Assigned To: All</option>
               <option>Me</option>
               <option>Rahul S.</option>
               <option>Priya M.</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
         </div>
         <div className="relative">
            <select className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block pl-3 pr-8 py-2.5 appearance-none cursor-pointer hover:border-gray-300 outline-none transition-all">
               <option>Age: All</option>
               <option>0-3 days</option>
               <option>4-7 days</option>
               <option>8+ days</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
         </div>
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search invoice..." 
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full transition-all"
            />
         </div>
      </div>

      {/* 2. PENDING APPROVAL TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col min-h-[500px]">
         <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
            <span className="text-sm text-gray-900 font-semibold">4 Invoices Pending</span>
            {selectedRows.length > 0 && <span className="text-sm text-gray-600">{selectedRows.length} selected</span>}
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
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Assigned To</th>
                     <th className="px-4 py-3 text-center text-xs uppercase tracking-wider">Pending</th>
                     <th className="px-4 py-3 text-center text-xs uppercase tracking-wider">Risk</th>
                     <th className="px-4 py-3 text-center text-xs uppercase tracking-wider">Status</th>
                     <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {pendingInvoices.map((inv) => (
                     <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3">
                           <input 
                             type="checkbox" 
                             className="rounded bg-white border-gray-300 text-emerald-600 focus:ring-emerald-500"
                             checked={selectedRows.includes(inv.id)}
                             onChange={() => toggleRowSelection(inv.id)}
                           />
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{inv.id}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{inv.date}</td>
                        <td className="px-4 py-3 text-gray-900 text-xs font-medium">{inv.vendor}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-semibold text-xs">₹{inv.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-700 font-semibold text-xs">₹{inv.gst.toLocaleString()}</td>
                        <td className="px-4 py-3">
                           <div className="flex items-center gap-2">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${inv.assignedTo === 'Unassigned' ? 'bg-gray-200 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                                 {inv.assignedTo === 'Unassigned' ? '?' : inv.assignedTo.charAt(0)}
                              </div>
                              <span className={`text-xs ${inv.assignedTo === 'Unassigned' ? 'text-gray-500 italic' : 'text-gray-900'}`}>{inv.assignedTo}</span>
                           </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                           <span className={`text-xs font-bold ${inv.daysPending > 7 ? 'text-red-600' : 'text-gray-600'}`}>{inv.daysPending} Days</span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">{getRiskBadge(inv.risk)}</td>
                        <td className="px-4 py-3 text-center">
                           <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusBadge(inv.status)}`}>
                              {inv.status}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                           <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-all" title="Approve">
                                 <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all" title="Reject">
                                 <XCircle className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-all">
                                 <MoreVertical className="h-4 w-4" />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
    </div>
  );
}
