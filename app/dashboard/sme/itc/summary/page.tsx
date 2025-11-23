'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Download, 
  Calendar, 
  Filter,
  Eye,
  Search,
  Info,
  MoreVertical
} from 'lucide-react';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Mock Data for Tables
const eligibleITC = [
  { id: 'INV-001234', date: '18 Nov 2025', vendor: 'ABC Enterprises', gstin: '27ABCDE1234F1Z5', taxable: 45600, tax: 8208, status: 'Eligible', source: 'GSTR-2B' },
  { id: 'INV-001235', date: '17 Nov 2025', vendor: 'TechSol Solutions', gstin: '29PQRST5678H1Z2', taxable: 12000, tax: 2160, status: 'Eligible', source: 'GSTR-2B' },
  { id: 'INV-001236', date: '17 Nov 2025', vendor: 'Global Logistics', gstin: '07KLMNO4321J1Z9', taxable: 85000, tax: 15300, status: 'Conditional', source: 'Manual' },
];

const blockedITC = [
  { id: 'INV-009876', date: '15 Nov 2025', vendor: 'Luxury Cars Ltd', amount: 25000, reason: 'Rule 38 - Blocked Credit', status: 'Permanent', dateBlocked: '16 Nov 2025' },
  { id: 'INV-009877', date: '14 Nov 2025', vendor: 'Food & Bev Co', amount: 12400, reason: 'Section 17(5)', status: 'Permanent', dateBlocked: '16 Nov 2025' },
];

const atRiskITC = [
  { id: 'INV-005566', date: '01 Nov 2025', vendor: 'Reddy Traders', amount: 15600, risk: 'Vendor GSTR-1 Not Filed', days: 22, action: 'Send Reminder' },
  { id: 'INV-005567', date: '05 Nov 2025', vendor: 'Alpha Systems', amount: 6590, risk: 'Validation Pending', days: 18, action: 'Validate' },
];

