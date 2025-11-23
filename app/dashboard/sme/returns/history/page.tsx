'use client';

import React from 'react';
import { 
  Search, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import GlassPanel from '../../../../../components/ui/GlassPanel';

// Mock Data
const filingHistory = [
  { period: 'Oct 2025', type: 'GSTR-1', filedDate: '10 Nov 2025', arn: 'ARN1234567890', status: 'Filed', liability: 0, by: 'Rahul S.' },
  { period: 'Oct 2025', type: 'GSTR-3B', filedDate: '20 Nov 2025', arn: 'ARN0987654321', status: 'Filed', liability: 456000, by: 'Rahul S.' },
  { period: 'Sep 2025', type: 'GSTR-1', filedDate: '11 Oct 2025', arn: 'ARN1122334455', status: 'Filed', liability: 0, by: 'Priya M.' },
  { period: 'Sep 2025', type: 'GSTR-3B', filedDate: '22 Oct 2025', arn: 'ARN5544332211', status: 'Filed Late', liability: 320000, by: 'Rahul S.' },
];

export default function FilingHistoryPage() {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Filing History</h1>
          <p className="text-muted-foreground text-sm mt-1">Archive of all submitted GST returns</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Download className="h-4 w-4" /> Bulk Download
           </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-wrap items-center gap-3">
         <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg p-2 cursor-pointer">
            <option>FY 2025-26</option>
            <option>FY 2024-25</option>
         </select>
         <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg p-2 cursor-pointer">
            <option>All Return Types</option>
            <option>GSTR-1</option>
            <option>GSTR-3B</option>
         </select>
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input type="text" placeholder="Search by ARN..." className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:ring-1 focus:ring-primary outline-none w-full" />
         </div>
      </div>

      {/* Table */}
      <GlassPanel className="p-0 overflow-hidden">
         <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-500 font-medium">
               <tr>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Return Type</th>
                  <th className="px-6 py-3">Filed Date</th>
                  <th className="px-6 py-3">ARN</th>
                  <th className="px-6 py-3 text-right">Tax Liability</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {filingHistory.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                     <td className="px-6 py-4 text-white font-medium">{row.period}</td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${row.type === 'GSTR-1' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                           {row.type}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-zinc-400">{row.filedDate}</td>
                     <td className="px-6 py-4 font-mono text-zinc-300 text-xs">{row.arn}</td>
                     <td className="px-6 py-4 text-right text-white font-mono">₹{row.liability.toLocaleString()}</td>
                     <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${row.status === 'Filed' ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'}`}>
                           {row.status === 'Filed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                           {row.status}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white" title="Download JSON"><FileText className="h-4 w-4" /></button>
                           <button className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white" title="Download Receipt"><Download className="h-4 w-4" /></button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </GlassPanel>
    </div>
  );
}
