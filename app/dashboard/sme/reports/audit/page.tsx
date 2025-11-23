'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  FileText,
  AlertOctagon,
  CheckCircle2,
  Eye,
  ShieldCheck
} from 'lucide-react';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

const auditLogs = [
  { id: 1, time: '23 Nov, 18:45:23', user: 'Rahul Sharma', action: 'Uploaded Invoice', entity: 'Invoice', ref: 'INV-001234', details: 'Manual upload via PDF', ip: '192.168.1.105', status: 'Success' },
  { id: 2, time: '23 Nov, 18:30:10', user: 'System', action: 'Reconciliation Run', entity: 'Process', ref: 'REC-NOV-25', details: 'Auto-run: 823 processed', ip: 'System', status: 'Success' },
  { id: 3, time: '23 Nov, 17:15:00', user: 'Priya Gupta', action: 'Edited Amount', entity: 'Invoice', ref: 'INV-005678', details: 'Value changed: ₹45600 -> ₹45608', ip: '192.168.1.102', status: 'Success' },
  { id: 4, time: '23 Nov, 16:00:00', user: 'Rahul Sharma', action: 'Deleted Invoice', entity: 'Invoice', ref: 'INV-009999', details: 'Duplicate entry removal', ip: '192.168.1.105', status: 'Warning' },
  { id: 5, time: '23 Nov, 15:45:12', user: 'Rahul Sharma', action: 'Settings Change', entity: 'Settings', ref: '-', details: 'Updated default tax rate for HSN 8471', ip: '192.168.1.105', status: 'Success' },
  { id: 6, time: '23 Nov, 14:20:30', user: 'System', action: 'GSTR-2B Fetch', entity: 'API', ref: '-', details: 'Fetch failed: Portal Timeout', ip: 'System', status: 'Failed' },
];

export default function AuditTrailPage() {
  return (
    <div className="space-y-6 pb-20">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete activity log for compliance and forensic purposes</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-zinc-900 border border-white/10 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-primary outline-none text-zinc-300 cursor-pointer hover:bg-zinc-800">
               <option>Last 24 Hours</option>
               <option>Last 7 Days</option>
               <option>Custom Range</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
           </div>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <ShieldCheck className="h-4 w-4" /> Export for Auditor
           </button>
           <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
             <Download className="h-4 w-4" /> Download Log
           </button>
        </div>
      </div>

      {/* 2. SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <BentoCard className="p-6">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold">Total Activities</p>
                  <h3 className="text-3xl font-bold text-white mt-2">1,247</h3>
                  <p className="text-xs text-zinc-500 mt-1">Last 30 Days</p>
               </div>
               <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400"><FileText className="h-6 w-6" /></div>
            </div>
         </BentoCard>
         <BentoCard className="p-6">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold">Most Active User</p>
                  <h3 className="text-xl font-bold text-white mt-2">Rahul Sharma</h3>
                  <p className="text-xs text-emerald-500 mt-1">789 Actions (63%)</p>
               </div>
               <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400"><User className="h-6 w-6" /></div>
            </div>
         </BentoCard>
         <BentoCard className="p-6 border-red-500/30 bg-red-500/5">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs text-red-400 uppercase font-semibold">Critical Actions</p>
                  <h3 className="text-3xl font-bold text-red-500 mt-2">23</h3>
                  <p className="text-xs text-red-400/70 mt-1">Deletions & Config Changes</p>
               </div>
               <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><AlertOctagon className="h-6 w-6" /></div>
            </div>
         </BentoCard>
      </div>

      {/* 3. FILTERS */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-wrap items-center gap-3 backdrop-blur-sm">
         <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
            <option>All Users</option>
            <option>Rahul Sharma</option>
            <option>Priya Gupta</option>
            <option>System</option>
         </select>
         <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
            <option>All Actions</option>
            <option>Create</option>
            <option>Update</option>
            <option>Delete</option>
            <option>Login</option>
         </select>
         <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
            <option>All Entities</option>
            <option>Invoice</option>
            <option>Vendor</option>
            <option>Settings</option>
         </select>
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input type="text" placeholder="Search by ID, detail..." className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:ring-1 focus:ring-primary outline-none w-full" />
         </div>
      </div>

      {/* 4. AUDIT TABLE */}
      <GlassPanel className="p-0 overflow-hidden flex flex-col min-h-[600px]">
         <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-white/5 text-zinc-500 font-medium sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                     <th className="px-6 py-3">Timestamp</th>
                     <th className="px-6 py-3">User</th>
                     <th className="px-6 py-3">Action</th>
                     <th className="px-6 py-3">Entity Type</th>
                     <th className="px-6 py-3">Reference ID</th>
                     <th className="px-6 py-3">Details</th>
                     <th className="px-6 py-3">IP Address</th>
                     <th className="px-6 py-3 text-right">Status</th>
                     <th className="px-6 py-3 text-right"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                     <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 text-zinc-400 font-mono text-xs whitespace-nowrap">{log.time}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-white">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${log.user === 'System' ? 'bg-zinc-700 text-zinc-400' : 'bg-primary/20 text-primary'}`}>
                                 {log.user.charAt(0)}
                              </div>
                              {log.user}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`font-medium ${log.action.includes('Delete') ? 'text-red-400' : log.action.includes('Edit') ? 'text-blue-400' : 'text-white'}`}>
                              {log.action}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                           <span className="bg-zinc-800 px-2 py-1 rounded text-xs border border-white/5">{log.entity}</span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{log.ref}</td>
                        <td className="px-6 py-4 text-zinc-300 max-w-xs truncate">{log.details}</td>
                        <td className="px-6 py-4 text-zinc-500 text-xs font-mono">{log.ip}</td>
                        <td className="px-6 py-4 text-right">
                           <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
                              log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                              log.status === 'Failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                              'bg-amber-500/10 text-amber-500 border-amber-500/20'
                           }`}>
                              {log.status === 'Success' && <CheckCircle2 className="h-3 w-3" />}
                              {log.status === 'Failed' && <AlertOctagon className="h-3 w-3" />}
                              {log.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors">
                              <Eye className="h-4 w-4" />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         {/* Pagination */}
         <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-zinc-900/50">
           <div className="text-xs text-zinc-500">Showing 1-6 of 1,247</div>
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
