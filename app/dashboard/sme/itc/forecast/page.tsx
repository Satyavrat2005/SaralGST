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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[11px] font-semibold text-emerald-700">ITC Analytics</span>
            </div>
            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-1">ITC Forecast</h1>
            <p className="text-sm text-gray-600">Predictive analytics for next period ITC availability</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
               <select className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-3 pr-10 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
                 <option>Next 6 Months</option>
                 <option>Next Quarter</option>
                 <option>Next Year</option>
               </select>
               <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
             </div>
             <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2">
               <Settings className="h-4 w-4" /> Configure Model
             </button>
             <button className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2">
               <RefreshCw className="h-4 w-4" /> Refresh Forecast
             </button>
          </div>
        </div>
      </div>

      {/* 2. FORECAST SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-all">
           <div className="flex justify-between items-start">
             <div className="flex-1">
               <p className="text-sm text-gray-600">Predicted ITC (Dec)</p>
               <h3 className="text-3xl font-bold text-gray-900 mt-2">₹ 8,45,600</h3>
               <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium"><ArrowUpRight className="h-3 w-3" /> +2.8% vs Nov</p>
             </div>
             <div className="flex flex-col items-center gap-2">
               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                 <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.5} />
               </div>
               <div className="px-2 py-1 bg-blue-50 rounded-lg text-blue-700 font-bold text-xs border border-blue-200">
                  {confidenceLevel}%
               </div>
             </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-all">
           <div className="flex justify-between items-start">
             <div className="flex-1">
               <p className="text-sm text-gray-600">Expected Utilization</p>
               <h3 className="text-3xl font-bold text-gray-900 mt-2">₹ 8,20,000</h3>
               <p className="text-xs text-gray-500 mt-1">97% of predicted ITC</p>
             </div>
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2.5} />
             </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 shadow-lg p-6 hover:shadow-xl transition-all">
           <div className="flex justify-between items-start">
             <div className="flex-1">
               <p className="text-sm text-gray-600">At-Risk Prediction</p>
               <h3 className="text-3xl font-bold text-amber-600 mt-2">₹ 28,400</h3>
               <p className="text-xs text-gray-500 mt-1">3.4% of forecast at risk</p>
             </div>
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <AlertTriangle className="h-5 w-5 text-white" strokeWidth={2.5} />
             </div>
           </div>
        </div>
      </div>

      {/* 3. FORECAST CHART */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 h-[400px] flex flex-col">
         <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">6-Month Projection</h3>
              </div>
              <p className="text-xs text-gray-500">Historical vs predicted ITC trend</p>
            </div>
            <div className="flex gap-4 text-xs">
               <span className="flex items-center gap-2 text-gray-600 font-medium"><span className="w-3 h-1 bg-blue-500 rounded"></span>Actual</span>
               <span className="flex items-center gap-2 text-gray-600 font-medium"><span className="w-3 h-1 bg-emerald-500 rounded"></span>Forecast</span>
            </div>
         </div>
         <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                     <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" stroke="#9ca3af" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9ca3af" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}L`} domain={[6, 10]} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     itemStyle={{ fontSize: '12px', color: '#374151' }}
                     formatter={(value: number) => [`₹ ${value} L`, '']}
                  />
                  <Area type="monotone" dataKey="forecast" stroke="none" fill="url(#colorForecast)" />
                  <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={3} dot={{r:4, fill:'#3B82F6'}} activeDot={{r:6}} connectNulls />
                  <Line type="monotone" dataKey="forecast" stroke="#10B981" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{r:6}} />
               </ComposedChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* 4. DETAILED TABLE & ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
               <div className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Month-by-Month Breakdown</h3>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                     <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Month</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Predicted ITC</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Confidence</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Key Drivers</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">At-Risk</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {[
                        { m: 'Dec 2025', val: 8.45, conf: 87, drivers: 'Seasonal Volume +5%', risk: 28400 },
                        { m: 'Jan 2026', val: 8.60, conf: 85, drivers: 'New Vendor Onboarded', risk: 32100 },
                        { m: 'Feb 2026', val: 8.40, conf: 82, drivers: 'Stable Trend', risk: 15000 },
                        { m: 'Mar 2026', val: 9.10, conf: 80, drivers: 'Year-End Peak', risk: 45000 },
                     ].map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-4 text-gray-900 font-semibold">{row.m}</td>
                           <td className="px-6 py-4 text-right text-emerald-600 font-bold">₹{row.val} L</td>
                           <td className="px-6 py-4 text-center">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${row.conf > 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{row.conf}%</span>
                           </td>
                           <td className="px-6 py-4 text-gray-600 text-xs">{row.drivers}</td>
                           <td className="px-6 py-4 text-right text-red-600 font-semibold">₹{row.risk.toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Recommended Actions */}
         <div className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
               <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Recommended Actions</h3>
            </div>
            
            <div className="bg-white rounded-2xl border-l-4 border-l-red-500 border-t border-r border-b border-gray-200 shadow-lg p-5 hover:shadow-xl transition-all">
               <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">High Priority</span>
                  <span className="text-xs text-emerald-600 font-semibold">Save ₹18k</span>
               </div>
               <h4 className="font-bold text-gray-900 text-sm">Vendor Follow-up</h4>
               <p className="text-xs text-gray-600 mt-2 leading-relaxed">3 vendors historically late in Dec. Send reminders by Dec 1st.</p>
               <button className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-xs font-semibold text-red-700 hover:from-red-100 hover:to-red-200 hover:shadow-md transition-all">Execute Action</button>
            </div>

            <div className="bg-white rounded-2xl border-l-4 border-l-amber-500 border-t border-r border-b border-gray-200 shadow-lg p-5 hover:shadow-xl transition-all">
               <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Medium Priority</span>
                  <span className="text-xs text-emerald-600 font-semibold">Save ₹10k</span>
               </div>
               <h4 className="font-bold text-gray-900 text-sm">Accelerate Validation</h4>
               <p className="text-xs text-gray-600 mt-2 leading-relaxed">Year-end surge expected. Allocate extra resources.</p>
               <button className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 text-xs font-semibold text-amber-700 hover:from-amber-100 hover:to-amber-200 hover:shadow-md transition-all">Assign Team</button>
            </div>
         </div>
      </div>
    </div>
    </div>
  );
}
