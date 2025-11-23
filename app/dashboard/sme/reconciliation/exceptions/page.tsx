'use client';

import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertOctagon, 
  Clock, 
  Download, 
  RefreshCw, 
  Zap, 
  TrendingUp, 
  Users, 
  CheckSquare
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Mock Data
const vendorExceptionData = [
  { name: 'ABC Ent', gstr2b: 10, books: 6, value: 2, total: 18 },
  { name: 'XYZ Supp', gstr2b: 5, books: 5, value: 2, total: 12 },
  { name: 'LMN Trad', gstr2b: 2, books: 6, value: 1, total: 9 },
  { name: 'PQR Ind', gstr2b: 6, books: 0, value: 1, total: 7 },
  { name: 'Alpha Sys', gstr2b: 0, books: 5, value: 0, total: 5 },
];

const categoryData = [
  { name: 'Missing in Books', value: 34, color: '#F97316' }, // Orange
  { name: 'Missing in GSTR-2B', value: 23, color: '#EF4444' }, // Red
  { name: 'Value Mismatch', value: 10, color: '#EAB308' }, // Yellow
];

export default function ExceptionDashboardPage() {
  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Exception Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Visual analysis of reconciliation discrepancies</p>
        </div>
        <div className="flex items-center gap-3">
           <select className="bg-zinc-900 border border-white/10 text-sm rounded-lg p-2 text-zinc-300 focus:ring-1 focus:ring-primary outline-none">
             <option>This Month</option>
             <option>Last Month</option>
             <option>Last 3 Months</option>
           </select>
           <button className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800">
             <RefreshCw className="h-4 w-4" />
           </button>
           <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
             <Download className="h-4 w-4" /> Download Analysis
           </button>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <BentoCard>
            <div className="flex flex-col h-full justify-between">
               <div className="flex justify-between items-start">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Exceptions</p>
                  <span className="text-emerald-500 text-xs flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded"><ArrowDownRight className="h-3 w-3 mr-1" /> 5</span>
               </div>
               <div>
                  <h3 className="text-3xl font-bold text-white mt-2">67</h3>
                  <p className="text-xs text-zinc-500 mt-1">8% of total invoices</p>
               </div>
            </div>
         </BentoCard>

         <BentoCard>
            <div className="flex flex-col h-full justify-between">
               <div className="flex justify-between items-start">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">ITC at Risk</p>
                  <AlertOctagon className="h-4 w-4 text-red-500" />
               </div>
               <div>
                  <h3 className="text-3xl font-bold text-red-500 mt-2">₹ 3.68 L</h3>
                  <p className="text-xs text-zinc-500 mt-1">15% of eligible ITC</p>
               </div>
            </div>
         </BentoCard>

         <BentoCard className="cursor-pointer hover:border-white/20 transition-colors">
            <div className="flex flex-col h-full justify-between">
               <div className="flex justify-between items-start">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">High Priority</p>
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
               </div>
               <div>
                  <h3 className="text-3xl font-bold text-white mt-2">12</h3>
                  <p className="text-xs text-zinc-500 mt-1">Amount {'>'} ₹50k or {'>'} 30 days</p>
               </div>
            </div>
         </BentoCard>

         <BentoCard>
            <div className="flex flex-col h-full justify-between">
               <div className="flex justify-between items-start">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg Resolution</p>
                  <span className="text-emerald-500 text-xs flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded"><ArrowDownRight className="h-3 w-3 mr-1" /> 1.2 days</span>
               </div>
               <div>
                  <h3 className="text-3xl font-bold text-white mt-2">4.5 days</h3>
                  <p className="text-xs text-zinc-500 mt-1">Median time to resolve</p>
               </div>
            </div>
         </BentoCard>
      </div>

      {/* 3. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
         <GlassPanel className="p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-6">Vendor-wise Breakdown</h3>
            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendorExceptionData} layout="vertical" margin={{ left: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                     <XAxis type="number" stroke="#666" tick={{fill: '#9ca3af', fontSize: 12}} />
                     <YAxis dataKey="name" type="category" stroke="#666" tick={{fill: '#fff', fontSize: 12}} width={80} />
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', borderRadius: '8px' }}
                       itemStyle={{ fontSize: '12px' }}
                       cursor={{fill: 'rgba(255,255,255,0.05)'}}
                     />
                     <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                     <Bar dataKey="gstr2b" name="Missing GSTR-2B" stackId="a" fill="#EF4444" barSize={20} radius={[0,0,0,0]} />
                     <Bar dataKey="books" name="Missing Books" stackId="a" fill="#F97316" barSize={20} radius={[0,0,0,0]} />
                     <Bar dataKey="value" name="Value Mismatch" stackId="a" fill="#EAB308" barSize={20} radius={[0,4,4,0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </GlassPanel>

         <GlassPanel className="p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-6">Category Breakdown</h3>
            <div className="flex-1 w-full min-h-0 flex items-center">
               <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={categoryData}
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                        >
                           {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #333' }} itemStyle={{color: '#fff'}} />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="w-1/2 space-y-4">
                  {categoryData.map((item) => (
                     <div key={item.name} className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                           <div>
                              <p className="text-sm font-medium text-white">{item.name}</p>
                              <p className="text-xs text-zinc-500">{item.value} invoices</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </GlassPanel>
      </div>

      {/* 4. AI INSIGHTS PANEL */}
      <GlassPanel className="p-6">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
               <Zap className="h-5 w-5 fill-current" />
            </div>
            <h3 className="text-lg font-semibold text-white">Automated Insights & Recommendations</h3>
         </div>

         <div className="grid grid-cols-1 gap-4">
            {/* Insight 1: Priority */}
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-primary/30 transition-colors flex items-start gap-4">
               <div className="p-2 rounded-full bg-red-500/10 text-red-500 mt-1">
                  <AlertOctagon className="h-5 w-5" />
               </div>
               <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">Priority Action Needed</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                     12 high-value invoices ({'>'}₹50K) have been pending {'>'}15 days. Focus on these first to secure <span className="text-white font-medium">₹1,85,600 ITC</span>.
                  </p>
               </div>
               <button className="px-4 py-2 rounded-lg bg-red-600/10 text-red-500 text-xs font-bold hover:bg-red-600 hover:text-white transition-colors">
                  View List
               </button>
            </div>

            {/* Insight 2: Trend */}
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-primary/30 transition-colors flex items-start gap-4">
               <div className="p-2 rounded-full bg-blue-500/10 text-blue-500 mt-1">
                  <TrendingUp className="h-5 w-5" />
               </div>
               <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">Negative Trend Alert</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                     Exceptions increased by 15% this month. Top contributor: <span className="text-white font-medium">ABC Enterprises (18 issues)</span>.
                  </p>
               </div>
               <button className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-white/10 transition-colors">
                  Analyze
               </button>
            </div>

            {/* Insight 3: Quick Win */}
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-primary/30 transition-colors flex items-start gap-4">
               <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 mt-1">
                  <CheckSquare className="h-5 w-5" />
               </div>
               <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">Quick Win Identified</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                     6 invoices have rounding differences {'<'}₹10. Accept GSTR-2B values to instantly resolve these exceptions.
                  </p>
               </div>
               <button className="px-4 py-2 rounded-lg bg-emerald-600/10 text-emerald-500 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-colors">
                  Auto-Resolve
               </button>
            </div>
         </div>
      </GlassPanel>

    </div>
  );
}
