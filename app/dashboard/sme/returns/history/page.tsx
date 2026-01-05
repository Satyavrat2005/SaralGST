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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <FileText className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Archive</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Filing History</h1>
          <p className="text-gray-600 text-sm mt-1">Archive of all submitted GST returns</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium">
             <Download className="h-4 w-4" /> Bulk Download
           </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
         <select className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl p-2.5 cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
            <option>FY 2025-26</option>
            <option>FY 2024-25</option>
         </select>
         <select className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl p-2.5 cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
            <option>All Return Types</option>
            <option>GSTR-1</option>
            <option>GSTR-3B</option>
         </select>
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input type="text" placeholder="Search by ARN..." className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full transition-all" />
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <tr>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Period</th>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Return Type</th>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Filed Date</th>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">ARN</th>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Tax Liability</th>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                     <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filingHistory.map((row, i) => (
                     <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">{row.period}</td>
                        <td className="px-4 py-3">
                           <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${row.type === 'GSTR-1' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                              {row.type}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{row.filedDate}</td>
                        <td className="px-4 py-3 font-mono text-gray-700 text-xs whitespace-nowrap">{row.arn}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-semibold whitespace-nowrap text-xs">₹{row.liability.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                           <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${row.status === 'Filed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {row.status === 'Filed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              {row.status}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                           <div className="flex items-center justify-end gap-1">
                              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all" title="Download JSON"><FileText className="h-4 w-4" /></button>
                              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all" title="Download Receipt"><Download className="h-4 w-4" /></button>
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
