'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  MoreVertical, 
  ArrowUpRight,
  ShieldCheck,
  X,
  FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Mock Data
const matchedInvoices = [
  { id: 'INV-001234', date: '18 Nov 2025', vendor: 'ABC Enterprises', gstin: '27ABCDE1234F1Z5', amount: 53808, gstr2bAmount: 53808, type: 'Exact Match', itc: 9685, confidence: 100, status: 'Reviewed' },
  { id: 'INV-001235', date: '18 Nov 2025', vendor: 'TechSol Solutions', gstin: '29PQRST5678H1Z2', amount: 14160, gstr2bAmount: 14160, type: 'Exact Match', itc: 2160, confidence: 100, status: 'Pending Review' },
  { id: 'INV-001236', date: '17 Nov 2025', vendor: 'Global Logistics', gstin: '07KLMNO4321J1Z9', amount: 100300, gstr2bAmount: 100295, type: 'Fuzzy Match', itc: 15300, confidence: 95, status: 'Pending Review' },
  { id: 'INV-001238', date: '16 Nov 2025', vendor: 'Reddy Traders', gstin: '33FGHIJ9876L1Z4', amount: 28320, gstr2bAmount: 28320, type: 'Exact Match', itc: 4320, confidence: 100, status: 'Reviewed' },
  { id: 'INV-001239', date: '15 Nov 2025', vendor: 'Office Supplies', gstin: '19UVWXY8765K1Z3', amount: 4130, gstr2bAmount: 4130, type: 'HSN Match', itc: 630, confidence: 90, status: 'Pending Review' },
];

const matchBreakdown = [
  { name: 'Exact Match', value: 750, color: '#3B82F6' },
  { name: 'Fuzzy Match', value: 30, color: '#10B981' },
  { name: 'HSN Match', value: 9, color: '#8B5CF6' },
];

