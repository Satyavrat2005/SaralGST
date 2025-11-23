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
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vendor Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Analyze vendor performance and compliance trends</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Calendar className="h-4 w-4" /> Schedule Report
           </button>
           <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
             <Download className="h-4 w-4" /> Download PDF
           </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5">
            <p className="text-xs text-zinc-500">Avg Compliance</p>
            <p className="text-2xl font-bold text-white mt-1">87% <span className="text-xs text-emerald-500 font-normal">+3%</span></p>
         </div>
         <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5">
            <p className="text-xs text-zinc-500">On-time Filing</p>
            <p className="text-2xl font-bold text-white mt-1">82% <span className="text-xs text-red-500 font-normal">-2%</span></p>
         </div>
         <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5">
            <p className="text-xs text-zinc-500">Invoice Accuracy</p>
            <p className="text-2xl font-bold text-white mt-1">94% <span className="text-xs text-emerald-500 font-normal">+1%</span></p>
         </div>
         <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5">
            <p className="text-xs text-zinc-500">ITC Secured</p>
            <p className="text-2xl font-bold text-white mt-1">₹45.6L</p>
         </div>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <BentoCard className="cursor-pointer border-primary/50 bg-primary/5">
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-lg bg-primary/20 text-primary">
                  <ShieldCheck className="h-6 w-6" />
               </div>
               <div>
                  <h3 className="font-bold text-white">Compliance Report</h3>
                  <p className="text-xs text-zinc-400 mt-1">Risk assessment & scoring</p>
               </div>
            </div>
         </BentoCard>
         <BentoCard className="cursor-pointer hover:border-white/20">
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-lg bg-zinc-800 text-zinc-400">
                  <Calendar className="h-6 w-6" />
               </div>
               <div>
                  <h3 className="font-bold text-white">Filing Performance</h3>
                  <p className="text-xs text-zinc-400 mt-1">Timeliness analysis</p>
               </div>
            </div>
         </BentoCard>
         <BentoCard className="cursor-pointer hover:border-white/20">
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-lg bg-zinc-800 text-zinc-400">
                  <FileText className="h-6 w-6" />
               </div>
               <div>
                  <h3 className="font-bold text-white">Invoice Analytics</h3>
                  <p className="text-xs text-zinc-400 mt-1">Volume & error trends</p>
               </div>
            </div>
         </BentoCard>
      </div>

      {/* Main Report Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
         <GlassPanel className="p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-6">Compliance Trend (6 Months)</h3>
            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={complianceTrend}>
                     <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                     <XAxis dataKey="month" stroke="#666" tick={{fill: '#9ca3af', fontSize: 12}} />
                     <YAxis stroke="#666" tick={{fill: '#9ca3af', fontSize: 12}} domain={[0, 100]} />
                     <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} />
                     <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </GlassPanel>

         <GlassPanel className="p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-6">Invoice Volume Growth</h3>
            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={invoiceVolume}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                     <XAxis dataKey="month" stroke="#666" tick={{fill: '#9ca3af', fontSize: 12}} />
                     <YAxis stroke="#666" tick={{fill: '#9ca3af', fontSize: 12}} />
                     <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', color: '#fff' }} />
                     <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </GlassPanel>
      </div>
    </div>
  );
}
