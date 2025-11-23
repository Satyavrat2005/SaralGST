'use client';

import React from 'react';
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  AlertOctagon, 
  CheckCircle2, 
  ArrowRight,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock Data
const operationalMetrics = [
  { month: 'Jun', score: 82 },
  { month: 'Jul', score: 84 },
  { month: 'Aug', score: 85 },
  { month: 'Sep', score: 86 },
  { month: 'Oct', score: 84 },
  { month: 'Nov', score: 87 },
];

const filingTimeline = [
  { month: 'Apr', gstr1: 'On Time', gstr3b: 'On Time', gstr2b: 'Done' },
  { month: 'May', gstr1: 'On Time', gstr3b: 'On Time', gstr2b: 'Done' },
  { month: 'Jun', gstr1: 'On Time', gstr3b: 'On Time', gstr2b: 'Done' },
  { month: 'Jul', gstr1: 'On Time', gstr3b: 'On Time', gstr2b: 'Done' },
  { month: 'Aug', gstr1: 'Late', gstr3b: 'On Time', gstr2b: 'Done' },
  { month: 'Sep', gstr1: 'On Time', gstr3b: 'On Time', gstr2b: 'Done' },
  { month: 'Oct', gstr1: 'On Time', gstr3b: 'On Time', gstr2b: 'Done' },
  { month: 'Nov', gstr1: 'Draft', gstr3b: 'Draft', gstr2b: 'Done' },
  { month: 'Dec', gstr1: 'Due', gstr3b: 'Due', gstr2b: 'Due' },
  { month: 'Jan', gstr1: '-', gstr3b: '-', gstr2b: '-' },
  { month: 'Feb', gstr1: '-', gstr3b: '-', gstr2b: '-' },
  { month: 'Mar', gstr1: '-', gstr3b: '-', gstr2b: '-' },
];

