'use client';

import React from 'react';
import { 
  BarChart3, 
  ShieldCheck, 
  FileText, 
  Download, 
  Calendar,
  ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Mock Data
const complianceTrend = [
  { month: 'Jun', score: 82 },
  { month: 'Jul', score: 84 },
  { month: 'Aug', score: 85 },
  { month: 'Sep', score: 86 },
  { month: 'Oct', score: 84 },
  { month: 'Nov', score: 87 },
];

const invoiceVolume = [
  { month: 'Jun', count: 750, amount: 42 },
  { month: 'Jul', count: 820, amount: 45 },
  { month: 'Aug', count: 780, amount: 43 },
  { month: 'Sep', count: 823, amount: 45.6 },
  { month: 'Oct', count: 900, amount: 50 },
  { month: 'Nov', count: 950, amount: 52 },
];

export default function VendorReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <BarChart3 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vendor Reports</h1>
          <p className="text-gray-600 text-sm mt-1">Analyze vendor performance and compliance trends</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium">
             <Calendar className="h-4 w-4" /> Schedule Report
           </button>
           <button className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2">
             <Download className="h-4 w-4" /> Download PDF
           </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-600 font-semibold">Avg Compliance</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">87% <span className="text-xs text-emerald-600 font-semibold">+3%</span></p>
         </div>
         <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-600 font-semibold">On-time Filing</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">82% <span className="text-xs text-red-600 font-semibold">-2%</span></p>
         </div>
         <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-600 font-semibold">Invoice Accuracy</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">94% <span className="text-xs text-emerald-600 font-semibold">+1%</span></p>
         </div>
         <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-600 font-semibold">ITC Secured</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹45.6L</p>
         </div>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                  <ShieldCheck className="h-6 w-6" />
               </div>
               <div>
                  <h3 className="font-bold text-gray-900">Compliance Report</h3>
                  <p className="text-xs text-gray-600 mt-1">Risk assessment & scoring</p>
               </div>
            </div>
         </div>
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 cursor-pointer hover:border-emerald-200 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-xl bg-gray-100 text-gray-600">
                  <Calendar className="h-6 w-6" />
               </div>
               <div>
                  <h3 className="font-bold text-gray-900">Filing Performance</h3>
                  <p className="text-xs text-gray-600 mt-1">Timeliness analysis</p>
               </div>
            </div>
         </div>
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 cursor-pointer hover:border-emerald-200 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-xl bg-gray-100 text-gray-600">
                  <FileText className="h-6 w-6" />
               </div>
               <div>
                  <h3 className="font-bold text-gray-900">Invoice Analytics</h3>
                  <p className="text-xs text-gray-600 mt-1">Volume & error trends</p>
               </div>
            </div>
         </div>
      </div>

      {/* Main Report Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Compliance Trend (6 Months)</h3>
            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={complianceTrend}>
                     <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                     <XAxis dataKey="month" stroke="#9ca3af" tick={{fill: '#6b7280', fontSize: 12}} />
                     <YAxis stroke="#9ca3af" tick={{fill: '#6b7280', fontSize: 12}} domain={[0, 100]} />
                     <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#111' }} />
                     <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Invoice Volume Growth</h3>
            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={invoiceVolume}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                     <XAxis dataKey="month" stroke="#9ca3af" tick={{fill: '#6b7280', fontSize: 12}} />
                     <YAxis stroke="#9ca3af" tick={{fill: '#6b7280', fontSize: 12}} />
                     <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#111' }} />
                     <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
    </div>
  );
}
