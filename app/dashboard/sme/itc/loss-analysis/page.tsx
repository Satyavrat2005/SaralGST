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
    <div className="space-y-6 pb-20">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ITC Loss Analysis</h1>
          <p className="text-muted-foreground text-sm mt-1">Identify why ITC was lost and prevent future losses</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-zinc-900 border border-white/10 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-primary outline-none text-zinc-300 cursor-pointer hover:bg-zinc-800">
               <option>Last 6 Months</option>
               <option>This Financial Year</option>
               <option>Custom Range</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
           </div>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Download className="h-4 w-4" /> Loss Report
           </button>
           <button className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-all flex items-center gap-2">
             <Clock className="h-4 w-4" /> Schedule Prevention
           </button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard className="p-6 border-red-500/30 bg-red-500/5">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-red-400/80">Total ITC Lost</p>
               <h3 className="text-3xl font-bold text-red-500 mt-2">₹ 67,790</h3>
               <p className="text-xs text-zinc-500 mt-1">5.8% of total eligible ITC</p>
             </div>
             <div className="p-2 bg-red-500/10 rounded-lg">
               <TrendingDown className="h-5 w-5 text-red-500" />
             </div>
           </div>
        </BentoCard>

        <BentoCard className="p-6 border-amber-500/30 bg-amber-500/5">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-amber-400/80">Recoverable Loss</p>
               <h3 className="text-3xl font-bold text-amber-500 mt-2">₹ 24,500</h3>
               <p className="text-xs text-zinc-500 mt-1">36% of total loss</p>
             </div>
             <div className="p-2 bg-amber-500/10 rounded-lg">
               <RefreshCw className="h-5 w-5 text-amber-500" />
             </div>
           </div>
        </BentoCard>

        <BentoCard className="p-6 bg-zinc-900/50 border border-white/5">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-zinc-400">Permanent Loss</p>
               <h3 className="text-3xl font-bold text-zinc-300 mt-2">₹ 43,290</h3>
               <p className="text-xs text-zinc-500 mt-1">Written off in books</p>
             </div>
             <div className="p-2 bg-zinc-800 rounded-lg">
               <XCircle className="h-5 w-5 text-zinc-500" />
             </div>
           </div>
        </BentoCard>
      </div>

      {/* 3. CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <GlassPanel className="lg:col-span-1 p-6 flex flex-col justify-center items-center">
            <h3 className="text-lg font-semibold text-white mb-4">Loss by Root Cause</h3>
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
                        contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #333' }} 
                        itemStyle={{color: '#fff'}} 
                        formatter={(value: number) => `₹${value.toLocaleString()}`}
                     />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                     <p className="text-xs text-zinc-500">Total Loss</p>
                     <p className="text-xl font-bold text-white">₹67.8k</p>
                  </div>
               </div>
            </div>
            <div className="w-full space-y-2 mt-4">
               {lossBreakdown.map((item) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                        <span className="text-zinc-300">{item.name}</span>
                     </div>
                     <span className="text-zinc-400 font-mono">₹{item.value.toLocaleString()} ({item.count})</span>
                  </div>
               ))}
            </div>
         </GlassPanel>

         <GlassPanel className="lg:col-span-2 p-0 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
               <h3 className="font-semibold text-white">Detailed Loss Register</h3>
               <button className="text-xs text-primary hover:underline">View All</button>
            </div>
            <div className="flex-1 overflow-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900/50 text-zinc-500 font-medium sticky top-0 backdrop-blur-sm">
                     <tr>
                        <th className="px-6 py-3">Invoice Details</th>
                        <th className="px-6 py-3 text-right">ITC Lost</th>
                        <th className="px-6 py-3">Root Cause</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {lossInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedLoss(inv)}>
                           <td className="px-6 py-4">
                              <p className="text-white font-medium">{inv.vendor}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">{inv.id} • {inv.date}</p>
                           </td>
                           <td className="px-6 py-4 text-right font-bold text-red-500 font-mono">₹{inv.itcLost.toLocaleString()}</td>
                           <td className="px-6 py-4">
                              <span className="text-sm text-zinc-300">{inv.cause}</span>
                              <p className="text-[10px] text-zinc-500">Date: {inv.lossDate}</p>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className={`text-xs px-2 py-1 rounded ${inv.recoverable ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                 {inv.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white"><ChevronRight className="h-4 w-4" /></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </GlassPanel>
      </div>

      {/* 4. INSIGHTS PANEL */}
      <GlassPanel className="p-6">
         <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
               <Info className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Automated Prevention Insights</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 flex items-start gap-4">
               <div className="mt-1 p-1.5 rounded bg-red-500/10 text-red-500"><AlertOctagon className="h-4 w-4" /></div>
               <div>
                  <h4 className="text-sm font-bold text-white">Top Loss Contributor</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                     3 vendors account for <span className="text-white font-medium">45% (₹30,500)</span> of total loss. Consider stricter payment terms for XYZ Suppliers.
                  </p>
               </div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 flex items-start gap-4">
               <div className="mt-1 p-1.5 rounded bg-amber-500/10 text-amber-500"><Clock className="h-4 w-4" /></div>
               <div>
                  <h4 className="text-sm font-bold text-white">Timing Issue Detected</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                     25% of losses are due to delayed validation (avg 15 days). Reducing this to 5 days could save <span className="text-white font-medium">₹12,000/year</span>.
                  </p>
               </div>
            </div>
         </div>
      </GlassPanel>

      {/* LOSS DETAIL MODAL */}
      {selectedLoss && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden shadow-2xl">
               <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-zinc-900">
                  <h2 className="text-lg font-bold text-white">Loss Details: {selectedLoss.id}</h2>
                  <button onClick={() => setSelectedLoss(null)} className="text-zinc-400 hover:text-white"><XCircle className="h-5 w-5" /></button>
               </div>
               <div className="p-6 space-y-6 bg-background">
                  {/* Timeline */}
                  <div className="relative pl-6 border-l border-zinc-800 space-y-6">
                     <div className="relative">
                        <div className="absolute -left-[29px] top-0 h-3 w-3 rounded-full bg-zinc-600 border-2 border-zinc-900"></div>
                        <p className="text-xs text-zinc-500">15 Apr 2025</p>
                        <p className="text-sm text-white">Invoice Received</p>
                     </div>
                     <div className="relative">
                        <div className="absolute -left-[29px] top-0 h-3 w-3 rounded-full bg-blue-500 border-2 border-zinc-900"></div>
                        <p className="text-xs text-zinc-500">15 May 2025</p>
                        <p className="text-sm text-white">Reminder Sent via WhatsApp</p>
                     </div>
                     <div className="relative">
                        <div className="absolute -left-[29px] top-0 h-3 w-3 rounded-full bg-red-500 border-2 border-zinc-900"></div>
                        <p className="text-xs text-zinc-500">11 Jun 2025</p>
                        <p className="text-sm text-red-400 font-medium">Loss Confirmed: Vendor Non-Filing</p>
                     </div>
                  </div>

                  {/* Impact */}
                  <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                     <h4 className="text-xs text-zinc-500 uppercase font-semibold mb-3">Financial Impact</h4>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-300">ITC Lost</span>
                        <span className="text-lg font-bold text-red-500">₹ {selectedLoss.itcLost.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-zinc-300">Recovery Probability</span>
                        <span className="text-sm font-medium text-white">Low (5%)</span>
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end">
                     <button className="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/5">Write Off</button>
                     <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90">Download Certificate</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
