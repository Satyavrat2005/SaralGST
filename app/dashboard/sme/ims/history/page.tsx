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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <History className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Audit Trail</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Action History</h1>
          <p className="text-gray-600 text-sm mt-1">Full audit trail of all IMS decisions and changes</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
               <option>Last 7 Days</option>
               <option>This Month</option>
               <option>Custom Range</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
           </div>
           <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium">
             <Download className="h-4 w-4" /> Export Log
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
         <select className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-2.5 cursor-pointer hover:border-gray-300 min-w-[150px] outline-none transition-all">
            <option>All Users</option>
            <option>Rahul Sharma</option>
            <option>Priya M.</option>
            <option>System</option>
         </select>
         <select className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-2.5 cursor-pointer hover:border-gray-300 min-w-[150px] outline-none transition-all">
            <option>All Actions</option>
            <option>Accepted</option>
            <option>Rejected</option>
            <option>Pending</option>
            <option>Remarks</option>
         </select>
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search invoice, vendor, or remark..." 
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full transition-all"
            />
         </div>
      </div>

      {/* 2. HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col min-h-[600px]">
         <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gradient-to-r from-gray-50 to-white text-gray-700 font-semibold sticky top-0 backdrop-blur-sm z-10 border-b border-gray-200">
                  <tr>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Timestamp</th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">User</th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Action</th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Details</th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Vendor</th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Status Change</th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Remark</th>
                     <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Source</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {actionHistory.map((log) => (
                     <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">{log.time}</td>
                        <td className="px-4 py-3 text-gray-900 flex items-center gap-2">
                           {log.user === 'System' ? (
                              <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center"><History className="h-3 w-3 text-gray-500" /></div>
                           ) : (
                              <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold">{log.user.charAt(0)}</div>
                           )}
                           {log.user}
                        </td>
                        <td className="px-4 py-3">
                           <span className={`font-semibold text-xs ${log.action.includes('Accept') ? 'text-emerald-600' : log.action.includes('Reject') ? 'text-red-600' : 'text-blue-600'}`}>
                              {log.action}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900 text-xs font-medium">{log.detail}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{log.vendor}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{log.statusChange}</td>
                        <td className="px-4 py-3 text-gray-700 italic max-w-[200px] truncate text-xs" title={log.remark}>{log.remark}</td>
                        <td className="px-4 py-3 text-right">
                           <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${log.source === 'Automated' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700'}`}>
                              {log.source}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         {/* Pagination */}
         <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
           <div className="text-xs text-gray-600">Showing 1-5 of 143 actions</div>
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