export default function MatchedInvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const getMatchTypeStyle = (type: string) => {
    switch(type) {
      case 'Exact Match': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Fuzzy Match': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'HSN Match': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Matched Invoices</h1>
            <p className="text-muted-foreground text-sm mt-1">Successfully reconciled invoices across all sources</p>
          </div>
          <div className="flex items-center gap-3">
             <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
               <Download className="h-4 w-4" /> Export Matched
             </button>
             <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
               <CheckCircle2 className="h-4 w-4" /> Mark All Reviewed
             </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between backdrop-blur-sm">
           <div className="flex flex-wrap items-center gap-3 w-full">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2 appearance-none cursor-pointer hover:bg-black/40">
                  <option>Last Run (Nov)</option>
                  <option>October 2025</option>
                  <option>Custom Range</option>
                </select>
              </div>

              <div className="w-px h-8 bg-white/5 hidden md:block"></div>

              <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
                <option>All Vendors</option>
                <option>ABC Enterprises</option>
                <option>TechSol Solutions</option>
              </select>

              <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
                <option>All Match Types</option>
                <option>Exact Match</option>
                <option>Fuzzy Match</option>
                <option>HSN Match</option>
              </select>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input type="text" className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2 placeholder-zinc-600" placeholder="Search by invoice number..." />
              </div>
           </div>
        </div>
      </div>

      {/* 2. SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BentoCard className="p-6">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-muted-foreground">Total Matched</p>
               <h3 className="text-3xl font-bold text-white mt-2">789</h3>
               <p className="text-xs text-zinc-500 mt-1">92% of total invoices</p>
             </div>
             <div className="text-right">
                <p className="text-sm text-emerald-400 font-medium">ITC Secured</p>
                <h3 className="text-2xl font-bold text-emerald-500 mt-1">₹ 7,54,230</h3>
             </div>
           </div>
           <div className="mt-4 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[92%]"></div>
           </div>
        </BentoCard>

        <BentoCard className="p-4 flex items-center gap-6">
           <div className="h-24 w-24 relative shrink-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={matchBreakdown}
                   innerRadius={25}
                   outerRadius={35}
                   paddingAngle={5}
                   dataKey="value"
                   stroke="none"
                 >
                   {matchBreakdown.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #333' }} itemStyle={{color: '#fff'}} />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="flex-1 space-y-2">
             <p className="text-sm font-medium text-white mb-1">Match Type Breakdown</p>
             <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {matchBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                        <span className="text-zinc-400">{item.name}</span>
                     </div>
                     <span className="text-white font-mono">{item.value}</span>
                  </div>
                ))}
             </div>
           </div>
        </BentoCard>
      </div>

      {/* 3. DATA TABLE */}
      <GlassPanel className="p-0 overflow-hidden flex flex-col min-h-[500px]">
         <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
            <span className="text-sm text-white font-medium">789 Matched Invoices</span>
            {selectedRows.length > 0 && (
               <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-sm text-zinc-300">{selectedRows.length} selected</span>
                  <div className="flex items-center rounded-lg bg-zinc-800 border border-white/10 overflow-hidden">
                     <button className="px-3 py-1.5 text-xs hover:bg-white/5 text-emerald-400 border-r border-white/10">Mark Reviewed</button>
                     <button className="px-3 py-1.5 text-xs hover:bg-white/5 text-zinc-300">Export</button>
                  </div>
               </div>
            )}
         </div>

         <div className="flex-1 overflow-auto">
           <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-zinc-500 font-medium sticky top-0 backdrop-blur-sm z-10">
                 <tr>
                    <th className="px-6 py-3 w-12"></th>
                    <th className="px-6 py-3">Invoice No</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Vendor</th>
                    <th className="px-6 py-3 text-right">Your Books</th>
                    <th className="px-6 py-3 text-right">GSTR-2B</th>
                    <th className="px-6 py-3 text-center">Match Type</th>
                    <th className="px-6 py-3 text-right">ITC Eligible</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {matchedInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                       <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded bg-zinc-800 border-zinc-600 text-primary focus:ring-primary"
                            checked={selectedRows.includes(inv.id)}
                            onChange={() => toggleRowSelection(inv.id)}
                          />
                       </td>
                       <td className="px-6 py-4">
                          <button onClick={() => setSelectedInvoice(inv)} className="font-medium text-white hover:text-primary hover:underline">
                             {inv.id}
                          </button>
                       </td>
                       <td className="px-6 py-4 text-zinc-400">{inv.date}</td>
                       <td className="px-6 py-4">
                          <div className="flex flex-col">
                             <span className="text-zinc-200">{inv.vendor}</span>
                             <span className="text-[10px] text-zinc-500 font-mono">{inv.gstin}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right text-zinc-300 font-mono">₹{inv.amount.toLocaleString()}</td>
                       <td className="px-6 py-4 text-right text-zinc-300 font-mono">
                          <div className="flex items-center justify-end gap-1">
                             {inv.gstr2bAmount === inv.amount ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <ShieldCheck className="h-3 w-3 text-amber-500" />}
                             ₹{inv.gstr2bAmount.toLocaleString()}
                          </div>
                       </td>
                       <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getMatchTypeStyle(inv.type)}`}>
                             {inv.type}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-right font-bold text-white font-mono">₹{inv.itc.toLocaleString()}</td>
                       <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${inv.status === 'Reviewed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                             {inv.status}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white" title="View Details">
                                <Eye className="h-4 w-4" />
                             </button>
                             <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                             </button>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
         </div>

         {/* Pagination */}
         <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-zinc-900/50">
           <div className="text-xs text-zinc-500">Showing 1-5 of 789</div>
           <div className="flex items-center gap-2">
              <div className="flex gap-1">
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700" disabled>Previous</button>
                 <button className="px-2 py-1 rounded bg-primary text-white text-xs">1</button>
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">2</button>
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">Next</button>
              </div>
           </div>
         </div>
      </GlassPanel>

      {/* THREE-WAY COMPARISON MODAL */}
      {selectedInvoice && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-white/10 w-full max-w-5xl rounded-2xl flex flex-col overflow-hidden shadow-2xl max-h-[90vh]">
               {/* Header */}
               <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-zinc-900">
                  <div>
                     <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        Three-Way Match Comparison
                        <span className={`text-xs px-2 py-1 rounded border ${getMatchTypeStyle(selectedInvoice.type)}`}>{selectedInvoice.type}</span>
                     </h2>
                     <p className="text-sm text-zinc-400 mt-1">Comparing Invoice <span className="text-white font-mono">{selectedInvoice.id}</span> across sources</p>
                  </div>
                  <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white">
                     <X className="h-5 w-5" />
                  </button>
               </div>

               {/* Comparison Grid */}
               <div className="flex-1 overflow-y-auto p-6 bg-background">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     
                     {/* Column 1: Your Books */}
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="h-8 w-8 rounded bg-zinc-800 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-zinc-400" />
                           </div>
                           <h3 className="font-semibold text-white">Your Books</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-3 text-sm">
                           <div className="flex justify-between">
                              <span className="text-zinc-500">Invoice No</span>
                              <span className="text-white font-mono">{selectedInvoice.id}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-zinc-500">Date</span>
                              <span className="text-white">{selectedInvoice.date}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-zinc-500">Vendor</span>
                              <span className="text-white">{selectedInvoice.vendor}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-zinc-500">GSTIN</span>
                              <span className="text-white font-mono">{selectedInvoice.gstin}</span>
                           </div>
                           <div className="h-px bg-white/5 my-2"></div>
                           <div className="flex justify-between">
                              <span className="text-zinc-500">Taxable</span>
                              <span className="text-white font-mono">₹{(selectedInvoice.amount * 0.82).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-zinc-500">GST (18%)</span>
                              <span className="text-white font-mono">₹{(selectedInvoice.amount * 0.18).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between pt-2 border-t border-white/5">
                              <span className="text-zinc-400 font-medium">Total</span>
                              <span className="text-white font-bold font-mono">₹{selectedInvoice.amount.toLocaleString()}</span>
                           </div>
                        </div>
                     </div>

                     {/* Column 2: GSTR-2B */}
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="h-8 w-8 rounded bg-emerald-500/10 flex items-center justify-center">
                              <ShieldCheck className="h-4 w-4 text-emerald-500" />
                           </div>
                           <h3 className="font-semibold text-emerald-500">GSTR-2B</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3 text-sm relative">
                           {/* Checkmarks overlay logic could be added here */}
                           <div className="flex justify-between">
                              <span className="text-zinc-500">Invoice No</span>
                              <span className="text-white font-mono flex items-center gap-1">{selectedInvoice.id} <CheckCircle2 className="h-3 w-3 text-emerald-500" /></span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-zinc-500">Date</span>
                              <span className="text-white flex items-center gap-1">{selectedInvoice.date} <CheckCircle2 className="h-3 w-3 text-emerald-500" /></span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-zinc-500">Vendor</span>
                              <span className="text-white flex items-center gap-1">{selectedInvoice.vendor} <CheckCircle2 className="h-3 w-3 text-emerald-500" /></span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-zinc-500">GSTIN</span>
                              <span className="text-white font-mono flex items-center gap-1">{selectedInvoice.gstin} <CheckCircle2 className="h-3 w-3 text-emerald-500" /></span>
                           </div>
                           <div className="h-px bg-white/5 my-2"></div>
                           <div className="flex justify-between">
                              <span className="text-zinc-500">Taxable</span>
                              <span className="text-white font-mono flex items-center gap-1">₹{(selectedInvoice.gstr2bAmount * 0.82).toFixed(2)} <CheckCircle2 className="h-3 w-3 text-emerald-500" /></span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-zinc-500">GST (18%)</span>
                              <span className="text-white font-mono flex items-center gap-1">₹{(selectedInvoice.gstr2bAmount * 0.18).toFixed(2)} <CheckCircle2 className="h-3 w-3 text-emerald-500" /></span>
                           </div>
                           <div className="flex justify-between pt-2 border-t border-emerald-500/20">
                              <span className="text-zinc-400 font-medium">Total</span>
                              <span className="text-white font-bold font-mono flex items-center gap-1">₹{selectedInvoice.gstr2bAmount.toLocaleString()} <CheckCircle2 className="h-3 w-3 text-emerald-500" /></span>
                           </div>
                        </div>
                     </div>

                     {/* Column 3: GSTR-2A */}
                     <div className="space-y-4 opacity-70">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="h-8 w-8 rounded bg-zinc-800 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-zinc-500" />
                           </div>
                           <h3 className="font-semibold text-zinc-400">GSTR-2A (Optional)</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-3 text-sm">
                           <div className="flex justify-between">
                              <span className="text-zinc-600">Invoice No</span>
                              <span className="text-zinc-400 font-mono">{selectedInvoice.id}</span>
                           </div>
                           <div className="flex justify-center items-center h-40 text-zinc-600 text-xs italic">
                              Matching GSTR-2A data available
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Footer */}
               <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col">
                        <span className="text-xs text-zinc-500 uppercase font-medium">Match Confidence</span>
                        <span className="text-lg font-bold text-emerald-500">{selectedInvoice.confidence}%</span>
                     </div>
                     <div className="w-px h-8 bg-white/10"></div>
                     <div className="flex flex-col">
                        <span className="text-xs text-zinc-500 uppercase font-medium">ITC Status</span>
                        <span className="text-lg font-bold text-white">Eligible - ₹{selectedInvoice.itc.toLocaleString()}</span>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button className="px-4 py-2 rounded-lg border border-white/10 text-zinc-300 text-sm hover:bg-white/5 transition-colors flex items-center gap-2">
                        <Download className="h-4 w-4" /> Download PDF
                     </button>
                     <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-colors flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Mark as Reviewed
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
