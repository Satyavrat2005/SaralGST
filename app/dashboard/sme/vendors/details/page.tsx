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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* 1. VENDOR HEADER */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
         <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-4">
               <div>
                  <h1 className="text-2xl font-bold text-gray-900">ABC Enterprises Pvt Ltd</h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                     <span className="font-mono bg-gray-100 px-2.5 py-1 rounded-lg flex items-center gap-2 text-xs border border-gray-200">
                        27ABCDE1234F1Z5 <Copy className="h-3 w-3 cursor-pointer hover:text-gray-900" />
                     </span>
                     <span>• Maharashtra</span>
                  </div>
               </div>
               <div className="flex gap-3">
                  <button className="p-2.5 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 transition-colors border border-gray-200"><Phone className="h-4 w-4" /></button>
                  <button className="p-2.5 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 transition-colors border border-gray-200"><Mail className="h-4 w-4" /></button>
                  <button className="p-2.5 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 transition-colors border border-gray-200"><MessageSquare className="h-4 w-4" /></button>
               </div>
            </div>

            <div className="flex items-start gap-6">
               <div className="text-right space-y-1">
                  <div className="flex items-center justify-end gap-2">
                     <span className="text-3xl font-bold text-emerald-600">95%</span>
                     <div className="h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                     </div>
                  </div>
                  <p className="text-xs text-emerald-600 font-semibold">Compliant</p>
               </div>
               
               <div className="grid grid-cols-1 gap-2">
                  <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 px-3 py-2 rounded-xl text-center">
                     <p className="text-[10px] text-gray-500 uppercase font-semibold">Invoices</p>
                     <p className="text-sm font-bold text-gray-900">18</p>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 px-3 py-2 rounded-xl text-center">
                     <p className="text-[10px] text-gray-500 uppercase font-semibold">Amount</p>
                     <p className="text-sm font-bold text-gray-900">₹8.45L</p>
                  </div>
               </div>
            </div>
         </div>
         
         <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button className="px-4 py-2.5 rounded-xl btn-primary-custom text-sm font-medium shadow-md hover:shadow-lg transition-all">Send Reminder</button>
            <button className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:shadow-sm transition-all">Download Report</button>
         </div>
      </div>

      {/* 2. TABS */}
      <div className="flex border-b border-gray-200 overflow-x-auto bg-white rounded-t-2xl px-6">
         {['invoices', 'filing', 'communication', 'analytics'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
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
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                     <h3 className="text-sm font-semibold text-gray-900 mb-3">Expected vs Received</h3>
                     <div className="flex items-center justify-between mt-2">
                        <div>
                           <p className="text-3xl font-bold text-gray-900">18 <span className="text-sm text-gray-500 font-normal">/ 20</span></p>
                           <p className="text-xs text-gray-600 mt-1">Invoices Received</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xl font-bold text-gray-900">₹ 8.45 L</p>
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">90% Rate</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-lg p-6">
                     <h3 className="text-sm font-semibold text-gray-900 mb-3">Gap Analysis</h3>
                     <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                           <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                           <p className="text-sm text-gray-900 font-medium">2 expected invoices missing</p>
                           <p className="text-xs text-gray-600 mt-1">Est. Amount: ₹54,400</p>
                        </div>
                        <button className="ml-auto btn-primary-custom px-3 py-2 text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all">
                           Remind
                        </button>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">November 2025 Activity</h3>
                  <div className="grid grid-cols-7 gap-2">
                     {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="text-center text-xs text-gray-500 py-2 font-semibold">{d}</div>
                     ))}
                     {invoiceTimeline.map((item, i) => (
                        <div 
                           key={i} 
                           className={`
                              aspect-square rounded-xl border flex flex-col items-center justify-center relative cursor-pointer transition-all hover:scale-105
                              ${item.hasInvoice ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : item.isMissing ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-400'}
                           `}
                        >
                           <span className="text-sm font-semibold">{item.day}</span>
                           {item.hasInvoice && <CheckCircle2 className="h-3 w-3 mt-1" />}
                           {item.isMissing && <AlertTriangle className="h-3 w-3 mt-1" />}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* TAB 2: FILING HISTORY */}
         {activeTab === 'filing' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                     <p className="text-xs text-gray-600 uppercase font-semibold">Avg Filing Date</p>
                     <p className="text-3xl font-bold text-gray-900 mt-2">11th</p>
                     <p className="text-xs text-emerald-600 mt-1 font-semibold">Usually On-Time</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                     <p className="text-xs text-gray-600 uppercase font-semibold">Consistency</p>
                     <p className="text-3xl font-bold text-gray-900 mt-2">85%</p>
                     <p className="text-xs text-gray-500 mt-1">2 late filings in 12 months</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                     <p className="text-xs text-gray-600 uppercase font-semibold">ITC Impact</p>
                     <p className="text-3xl font-bold text-emerald-600 mt-2">₹ 18.5L</p>
                     <p className="text-xs text-gray-500 mt-1">Secured this year</p>
                  </div>
               </div>

               <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-gradient-to-r from-gray-50 to-white text-gray-700 font-semibold border-b border-gray-200">
                        <tr>
                           <th className="px-4 py-3 text-xs uppercase tracking-wider">Period</th>
                           <th className="px-4 py-3 text-xs uppercase tracking-wider">Due Date</th>
                           <th className="px-4 py-3 text-xs uppercase tracking-wider">Filed Date</th>
                           <th className="px-4 py-3 text-xs uppercase tracking-wider">Status</th>
                           <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Invoices</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {[
                           { period: 'Oct 2025', due: '11 Nov', filed: '10 Nov', status: 'On Time', count: 20, color: 'text-emerald-600' },
                           { period: 'Sep 2025', due: '11 Oct', filed: '12 Oct', status: 'Late (1 day)', count: 18, color: 'text-amber-600' },
                           { period: 'Aug 2025', due: '11 Sep', filed: '10 Sep', status: 'On Time', count: 24, color: 'text-emerald-600' },
                        ].map((row, i) => (
                           <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-gray-900 text-xs">{row.period}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs">{row.due}</td>
                              <td className="px-4 py-3 text-gray-900 text-xs font-medium">{row.filed}</td>
                              <td className="px-4 py-3">
                                 <span className={`text-xs font-semibold ${row.color}`}>{row.status}</span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900 font-semibold text-xs">{row.count}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

      </div>
    </div>
    </div>
  );
}