export default function ITCSummaryPage() {
  const [activeTab, setActiveTab] = useState<'eligible' | 'claimed' | 'blocked' | 'risk'>('eligible');

  return (
    <div className="space-y-6 pb-20">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ITC Summary</h1>
          <p className="text-muted-foreground text-sm mt-1">Input Tax Credit overview and detailed breakdown</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-zinc-900 border border-white/10 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-primary outline-none text-zinc-300 cursor-pointer hover:bg-zinc-800">
               <option>This Month</option>
               <option>Last Month</option>
               <option>This Quarter</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
           </div>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Download className="h-4 w-4" /> ITC Report
           </button>
           <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
             <Eye className="h-4 w-4" /> GSTR-3B Preview
           </button>
        </div>
      </div>

      {/* 2. ITC OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BentoCard className="p-6">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-muted-foreground">Total ITC Eligible</p>
               <h3 className="text-3xl font-bold text-white mt-2">₹ 8,22,020</h3>
               <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +12% vs last month</p>
             </div>
             <div className="p-2 bg-blue-500/10 rounded-lg">
               <CheckCircle2 className="h-5 w-5 text-blue-500" />
             </div>
           </div>
        </BentoCard>

        <BentoCard className="p-6 border-emerald-500/30 bg-emerald-500/5">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-emerald-400/80">ITC Claimed</p>
               <h3 className="text-3xl font-bold text-emerald-500 mt-2">₹ 7,54,230</h3>
               <p className="text-xs text-zinc-500 mt-1">92% of eligible ITC</p>
             </div>
             <div className="p-2 bg-emerald-500/10 rounded-lg">
               <CheckCircle2 className="h-5 w-5 text-emerald-500" />
             </div>
           </div>
        </BentoCard>

        <BentoCard className="p-6 border-red-500/30 bg-red-500/5">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-red-400/80">Blocked/Reversed</p>
               <h3 className="text-3xl font-bold text-red-500 mt-2">₹ 45,600</h3>
               <p className="text-xs text-zinc-500 mt-1">5.5% of eligible ITC</p>
             </div>
             <div className="p-2 bg-red-500/10 rounded-lg">
               <XCircle className="h-5 w-5 text-red-500" />
             </div>
           </div>
        </BentoCard>

        <BentoCard className="p-6 border-amber-500/30 bg-amber-500/5">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-amber-400/80">ITC at Risk</p>
               <h3 className="text-3xl font-bold text-amber-500 mt-2">₹ 22,190</h3>
               <p className="text-xs text-zinc-500 mt-1">Vendor action pending</p>
             </div>
             <div className="p-2 bg-amber-500/10 rounded-lg">
               <AlertTriangle className="h-5 w-5 text-amber-500" />
             </div>
           </div>
        </BentoCard>
      </div>

      {/* 3. ITC FLOW DIAGRAM */}
      <div className="w-full overflow-x-auto">
         <GlassPanel className="p-8 min-w-[800px]">
            <div className="flex justify-between items-center relative">
               {/* Total */}
               <div className="flex flex-col items-center z-10">
                  <div className="w-40 p-4 bg-zinc-900 border border-white/10 rounded-xl text-center shadow-lg">
                     <p className="text-xs text-zinc-500 uppercase mb-1">Total Available</p>
                     <p className="text-lg font-bold text-white">₹ 8,22,020</p>
                  </div>
               </div>

               {/* Connecting Lines */}
               <div className="absolute top-1/2 left-20 right-20 h-px bg-zinc-700 -z-0"></div>
               
               {/* Split */}
               <div className="flex-1 flex justify-around items-center relative z-10 px-10">
                  <div className="flex flex-col items-center gap-8">
                     <div 
                        className="w-40 p-4 bg-zinc-900 border border-emerald-500/30 rounded-xl text-center shadow-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                        onClick={() => setActiveTab('eligible')}
                     >
                        <p className="text-xs text-emerald-500 uppercase mb-1">Eligible (94%)</p>
                        <p className="text-lg font-bold text-white">₹ 7,76,420</p>
                     </div>
                     <ArrowRight className="h-5 w-5 text-zinc-600 rotate-90" />
                     <div 
                        className="w-40 p-4 bg-emerald-900/20 border border-emerald-500/50 rounded-xl text-center shadow-lg cursor-pointer hover:bg-emerald-900/30 transition-colors"
                        onClick={() => setActiveTab('claimed')}
                     >
                        <p className="text-xs text-emerald-400 uppercase mb-1">Claimed</p>
                        <p className="text-lg font-bold text-white">₹ 7,54,230</p>
                     </div>
                  </div>

                  <div className="flex flex-col items-center">
                     <div 
                        className="w-40 p-4 bg-zinc-900 border border-red-500/30 rounded-xl text-center shadow-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                        onClick={() => setActiveTab('blocked')}
                     >
                        <p className="text-xs text-red-500 uppercase mb-1">Blocked (6%)</p>
                        <p className="text-lg font-bold text-white">₹ 45,600</p>
                     </div>
                  </div>
               </div>
            </div>
         </GlassPanel>
      </div>

      {/* 4. DETAILED BREAKDOWN TABS */}
      <div className="flex border-b border-white/5">
         {[
            { id: 'eligible', label: 'Eligible ITC', count: 789 },
            { id: 'claimed', label: 'Claimed ITC', count: 750 },
            { id: 'blocked', label: 'Blocked/Reversed', count: 18 },
            { id: 'risk', label: 'At Risk', count: 17 }
         ].map(tab => (
            <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`
                  px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
                  ${activeTab === tab.id 
                     ? 'border-primary text-white bg-white/5' 
                     : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
               `}
            >
               {tab.label}
               <span className={`text-xs px-1.5 py-0.5 rounded ${activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
                  {tab.count}
               </span>
            </button>
         ))}
      </div>

      {/* 5. TAB CONTENT */}
      <div className="min-h-[400px]">
         {activeTab === 'eligible' && (
            <GlassPanel className="p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <div className="flex gap-3">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                        <input type="text" placeholder="Search..." className="pl-9 pr-4 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:ring-1 focus:ring-primary outline-none" />
                     </div>
                     <button className="p-1.5 bg-zinc-900 border border-white/10 rounded-lg text-zinc-400 hover:text-white"><Filter className="h-4 w-4" /></button>
                  </div>
                  <span className="text-sm text-white font-medium">Total: ₹7,76,420</span>
               </div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-zinc-500 font-medium">
                     <tr>
                        <th className="px-6 py-3">Invoice No</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Vendor</th>
                        <th className="px-6 py-3 text-right">Taxable</th>
                        <th className="px-6 py-3 text-right">Total ITC</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-center">Source</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {eligibleITC.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4 font-medium text-white">{item.id}</td>
                           <td className="px-6 py-4 text-zinc-400">{item.date}</td>
                           <td className="px-6 py-4">
                              <div>
                                 <p className="text-zinc-200">{item.vendor}</p>
                                 <p className="text-[10px] text-zinc-500 font-mono">{item.gstin}</p>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right text-zinc-300 font-mono">₹{item.taxable.toLocaleString()}</td>
                           <td className="px-6 py-4 text-right font-bold text-white font-mono">₹{item.tax.toLocaleString()}</td>
                           <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${item.status === 'Eligible' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                 {item.status === 'Eligible' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                 {item.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">{item.source}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><MoreVertical className="h-4 w-4" /></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </GlassPanel>
         )}

         {activeTab === 'blocked' && (
            <GlassPanel className="p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-white/5 bg-zinc-900/30">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                     <p className="text-xs text-purple-400 font-medium">Blocked Credits (Rule 38/42/43)</p>
                     <p className="text-lg font-bold text-white mt-1">₹ 25,000 <span className="text-xs font-normal text-zinc-500">(8 invoices)</span></p>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                     <p className="text-xs text-red-400 font-medium">Vendor Non-Filing</p>
                     <p className="text-lg font-bold text-white mt-1">₹ 12,400 <span className="text-xs font-normal text-zinc-500">(10 invoices)</span></p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                     <p className="text-xs text-amber-400 font-medium">Validation Failures</p>
                     <p className="text-lg font-bold text-white mt-1">₹ 8,200 <span className="text-xs font-normal text-zinc-500">(6 invoices)</span></p>
                  </div>
               </div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-zinc-500 font-medium">
                     <tr>
                        <th className="px-6 py-3">Invoice No</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Vendor</th>
                        <th className="px-6 py-3 text-right">ITC Amount</th>
                        <th className="px-6 py-3">Reason</th>
                        <th className="px-6 py-3">Blocked Date</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {blockedITC.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4 font-medium text-white">{item.id}</td>
                           <td className="px-6 py-4 text-zinc-400">{item.date}</td>
                           <td className="px-6 py-4 text-zinc-200">{item.vendor}</td>
                           <td className="px-6 py-4 text-right font-bold text-red-400">₹{item.amount.toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm text-zinc-300">{item.reason}</td>
                           <td className="px-6 py-4 text-zinc-400">{item.dateBlocked}</td>
                           <td className="px-6 py-4 text-center">
                              <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20">{item.status}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="text-xs text-primary hover:underline">Details</button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </GlassPanel>
         )}

         {activeTab === 'risk' && (
            <GlassPanel className="p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="p-4 flex justify-between items-center border-b border-white/5">
                  <h3 className="text-white font-medium">Actionable Items</h3>
                  <div className="flex gap-2">
                     <button className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500">Send Bulk Reminders</button>
                     <button className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700">Resolve All</button>
                  </div>
               </div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-zinc-500 font-medium">
                     <tr>
                        <th className="px-6 py-3">Invoice No</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Vendor</th>
                        <th className="px-6 py-3 text-right">ITC at Risk</th>
                        <th className="px-6 py-3">Risk Type</th>
                        <th className="px-6 py-3 text-center">Days Pending</th>
                        <th className="px-6 py-3 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {atRiskITC.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4 font-medium text-white">{item.id}</td>
                           <td className="px-6 py-4 text-zinc-400">{item.date}</td>
                           <td className="px-6 py-4 text-zinc-200">{item.vendor}</td>
                           <td className="px-6 py-4 text-right font-bold text-amber-500">₹{item.amount.toLocaleString()}</td>
                           <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                 <AlertTriangle className="h-3 w-3" /> {item.risk}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className={`font-bold ${item.days > 15 ? 'text-red-500' : 'text-zinc-400'}`}>{item.days} Days</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="px-3 py-1 rounded border border-white/10 text-xs text-white hover:bg-white/5">{item.action}</button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </GlassPanel>
         )}
      </div>
    </div>
  );
}
