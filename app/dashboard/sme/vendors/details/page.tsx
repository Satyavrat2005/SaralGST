'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Copy, 
  Download, 
  MoreVertical, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

export default function VendorDetailsPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'filing' | 'communication' | 'analytics'>('invoices');

  // Mock Data for Invoice Timeline
  const invoiceTimeline = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const hasInvoice = [1, 2, 4, 5, 7, 8, 11, 12, 13, 15, 18, 19, 20, 21].includes(day);
    const isMissing = day === 22;
    return { day, hasInvoice, isMissing };
  });

  return (
    <div className="space-y-6 pb-20">
      {/* 1. VENDOR HEADER */}
      <GlassPanel className="p-6">
         <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-4">
               <div>
                  <h1 className="text-3xl font-bold text-white">ABC Enterprises Pvt Ltd</h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-zinc-400">
                     <span className="font-mono bg-zinc-900 px-2 py-0.5 rounded flex items-center gap-2">
                        27ABCDE1234F1Z5 <Copy className="h-3 w-3 cursor-pointer hover:text-white" />
                     </span>
                     <span>• Maharashtra</span>
                  </div>
               </div>
               <div className="flex gap-3">
                  <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"><Phone className="h-4 w-4" /></button>
                  <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"><Mail className="h-4 w-4" /></button>
                  <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"><MessageSquare className="h-4 w-4" /></button>
               </div>
            </div>

            <div className="flex items-start gap-6">
               <div className="text-right space-y-1">
                  <div className="flex items-center justify-end gap-2">
                     <span className="text-3xl font-bold text-emerald-500">95%</span>
                     <div className="h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                     </div>
                  </div>
                  <p className="text-xs text-emerald-400 font-medium">Compliant</p>
               </div>
               
               <div className="grid grid-cols-1 gap-2">
                  <div className="bg-zinc-900/50 border border-white/5 px-3 py-2 rounded-lg text-center">
                     <p className="text-[10px] text-zinc-500 uppercase">Invoices</p>
                     <p className="text-sm font-bold text-white">18</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/5 px-3 py-2 rounded-lg text-center">
                     <p className="text-[10px] text-zinc-500 uppercase">Amount</p>
                     <p className="text-sm font-bold text-white">₹8.45L</p>
                  </div>
               </div>
            </div>
         </div>
         
         <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/5">
            <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">Send Reminder</button>
            <button className="px-4 py-2 rounded-lg border border-white/10 text-zinc-300 text-sm hover:bg-white/5 transition-colors">Download Report</button>
         </div>
      </GlassPanel>

      {/* 2. TABS */}
      <div className="flex border-b border-white/5 overflow-x-auto">
         {['invoices', 'filing', 'communication', 'analytics'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
               {tab === 'invoices' ? 'Invoice Tracking' : tab === 'filing' ? 'Filing History' : tab === 'communication' ? 'Communication Log' : 'Performance Analytics'}
            </button>
         ))}
      </div>

      {/* 3. TAB CONTENT */}
      <div className="min-h-[400px]">
         
         {/* TAB 1: INVOICE TRACKING */}
         {activeTab === 'invoices' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BentoCard title="Expected vs Received">
                     <div className="flex items-center justify-between mt-2">
                        <div>
                           <p className="text-3xl font-bold text-white">18 <span className="text-sm text-zinc-500 font-normal">/ 20</span></p>
                           <p className="text-xs text-zinc-400 mt-1">Invoices Received</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xl font-bold text-white">₹ 8.45 L</p>
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">90% Rate</span>
                        </div>
                     </div>
                  </BentoCard>
                  
                  <BentoCard title="Gap Analysis" className="border-amber-500/30 bg-amber-500/5">
                     <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-amber-500/10 text-amber-500">
                           <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                           <p className="text-sm text-zinc-300">2 expected invoices missing</p>
                           <p className="text-xs text-zinc-500 mt-1">Est. Amount: ₹54,400</p>
                        </div>
                        <button className="ml-auto px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded hover:bg-amber-600 transition-colors">
                           Remind
                        </button>
                     </div>
                  </BentoCard>
               </div>

               <GlassPanel className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">November 2025 Activity</h3>
                  <div className="grid grid-cols-7 gap-2">
                     {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="text-center text-xs text-zinc-500 py-2">{d}</div>
                     ))}
                     {invoiceTimeline.map((item, i) => (
                        <div 
                           key={i} 
                           className={`
                              aspect-square rounded-lg border flex flex-col items-center justify-center relative cursor-pointer transition-all hover:scale-105
                              ${item.hasInvoice ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : item.isMissing ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-zinc-900/30 border-white/5 text-zinc-600'}
                           `}
                        >
                           <span className="text-sm font-medium">{item.day}</span>
                           {item.hasInvoice && <CheckCircle2 className="h-3 w-3 mt-1" />}
                           {item.isMissing && <AlertTriangle className="h-3 w-3 mt-1" />}
                        </div>
                     ))}
                  </div>
               </GlassPanel>
            </div>
         )}

         {/* TAB 2: FILING HISTORY */}
         {activeTab === 'filing' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <BentoCard className="p-6">
                     <p className="text-xs text-zinc-500 uppercase font-semibold">Avg Filing Date</p>
                     <p className="text-3xl font-bold text-white mt-2">11th</p>
                     <p className="text-xs text-emerald-500 mt-1">Usually On-Time</p>
                  </BentoCard>
                  <BentoCard className="p-6">
                     <p className="text-xs text-zinc-500 uppercase font-semibold">Consistency</p>
                     <p className="text-3xl font-bold text-white mt-2">85%</p>
                     <p className="text-xs text-zinc-500 mt-1">2 late filings in 12 months</p>
                  </BentoCard>
                  <BentoCard className="p-6">
                     <p className="text-xs text-zinc-500 uppercase font-semibold">ITC Impact</p>
                     <p className="text-3xl font-bold text-emerald-500 mt-2">₹ 18.5L</p>
                     <p className="text-xs text-zinc-500 mt-1">Secured this year</p>
                  </BentoCard>
               </div>

               <GlassPanel className="p-0 overflow-hidden">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-white/5 text-zinc-500 font-medium">
                        <tr>
                           <th className="px-6 py-3">Period</th>
                           <th className="px-6 py-3">Due Date</th>
                           <th className="px-6 py-3">Filed Date</th>
                           <th className="px-6 py-3">Status</th>
                           <th className="px-6 py-3 text-right">Invoices</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {[
                           { period: 'Oct 2025', due: '11 Nov', filed: '10 Nov', status: 'On Time', count: 20, color: 'text-emerald-500' },
                           { period: 'Sep 2025', due: '11 Oct', filed: '12 Oct', status: 'Late (1 day)', count: 18, color: 'text-amber-500' },
                           { period: 'Aug 2025', due: '11 Sep', filed: '10 Sep', status: 'On Time', count: 24, color: 'text-emerald-500' },
                        ].map((row, i) => (
                           <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-medium text-white">{row.period}</td>
                              <td className="px-6 py-4 text-zinc-400">{row.due}</td>
                              <td className="px-6 py-4 text-white">{row.filed}</td>
                              <td className="px-6 py-4">
                                 <span className={`text-xs font-medium ${row.color}`}>{row.status}</span>
                              </td>
                              <td className="px-6 py-4 text-right text-zinc-300">{row.count}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </GlassPanel>
            </div>
         )}

      </div>
    </div>
  );
}
