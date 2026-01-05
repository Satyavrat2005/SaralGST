'use client';

import React, { useState } from 'react';
import { 
  TrendingDown, 
  AlertOctagon, 
  XCircle, 
  Calendar, 
  Download, 
  RefreshCw, 
  Info,
  Clock,
  ChevronRight,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Mock Data
const lossBreakdown = [
  { name: 'Vendor Non-Filing', value: 27116, color: '#EF4444', count: 18 },
  { name: 'Time Limit Expired', value: 16947, color: '#F97316', count: 12 },
  { name: 'Validation Failures', value: 10168, color: '#EAB308', count: 8 },
  { name: 'Blocked Credits', value: 8135, color: '#8B5CF6', count: 6 },
  { name: 'Invoice Rejections', value: 5423, color: '#71717A', count: 4 },
];

const lossInvoices = [
  { id: 'INV-001234', date: '15 Apr 2025', vendor: 'XYZ Suppliers', gstin: '27XYZAB1234C1Z5', amount: 45600, itcLost: 8208, cause: 'Vendor Non-Filing', lossDate: '11 Jun 2025', status: 'Recoverable', recoverable: true },
  { id: 'INV-001235', date: '10 Mar 2025', vendor: 'Alpha Tech', gstin: '29ABCDE1234F1Z5', amount: 12000, itcLost: 2160, cause: 'Time Limit Expired', lossDate: '30 Nov 2025', status: 'Permanent', recoverable: false },
  { id: 'INV-001236', date: '20 May 2025', vendor: 'Beta Retail', gstin: '19PQRST5678H1Z2', amount: 85000, itcLost: 15300, cause: 'Validation Failed', lossDate: '25 May 2025', status: 'Recoverable', recoverable: true },
];

export default function ITCLossAnalysisPage() {
  const [selectedLoss, setSelectedLoss] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full mb-3">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[11px] font-semibold text-red-700">Loss Prevention</span>
            </div>
            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-1">ITC Loss Analysis</h1>
            <p className="text-sm text-gray-600">Identify why ITC was lost and prevent future losses</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
               <select className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-9 pr-10 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
                 <option>Last 6 Months</option>
                 <option>This Financial Year</option>
                 <option>Custom Range</option>
               </select>
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
             </div>
             <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2">
               <Download className="h-4 w-4" /> Loss Report
             </button>
             <button className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2">
               <Clock className="h-4 w-4" /> Schedule Prevention
             </button>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-6 hover:shadow-xl transition-all">
           <div className="flex justify-between items-start">
             <div className="flex-1">
               <p className="text-sm text-gray-600">Total ITC Lost</p>
               <h3 className="text-3xl font-bold text-red-600 mt-2">₹ 67,790</h3>
               <p className="text-xs text-gray-500 mt-1">5.8% of total eligible ITC</p>
             </div>
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
               <TrendingDown className="h-5 w-5 text-white" strokeWidth={2.5} />
             </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 shadow-lg p-6 hover:shadow-xl transition-all">
           <div className="flex justify-between items-start">
             <div className="flex-1">
               <p className="text-sm text-gray-600">Recoverable Loss</p>
               <h3 className="text-3xl font-bold text-amber-600 mt-2">₹ 24,500</h3>
               <p className="text-xs text-gray-500 mt-1">36% of total loss</p>
             </div>
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
               <RefreshCw className="h-5 w-5 text-white" strokeWidth={2.5} />
             </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-all">
           <div className="flex justify-between items-start">
             <div className="flex-1">
               <p className="text-sm text-gray-600">Permanent Loss</p>
               <h3 className="text-3xl font-bold text-gray-700 mt-2">₹ 43,290</h3>
               <p className="text-xs text-gray-500 mt-1">Written off in books</p>
             </div>
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg shadow-gray-500/30">
               <XCircle className="h-5 w-5 text-white" strokeWidth={2.5} />
             </div>
           </div>
        </div>
      </div>

      {/* 3. CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg lg:col-span-1 p-6 flex flex-col justify-center items-center">
            <div className="flex items-center gap-2 mb-4">
               <div className="h-1 w-1 bg-red-500 rounded-full"></div>
               <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Loss by Root Cause</h3>
            </div>
            <div className="h-64 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={lossBreakdown}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                     >
                        {lossBreakdown.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        itemStyle={{color: '#374151'}} 
                        formatter={(value: number) => `₹${value.toLocaleString()}`}
                     />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                     <p className="text-xs text-gray-500 font-medium">Total Loss</p>
                     <p className="text-xl font-bold text-gray-900">₹67.8k</p>
                  </div>
               </div>
            </div>
            <div className="w-full space-y-2 mt-4">
               {lossBreakdown.map((item) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                        <span className="text-gray-700 font-medium">{item.name}</span>
                     </div>
                     <span className="text-gray-600 font-semibold">₹{item.value.toLocaleString()} ({item.count})</span>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg lg:col-span-2 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
               <div className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-red-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Detailed Loss Register</h3>
               </div>
               <button className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">View All</button>
            </div>
            <div className="flex-1 overflow-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 sticky top-0">
                     <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice Details</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">ITC Lost</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Root Cause</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Status</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {lossInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSelectedLoss(inv)}>
                           <td className="px-6 py-4">
                              <p className="text-gray-900 font-semibold">{inv.vendor}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{inv.id} • {inv.date}</p>
                           </td>
                           <td className="px-6 py-4 text-right font-bold text-red-600">₹{inv.itcLost.toLocaleString()}</td>
                           <td className="px-6 py-4">
                              <span className="text-sm text-gray-700 font-medium">{inv.cause}</span>
                              <p className="text-[10px] text-gray-500">Date: {inv.lossDate}</p>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${inv.recoverable ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                 {inv.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"><ChevronRight className="h-4 w-4" /></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* 4. INSIGHTS PANEL */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
         <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
               <Info className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
               <div className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Automated Prevention Insights</h3>
               </div>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-100 flex items-start gap-4 hover:shadow-md transition-all">
               <div className="mt-1 w-14 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                  <AlertOctagon className="h-4 w-4 text-white" strokeWidth={3} />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-gray-900">Top Loss Contributor</h4>
                  <p className="text-sm text-gray-600 mt-1">
                     3 vendors account for <span className="text-gray-900 font-semibold">45% (₹30,500)</span> of total loss. Consider stricter payment terms for XYZ Suppliers.
                  </p>
               </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 flex items-start gap-4 hover:shadow-md transition-all">
               <div className="mt-1 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                  <Clock className="h-4 w-14 text-white" strokeWidth={3} />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-gray-900">Timing Issue Detected</h4>
                  <p className="text-sm text-gray-600 mt-1">
                     25% of losses are due to delayed validation (avg 15 days). Reducing this to 5 days could save <span className="text-gray-900 font-semibold">₹12,000/year</span>.
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* LOSS DETAIL MODAL */}
      {selectedLoss && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-gray-200">
               <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-lg font-bold text-gray-900">Loss Details: {selectedLoss.id}</h2>
                  <button onClick={() => setSelectedLoss(null)} className="text-gray-400 hover:text-gray-700 transition-colors"><XCircle className="h-5 w-5" /></button>
               </div>
               <div className="p-6 space-y-6 bg-white">
                  {/* Timeline */}
                  <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
                     <div className="relative">
                        <div className="absolute -left-[29px] top-0 h-3 w-3 rounded-full bg-gray-400 border-2 border-white shadow-sm"></div>
                        <p className="text-xs text-gray-500 font-medium">15 Apr 2025</p>
                        <p className="text-sm text-gray-900 font-semibold">Invoice Received</p>
                     </div>
                     <div className="relative">
                        <div className="absolute -left-[29px] top-0 h-3 w-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                        <p className="text-xs text-gray-500 font-medium">15 May 2025</p>
                        <p className="text-sm text-gray-900 font-semibold">Reminder Sent via WhatsApp</p>
                     </div>
                     <div className="relative">
                        <div className="absolute -left-[29px] top-0 h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                        <p className="text-xs text-gray-500 font-medium">11 Jun 2025</p>
                        <p className="text-sm text-red-600 font-bold">Loss Confirmed: Vendor Non-Filing</p>
                     </div>
                  </div>

                  {/* Impact */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                     <h4 className="text-xs text-gray-600 uppercase font-semibold mb-3 tracking-wider">Financial Impact</h4>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 font-medium">ITC Lost</span>
                        <span className="text-lg font-bold text-red-600">₹ {selectedLoss.itcLost.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-700 font-medium">Recovery Probability</span>
                        <span className="text-sm font-semibold text-gray-900">Low (5%)</span>
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end">
                     <button className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all">Write Off</button>
                     <button className="btn-primary-custom px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all">Download Certificate</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
    </div>
  );
}
