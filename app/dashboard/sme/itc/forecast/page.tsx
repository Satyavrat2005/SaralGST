'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  RefreshCw, 
  Download, 
  Settings, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  ComposedChart, 
  Bar 
} from 'recharts';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Mock Forecast Data
const forecastData = [
  { month: 'Jun', actual: 7.45, forecast: 7.40, confidence: [7.3, 7.5] },
  { month: 'Jul', actual: 7.80, forecast: 7.75, confidence: [7.6, 7.9] },
  { month: 'Aug', actual: 8.10, forecast: 8.00, confidence: [7.9, 8.2] },
  { month: 'Sep', actual: 7.95, forecast: 8.05, confidence: [7.8, 8.2] },
  { month: 'Oct', actual: 8.05, forecast: 8.10, confidence: [7.9, 8.3] },
  { month: 'Nov', actual: 8.22, forecast: 8.15, confidence: [8.0, 8.4] },
  { month: 'Dec', actual: null, forecast: 8.45, confidence: [8.2, 8.7] },
  { month: 'Jan', actual: null, forecast: 8.60, confidence: [8.3, 8.9] },
  { month: 'Feb', actual: null, forecast: 8.40, confidence: [8.1, 8.7] },
  { month: 'Mar', actual: null, forecast: 9.10, confidence: [8.8, 9.4] }, // Peak
  { month: 'Apr', actual: null, forecast: 8.30, confidence: [8.0, 8.6] },
  { month: 'May', actual: null, forecast: 8.50, confidence: [8.2, 8.8] },
];

export default function ITCForecastPage() {
  const [confidenceLevel, setConfidenceLevel] = useState(87);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ITC Forecast</h1>
          <p className="text-muted-foreground text-sm mt-1">Predictive analytics for next period ITC availability</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-zinc-900 border border-white/10 text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-1 focus:ring-primary outline-none text-zinc-300 cursor-pointer hover:bg-zinc-800">
               <option>Next 6 Months</option>
               <option>Next Quarter</option>
               <option>Next Year</option>
             </select>
             <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
           </div>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Settings className="h-4 w-4" /> Configure Model
           </button>
           <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
             <RefreshCw className="h-4 w-4" /> Refresh Forecast
           </button>
        </div>
      </div>

      {/* 2. FORECAST SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard className="p-6">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-muted-foreground">Predicted ITC (Dec)</p>
               <h3 className="text-3xl font-bold text-white mt-2">₹ 8,45,600</h3>
               <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> +2.8% vs Nov</p>
             </div>
             <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 font-bold text-xs border border-blue-500/20">
                {confidenceLevel}% Conf.
             </div>
           </div>
        </BentoCard>

        <BentoCard className="p-6">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-muted-foreground">Expected Utilization</p>
               <h3 className="text-3xl font-bold text-white mt-2">₹ 8,20,000</h3>
               <p className="text-xs text-zinc-500 mt-1">97% of predicted ITC</p>
             </div>
             <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <TrendingUp className="h-5 w-5" />
             </div>
           </div>
        </BentoCard>

        <BentoCard className="p-6 border-amber-500/30 bg-amber-500/5">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-amber-400/80">At-Risk Prediction</p>
               <h3 className="text-3xl font-bold text-amber-500 mt-2">₹ 28,400</h3>
               <p className="text-xs text-zinc-500 mt-1">3.4% of forecast at risk</p>
             </div>
             <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                <AlertTriangle className="h-5 w-5" />
             </div>
           </div>
        </BentoCard>
      </div>

      {/* 3. FORECAST CHART */}
      <GlassPanel className="p-6 h-[400px] flex flex-col">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">6-Month Projection</h3>
            <div className="flex gap-4 text-xs">
               <span className="flex items-center gap-2 text-zinc-400"><span className="w-3 h-1 bg-blue-500 rounded"></span>Actual</span>
               <span className="flex items-center gap-2 text-zinc-400"><span className="w-3 h-1 bg-emerald-500 border-dashed border-b-2"></span>Forecast</span>
            </div>
         </div>
         <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                     <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="month" stroke="#666" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}L`} domain={[6, 10]} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', borderRadius: '8px' }}
                     itemStyle={{ fontSize: '12px' }}
                     formatter={(value: number) => [`₹ ${value} L`, '']}
                  />
                  <Area type="monotone" dataKey="forecast" stroke="none" fill="url(#colorForecast)" />
                  <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={3} dot={{r:4, fill:'#3B82F6'}} activeDot={{r:6}} connectNulls />
                  <Line type="monotone" dataKey="forecast" stroke="#10B981" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{r:6}} />
               </ComposedChart>
            </ResponsiveContainer>
         </div>
      </GlassPanel>

      {/* 4. DETAILED TABLE & ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <GlassPanel className="lg:col-span-2 p-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5">
               <h3 className="font-semibold text-white">Month-by-Month Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-zinc-500 font-medium">
                     <tr>
                        <th className="px-6 py-3">Month</th>
                        <th className="px-6 py-3 text-right">Predicted ITC</th>
                        <th className="px-6 py-3 text-center">Confidence</th>
                        <th className="px-6 py-3">Key Drivers</th>
                        <th className="px-6 py-3 text-right">At-Risk</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {[
                        { m: 'Dec 2025', val: 8.45, conf: 87, drivers: 'Seasonal Volume +5%', risk: 28400 },
                        { m: 'Jan 2026', val: 8.60, conf: 85, drivers: 'New Vendor Onboarded', risk: 32100 },
                        { m: 'Feb 2026', val: 8.40, conf: 82, drivers: 'Stable Trend', risk: 15000 },
                        { m: 'Mar 2026', val: 9.10, conf: 80, drivers: 'Year-End Peak', risk: 45000 },
                     ].map((row, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4 text-white font-medium">{row.m}</td>
                           <td className="px-6 py-4 text-right text-emerald-400 font-bold">₹{row.val} L</td>
                           <td className="px-6 py-4 text-center">
                              <span className={`text-xs px-2 py-1 rounded ${row.conf > 85 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{row.conf}%</span>
                           </td>
                           <td className="px-6 py-4 text-zinc-400 text-xs">{row.drivers}</td>
                           <td className="px-6 py-4 text-right text-red-400 font-mono">₹{row.risk.toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </GlassPanel>

         {/* Recommended Actions */}
         <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Recommended Actions (Dec)</h3>
            <BentoCard className="border-l-4 border-l-red-500">
               <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">High Priority</span>
                  <span className="text-xs text-zinc-500">Save ₹18k</span>
               </div>
               <h4 className="font-bold text-white text-sm">Vendor Follow-up</h4>
               <p className="text-xs text-zinc-400 mt-1">3 vendors historically late in Dec. Send reminders by Dec 1st.</p>
               <button className="mt-3 w-full py-1.5 rounded bg-zinc-800 text-xs font-medium text-white hover:bg-zinc-700">Execute</button>
            </BentoCard>

            <BentoCard className="border-l-4 border-l-amber-500">
               <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Medium Priority</span>
                  <span className="text-xs text-zinc-500">Save ₹10k</span>
               </div>
               <h4 className="font-bold text-white text-sm">Accelerate Validation</h4>
               <p className="text-xs text-zinc-400 mt-1">Year-end surge expected. Allocate extra resources.</p>
               <button className="mt-3 w-full py-1.5 rounded bg-zinc-800 text-xs font-medium text-white hover:bg-zinc-700">Assign Team</button>
            </BentoCard>
         </div>
      </div>
    </div>
  );
}
