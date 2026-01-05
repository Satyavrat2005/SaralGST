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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[11px] font-semibold text-emerald-700">ITC Overview</span>
            </div>
            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-1">ITC Summary</h1>
            <p className="text-sm text-gray-600">Input Tax Credit overview and detailed breakdown</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
               <select className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-9 pr-10 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
                 <option>This Month</option>
                 <option>Last Month</option>
                 <option>This Quarter</option>
               </select>
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
             </div>
             <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2">
               <Download className="h-4 w-4" /> ITC Report
             </button>
             <button className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2">
               <Eye className="h-4 w-4" /> GSTR-3B Preview
             </button>
          </div>
        </div>
      </div>

      {/* 2. ITC OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 hover:shadow-xl transition-all h-[140px] flex flex-col">
           <div className="flex justify-between items-start mb-2">
             <p className="text-sm text-gray-600 font-medium">Total ITC Eligible</p>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
               <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.5} />
             </div>
           </div>
           <h3 className="text-2xl font-bold text-gray-900 whitespace-nowrap">₹ 8,22,020</h3>
           <p className="text-xs text-emerald-600 mt-auto flex items-center gap-1 font-medium"><TrendingUp className="h-3 w-3" /> +12% vs last month</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 shadow-lg p-5 hover:shadow-xl transition-all h-[140px] flex flex-col">
           <div className="flex justify-between items-start mb-2">
             <p className="text-sm text-gray-600 font-medium">ITC Claimed</p>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
               <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.5} />
             </div>
           </div>
           <h3 className="text-2xl font-bold text-emerald-600 whitespace-nowrap">₹ 7,54,230</h3>
           <p className="text-xs text-gray-500 mt-auto">92% of eligible ITC</p>
        </div>

        <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-5 hover:shadow-xl transition-all h-[140px] flex flex-col">
           <div className="flex justify-between items-start mb-2">
             <p className="text-sm text-gray-600 font-medium">Blocked/Reversed</p>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
               <XCircle className="h-4 w-4 text-white" strokeWidth={2.5} />
             </div>
           </div>
           <h3 className="text-2xl font-bold text-red-600 whitespace-nowrap">₹ 45,600</h3>
           <p className="text-xs text-gray-500 mt-auto">5.5% of eligible ITC</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 shadow-lg p-5 hover:shadow-xl transition-all h-[140px] flex flex-col">
           <div className="flex justify-between items-start mb-2">
             <p className="text-sm text-gray-600 font-medium">ITC at Risk</p>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
               <AlertTriangle className="h-4 w-4 text-white" strokeWidth={2.5} />
             </div>
           </div>
           <h3 className="text-2xl font-bold text-amber-600 whitespace-nowrap">₹ 22,190</h3>
           <p className="text-xs text-gray-500 mt-auto">Vendor action pending</p>
        </div>
      </div>

      {/* 3. ITC FLOW DIAGRAM */}
      <div className="w-full overflow-x-auto">
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 min-w-[800px]">
            <div className="flex justify-between items-center relative">
               {/* Total */}
               <div className="flex flex-col items-center z-10">
                  <div className="w-40 p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl text-center shadow-md">
                     <p className="text-xs text-gray-600 uppercase mb-1 font-semibold">Total Available</p>
                     <p className="text-lg font-bold text-gray-900">₹ 8,22,020</p>
                  </div>
               </div>

               {/* Connecting Lines */}
               <div className="absolute top-1/2 left-20 right-20 h-px bg-gray-300 -z-0"></div>
               
               {/* Split */}
               <div className="flex-1 flex justify-around items-center relative z-10 px-10">
                  <div className="flex flex-col items-center gap-8">
                     <div 
                        className="w-40 p-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl text-center shadow-md cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => setActiveTab('eligible')}
                     >
                        <p className="text-xs text-emerald-700 uppercase mb-1 font-semibold">Eligible (94%)</p>
                        <p className="text-lg font-bold text-gray-900">₹ 7,76,420</p>
                     </div>
                     <ArrowRight className="h-5 w-5 text-gray-400 rotate-90" />
                     <div 
                        className="w-40 p-4 bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-300 rounded-xl text-center shadow-md cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => setActiveTab('claimed')}
                     >
                        <p className="text-xs text-emerald-700 uppercase mb-1 font-semibold">Claimed</p>
                        <p className="text-lg font-bold text-emerald-700">₹ 7,54,230</p>
                     </div>
                  </div>

                  <div className="flex flex-col items-center">
                     <div 
                        className="w-40 p-4 bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl text-center shadow-md cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => setActiveTab('blocked')}
                     >
                        <p className="text-xs text-red-700 uppercase mb-1 font-semibold">Blocked (6%)</p>
                        <p className="text-lg font-bold text-red-600">₹ 45,600</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 4. DETAILED BREAKDOWN TABS */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 inline-flex gap-1">
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
                  px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2
                  ${activeTab === tab.id 
                     ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-200' 
                     : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
               `}
            >
               {tab.label}
               <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {tab.count}
               </span>
            </button>
         ))}
      </div>

      {/* 5. TAB CONTENT */}
      <div className="min-h-[400px]">
         {activeTab === 'eligible' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex gap-3">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                     </div>
                     <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all"><Filter className="h-4 w-4" /></button>
                  </div>
                  <span className="text-sm text-gray-900 font-semibold">Total: ₹7,76,420</span>
               </div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                     <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice No</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Taxable</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Total ITC</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Status</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Source</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {eligibleITC.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-4 font-semibold text-gray-900">{item.id}</td>
                           <td className="px-6 py-4 text-gray-600">{item.date}</td>
                           <td className="px-6 py-4">
                              <div>
                                 <p className="text-gray-900 font-medium">{item.vendor}</p>
                                 <p className="text-[10px] text-gray-500 font-mono">{item.gstin}</p>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right text-gray-700 font-semibold">₹{item.taxable.toLocaleString()}</td>
                           <td className="px-6 py-4 text-right font-bold text-gray-900">₹{item.tax.toLocaleString()}</td>
                           <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${item.status === 'Eligible' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                 {item.status === 'Eligible' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                 {item.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">{item.source}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-all"><MoreVertical className="h-4 w-4" /></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}

         {activeTab === 'blocked' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl">
                     <p className="text-xs text-purple-700 font-semibold uppercase tracking-wider">Blocked Credits (Rule 38/42/43)</p>
                     <p className="text-lg font-bold text-gray-900 mt-2">₹ 25,000 <span className="text-xs font-normal text-gray-500">(8 invoices)</span></p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl">
                     <p className="text-xs text-red-700 font-semibold uppercase tracking-wider">Vendor Non-Filing</p>
                     <p className="text-lg font-bold text-gray-900 mt-2">₹ 12,400 <span className="text-xs font-normal text-gray-500">(10 invoices)</span></p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl">
                     <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">Validation Failures</p>
                     <p className="text-lg font-bold text-gray-900 mt-2">₹ 8,200 <span className="text-xs font-normal text-gray-500">(6 invoices)</span></p>
                  </div>
               </div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                     <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice No</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">ITC Amount</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Blocked Date</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Status</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {blockedITC.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-4 font-semibold text-gray-900">{item.id}</td>
                           <td className="px-6 py-4 text-gray-600">{item.date}</td>
                           <td className="px-6 py-4 text-gray-900 font-medium">{item.vendor}</td>
                           <td className="px-6 py-4 text-right font-bold text-red-600">₹{item.amount.toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm text-gray-700">{item.reason}</td>
                           <td className="px-6 py-4 text-gray-600">{item.dateBlocked}</td>
                           <td className="px-6 py-4 text-center">
                              <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">{item.status}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">Details</button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}

         {activeTab === 'risk' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-gray-900 font-semibold">Actionable Items</h3>
                  <div className="flex gap-2">
                     <button className="btn-primary-custom px-3 py-2 rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all">Send Bulk Reminders</button>
                     <button className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-all">Resolve All</button>
                  </div>
               </div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                     <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice No</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">ITC at Risk</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Risk Type</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Days Pending</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {atRiskITC.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-4 font-semibold text-gray-900">{item.id}</td>
                           <td className="px-6 py-4 text-gray-600">{item.date}</td>
                           <td className="px-6 py-4 text-gray-900 font-medium">{item.vendor}</td>
                           <td className="px-6 py-4 text-right font-bold text-amber-600">₹{item.amount.toLocaleString()}</td>
                           <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-semibold">
                                 <AlertTriangle className="h-3 w-3" /> {item.risk}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className={`font-bold ${item.days > 15 ? 'text-red-600' : 'text-gray-600'}`}>{item.days} Days</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 font-medium hover:bg-gray-50 transition-all">{item.action}</button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
    </div>
    </div>
  );
}