export default function ComplianceDashboardPage() {
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'On Time': return 'bg-emerald-500';
      case 'Done': return 'bg-emerald-500';
      case 'Late': return 'bg-amber-500';
      case 'Draft': return 'bg-blue-500 animate-pulse';
      case 'Due': return 'bg-zinc-500 border-2 border-dashed border-zinc-400 bg-transparent';
      default: return 'bg-zinc-800';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Compliance Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overall GST compliance health and filing status tracking</p>
        </div>
        <div className="flex items-center gap-3">
           <select className="bg-zinc-900 border border-white/10 text-sm rounded-lg p-2 text-zinc-300 focus:ring-1 focus:ring-primary outline-none cursor-pointer hover:bg-zinc-800">
             <option>FY 2025-26</option>
             <option>FY 2024-25</option>
           </select>
           <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
             <Activity className="h-4 w-4" /> Improvement Plan
           </button>
        </div>
      </div>

      {/* 2. HEALTH SCORE CARD */}
      <GlassPanel className="p-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
         <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            
            {/* Score Circle */}
            <div className="relative flex items-center justify-center h-48 w-48">
               <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-zinc-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" strokeDasharray="87, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-white">87</span>
                  <span className="text-xs text-emerald-400 font-medium mt-1">Good</span>
               </div>
            </div>

            {/* Breakdown */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-12">
               <div>
                  <p className="text-xs text-zinc-500 uppercase mb-1">Filing Timeliness</p>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-1">
                     <div className="h-full bg-emerald-500 w-[92%]"></div>
                  </div>
                  <p className="text-sm font-bold text-white">92/100</p>
               </div>
               <div>
                  <p className="text-xs text-zinc-500 uppercase mb-1">Reconciliation</p>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-1">
                     <div className="h-full bg-emerald-500 w-[88%]"></div>
                  </div>
                  <p className="text-sm font-bold text-white">88/100</p>
               </div>
               <div>
                  <p className="text-xs text-zinc-500 uppercase mb-1">ITC Management</p>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-1">
                     <div className="h-full bg-amber-500 w-[85%]"></div>
                  </div>
                  <p className="text-sm font-bold text-white">85/100</p>
               </div>
               <div>
                  <p className="text-xs text-zinc-500 uppercase mb-1">Vendor Score</p>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-1">
                     <div className="h-full bg-amber-500 w-[82%]"></div>
                  </div>
                  <p className="text-sm font-bold text-white">82/100</p>
               </div>
               <div>
                  <p className="text-xs text-zinc-500 uppercase mb-1">Data Accuracy</p>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-1">
                     <div className="h-full bg-emerald-500 w-[90%]"></div>
                  </div>
                  <p className="text-sm font-bold text-white">90/100</p>
               </div>
            </div>

            {/* Benchmark */}
            <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl min-w-[200px]">
               <p className="text-xs text-zinc-500 mb-2">Industry Benchmark</p>
               <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">75</span>
                  <span className="text-xs text-emerald-500 mb-1 flex items-center"><ArrowUpRight className="h-3 w-3" /> +12</span>
               </div>
               <p className="text-[10px] text-zinc-400 mt-2">You are in the top 15% of your peer group.</p>
            </div>
         </div>
      </GlassPanel>

      {/* 3. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <BentoCard title="GSTR-1 Status">
            <div className="mt-2">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold text-lg">Filed</span>
                  <span className="text-xs text-zinc-500">Last: 10 Nov</span>
               </div>
               <div className="flex gap-1">
                  {[1,1,1,1,2,1,1,0].map((status, i) => ( // 1=good, 2=late, 0=future
                     <div key={i} className={`h-8 flex-1 rounded-sm ${status === 1 ? 'bg-emerald-500' : status === 2 ? 'bg-amber-500' : 'bg-zinc-800'}`}></div>
                  ))}
               </div>
               <p className="text-xs text-amber-500 mt-2 flex items-center gap-1"><AlertOctagon className="h-3 w-3" /> 1 Late Filing (Aug)</p>
            </div>
         </BentoCard>

         <BentoCard title="GSTR-3B Status">
            <div className="mt-2">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold text-lg">100% On-Time</span>
                  <span className="text-xs text-zinc-500">Next: 20 Dec</span>
               </div>
               <div className="flex gap-1">
                  {[1,1,1,1,1,1,1,0].map((status, i) => (
                     <div key={i} className={`h-8 flex-1 rounded-sm ${status === 1 ? 'bg-emerald-500' : 'bg-zinc-800'}`}></div>
                  ))}
               </div>
               <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Perfect Streak</p>
            </div>
         </BentoCard>

         <BentoCard title="Reconciliation Rate">
            <div className="flex items-center gap-4 h-24">
               <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={operationalMetrics}>
                        <Bar dataKey="score" fill="#10B981" radius={[2,2,0,0]} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
               <div className="text-right">
                  <p className="text-2xl font-bold text-white">92%</p>
                  <p className="text-xs text-zinc-500">Avg Match Rate</p>
                  <p className="text-xs text-emerald-500 mt-1">Target: 95%</p>
               </div>
            </div>
         </BentoCard>
      </div>

      {/* 4. FILING TIMELINE */}
      <GlassPanel className="p-6">
         <h3 className="text-lg font-semibold text-white mb-6">FY 2025-26 Filing Timeline</h3>
         <div className="overflow-x-auto pb-2">
            <div className="min-w-[800px] grid grid-cols-[100px_repeat(12,1fr)] gap-y-4 gap-x-2 text-center">
               {/* Header Row */}
               <div className="text-left font-medium text-zinc-400 text-sm">Return</div>
               {filingTimeline.map(m => (
                  <div key={m.month} className="text-xs text-zinc-500 font-medium uppercase">{m.month}</div>
               ))}

               {/* GSTR-1 Row */}
               <div className="text-left font-medium text-white text-sm flex items-center">GSTR-1</div>
               {filingTimeline.map((m, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer">
                     <div className={`h-4 w-4 rounded-full ${getStatusColor(m.gstr1)} transition-transform group-hover:scale-125`}></div>
                     <span className="text-[10px] text-zinc-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity absolute mt-5 bg-zinc-900 px-2 py-1 rounded border border-white/10 z-10 whitespace-nowrap">{m.gstr1}</span>
                  </div>
               ))}

               {/* GSTR-3B Row */}
               <div className="text-left font-medium text-white text-sm flex items-center">GSTR-3B</div>
               {filingTimeline.map((m, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer">
                     <div className={`h-4 w-4 rounded-full ${getStatusColor(m.gstr3b)} transition-transform group-hover:scale-125`}></div>
                  </div>
               ))}

               {/* GSTR-2B Row */}
               <div className="text-left font-medium text-white text-sm flex items-center">GSTR-2B</div>
               {filingTimeline.map((m, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer">
                     <div className={`h-4 w-4 rounded-full ${getStatusColor(m.gstr2b)} transition-transform group-hover:scale-125`}></div>
                  </div>
               ))}
            </div>
         </div>
         <div className="mt-6 flex gap-6 text-xs text-zinc-400 justify-end">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> On Time</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> Late</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> In Progress</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-dashed border-zinc-500 rounded-full"></div> Upcoming</div>
         </div>
      </GlassPanel>

      {/* 5. DETAILED METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <GlassPanel className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5">
               <h3 className="font-semibold text-white">Filing Performance</h3>
            </div>
            <table className="w-full text-left text-sm">
               <thead className="bg-zinc-900/50 text-zinc-500 font-medium">
                  <tr>
                     <th className="px-4 py-3">Month</th>
                     <th className="px-4 py-3">GSTR-1</th>
                     <th className="px-4 py-3">GSTR-3B</th>
                     <th className="px-4 py-3 text-right">Tax Paid</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {[
                     { m: 'Oct 2025', g1: '10 Nov', g3: '18 Nov', tax: 400081 },
                     { m: 'Sep 2025', g1: '10 Oct', g3: '20 Oct', tax: 385600 },
                     { m: 'Aug 2025', g1: '13 Sep (Late)', g3: '20 Sep', tax: 412000 },
                  ].map((row, i) => (
                     <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{row.m}</td>
                        <td className="px-4 py-3 text-zinc-400">{row.g1}</td>
                        <td className="px-4 py-3 text-zinc-400">{row.g3}</td>
                        <td className="px-4 py-3 text-right font-mono text-white">₹{row.tax.toLocaleString()}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </GlassPanel>

         <GlassPanel className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5">
               <h3 className="font-semibold text-white">Operational Metrics</h3>
            </div>
            <table className="w-full text-left text-sm">
               <thead className="bg-zinc-900/50 text-zinc-500 font-medium">
                  <tr>
                     <th className="px-4 py-3">Month</th>
                     <th className="px-4 py-3">Invoices</th>
                     <th className="px-4 py-3">Reco Rate</th>
                     <th className="px-4 py-3 text-right">ITC Lost</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {[
                     { m: 'Oct 2025', inv: 1247, rate: '92%', lost: 8200 },
                     { m: 'Sep 2025', inv: 1150, rate: '90%', lost: 9500 },
                     { m: 'Aug 2025', inv: 1080, rate: '88%', lost: 12400 },
                  ].map((row, i) => (
                     <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{row.m}</td>
                        <td className="px-4 py-3 text-zinc-400">{row.inv}</td>
                        <td className="px-4 py-3 text-zinc-400">{row.rate}</td>
                        <td className="px-4 py-3 text-right font-mono text-red-400">₹{row.lost.toLocaleString()}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </GlassPanel>
      </div>

    </div>
  );
}
