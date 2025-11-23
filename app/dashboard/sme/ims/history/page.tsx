'use client';

import React from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  History, 
  ArrowRight,
  User,
  Calendar
} from 'lucide-react';
import GlassPanel from '../../../../../components/ui/GlassPanel';

// Mock Data
const actionHistory = [
  { id: 1, time: '23 Nov, 17:50', user: 'Rahul Sharma', action: 'Accepted Invoice', detail: 'INV-003456', vendor: 'XYZ Enterprises', period: 'Nov 2025', statusChange: 'Pending → Accepted', remark: 'Verified with GRN', source: 'Manual' },
  { id: 2, time: '23 Nov, 16:30', user: 'Priya M.', action: 'Rejected Invoice', detail: 'INV-003459', vendor: 'Reddy Traders', period: 'Nov 2025', statusChange: 'Pending → Rejected', remark: 'Ineligible ITC (17-5)', source: 'Manual' },
  { id: 3, time: '23 Nov, 14:15', user: 'System', action: 'Bulk Pending', detail: '15 Invoices', vendor: 'Multiple', period: 'Nov 2025', statusChange: 'New → Pending', remark: 'Auto-imported from GSTR-2B', source: 'Automated' },
  { id: 4, time: '22 Nov, 10:00', user: 'Rahul Sharma', action: 'Edited Remark', detail: 'INV-003457', vendor: 'TechSol Solutions', period: 'Nov 2025', statusChange: '-', remark: 'Updated: Tax mismatch noted', source: 'Manual' },
  { id: 5, time: '21 Nov, 09:45', user: 'Manish Kumar', action: 'Assigned', detail: 'INV-003461', vendor: 'Alpha Systems', period: 'Nov 2025', statusChange: 'Not Assigned → Assigned', remark: 'High value check', source: 'Manual' },
];

export default function IMSHistoryPage() {
  return (
    <div className="space-y-6 pb-20">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Action History</h1>
          <p className="text-muted-foreground text-sm mt-1">Full audit trail of all IMS decisions and changes</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-zinc-900 border border-white/10 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-primary outline-none text-zinc-300 cursor-pointer hover:bg-zinc-800">
               <option>Last 7 Days</option>
               <option>This Month</option>
               <option>Custom Range</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
           </div>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Download className="h-4 w-4" /> Export Log
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-wrap items-center gap-3">
         <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40 min-w-[150px]">
            <option>All Users</option>
            <option>Rahul Sharma</option>
            <option>Priya M.</option>
            <option>System</option>
         </select>
         <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40 min-w-[150px]">
            <option>All Actions</option>
            <option>Accepted</option>
            <option>Rejected</option>
            <option>Pending</option>
            <option>Remarks</option>
         </select>
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search invoice, vendor, or remark..." 
              className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:ring-1 focus:ring-primary outline-none w-full"
            />
         </div>
      </div>

      {/* 2. HISTORY TABLE */}
      <GlassPanel className="p-0 overflow-hidden flex flex-col min-h-[600px]">
         <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-white/5 text-zinc-500 font-medium sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                     <th className="px-6 py-3">Timestamp</th>
                     <th className="px-6 py-3">User</th>
                     <th className="px-6 py-3">Action</th>
                     <th className="px-6 py-3">Details</th>
                     <th className="px-6 py-3">Vendor</th>
                     <th className="px-6 py-3">Status Change</th>
                     <th className="px-6 py-3">Remark</th>
                     <th className="px-6 py-3 text-right">Source</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {actionHistory.map((log) => (
                     <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-zinc-400 whitespace-nowrap font-mono text-xs">{log.time}</td>
                        <td className="px-6 py-4 text-white flex items-center gap-2">
                           {log.user === 'System' ? (
                              <div className="h-5 w-5 rounded-full bg-zinc-800 flex items-center justify-center"><History className="h-3 w-3 text-zinc-500" /></div>
                           ) : (
                              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">{log.user.charAt(0)}</div>
                           )}
                           {log.user}
                        </td>
                        <td className="px-6 py-4">
                           <span className={`font-medium ${log.action.includes('Accept') ? 'text-emerald-400' : log.action.includes('Reject') ? 'text-red-400' : 'text-blue-400'}`}>
                              {log.action}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">{log.detail}</td>
                        <td className="px-6 py-4 text-zinc-400">{log.vendor}</td>
                        <td className="px-6 py-4 text-xs text-zinc-500">{log.statusChange}</td>
                        <td className="px-6 py-4 text-zinc-300 italic max-w-[200px] truncate" title={log.remark}>{log.remark}</td>
                        <td className="px-6 py-4 text-right">
                           <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${log.source === 'Automated' ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {log.source}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         {/* Pagination */}
         <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-zinc-900/50">
           <div className="text-xs text-zinc-500">Showing 1-5 of 143 actions</div>
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
