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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-2">
            <span className="text-emerald-700 text-xs font-semibold">REPORTS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Audit Trail</h1>
          <p className="text-gray-600 text-sm mt-1">Complete activity log for compliance and forensic purposes</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-white border border-gray-200 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-700 cursor-pointer hover:bg-gray-50 shadow-sm">
               <option>Last 24 Hours</option>
               <option>Last 7 Days</option>
               <option>Custom Range</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
           </div>
           <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm">
             <ShieldCheck className="h-4 w-4" /> Export for Auditor
           </button>
           <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
             <Download className="h-4 w-4" /> Download Log
           </button>
        </div>
      </div>

      {/* 2. SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total Activities</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">1,247</h3>
                  <p className="text-xs text-gray-600 mt-1">Last 30 Days</p>
               </div>
               <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><FileText className="h-6 w-6" /></div>
            </div>
         </div>
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Most Active User</p>
                  <h3 className="text-xl font-bold text-gray-900 mt-2">Rahul Sharma</h3>
                  <p className="text-xs text-emerald-600 mt-1">789 Actions (63%)</p>
               </div>
               <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><User className="h-6 w-6" /></div>
            </div>
         </div>
         <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-200 shadow-lg p-5">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs text-red-700 uppercase font-semibold tracking-wider">Critical Actions</p>
                  <h3 className="text-3xl font-bold text-red-600 mt-2">23</h3>
                  <p className="text-xs text-red-600 mt-1">Deletions & Config Changes</p>
               </div>
               <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertOctagon className="h-6 w-6" /></div>
            </div>
         </div>
      </div>

      {/* 3. FILTERS */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-sm">
         <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-100">
            <option>All Users</option>
            <option>Rahul Sharma</option>
            <option>Priya Gupta</option>
            <option>System</option>
         </select>
         <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-100">
            <option>All Actions</option>
            <option>Create</option>
            <option>Update</option>
            <option>Delete</option>
            <option>Login</option>
         </select>
         <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-100">
            <option>All Entities</option>
            <option>Invoice</option>
            <option>Vendor</option>
            <option>Settings</option>
         </select>
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input type="text" placeholder="Search by ID, detail..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-emerald-500 outline-none w-full" />
         </div>
      </div>

      {/* 4. AUDIT TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden min-h-[600px]">
         <div className="overflow-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0 z-10 border-b border-gray-200">
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
               <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                     <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 text-gray-600 font-mono text-xs whitespace-nowrap">{log.time}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-gray-900">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${log.user === 'System' ? 'bg-gray-200 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                 {log.user.charAt(0)}
                              </div>
                              {log.user}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`font-medium ${log.action.includes('Delete') ? 'text-red-600' : log.action.includes('Edit') ? 'text-blue-600' : 'text-gray-900'}`}>
                              {log.action}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                           <span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">{log.entity}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-xs">{log.ref}</td>
                        <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{log.details}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs font-mono">{log.ip}</td>
                        <td className="px-6 py-4 text-right">
                           <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
                              log.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              log.status === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' : 
                              'bg-amber-50 text-amber-700 border-amber-200'
                           }`}>
                              {log.status === 'Success' && <CheckCircle2 className="h-3 w-3" />}
                              {log.status === 'Failed' && <AlertOctagon className="h-3 w-3" />}
                              {log.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900 transition-colors">
                              <Eye className="h-4 w-4" />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         {/* Pagination */}
         <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
           <div className="text-xs text-gray-600">Showing 1-6 of 1,247</div>
           <div className="flex items-center gap-2">
              <button className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs" disabled>Previous</button>
              <button className="px-2 py-1 rounded bg-emerald-600 text-white text-xs">1</button>
              <button className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs hover:text-gray-900 hover:bg-gray-300">2</button>
              <button className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs hover:text-gray-900 hover:bg-gray-300">Next</button>
           </div>
         </div>
      </div>
      </div>
    </div>
  );
}
