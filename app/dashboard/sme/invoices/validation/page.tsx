'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Wrench, 
  Send, 
  Trash2, 
  FileText,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Mock Data
const failedInvoices = [
  { id: 'INV-ERR-01', date: '18 Nov 2025', vendor: 'ABC Enterprises', amount: 53808, errors: [
    { type: 'critical', message: 'GSTIN format invalid', expected: '15-digit format', found: '27ABCDE1234F1Z' },
    { type: 'critical', message: 'Invoice number duplicate', detail: 'Duplicate of INV-001234 from 15 Nov' }
  ], priority: 'High' },
  { id: 'INV-ERR-02', date: '17 Nov 2025', vendor: 'Office Supplies Co', amount: 4130, errors: [
    { type: 'critical', message: 'Total amount mismatch', expected: '₹4,130', found: '₹4,100' }
  ], priority: 'Medium' },
];

const partialInvoices = [
  { id: 'INV-WARN-01', date: '18 Nov 2025', vendor: 'TechSol Solutions', amount: 14160, warnings: [
    { type: 'warning', message: 'Tax calculation minor mismatch', impact: 'Minor (₹0.50 diff)' },
    { type: 'warning', message: 'HSN code not found in master', impact: 'Informational' }
  ] },
  { id: 'INV-WARN-02', date: '16 Nov 2025', vendor: 'Reddy Traders', amount: 28320, warnings: [
     { type: 'warning', message: 'Vendor filing status unknown', impact: 'ITC Risk' }
  ] }
];

const passedInvoices = [
  { id: 'INV-PASS-01', date: '18 Nov 2025', vendor: 'Global Logistics', amount: 100300, validatedAt: '2 mins ago' },
  { id: 'INV-PASS-02', date: '18 Nov 2025', vendor: 'Alpha Systems', amount: 14160, validatedAt: '10 mins ago' },
];

export default function ValidationQueuePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'fail' | 'partial' | 'pass'>('fail');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Validation Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and fix invoice validation issues</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Download className="h-4 w-4" /> Export Issues
           </button>
           <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
             <RefreshCw className="h-4 w-4" /> Re-validate All
           </button>
        </div>
      </div>

      {/* 2. STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setActiveTab('pass')}
          className={`p-4 rounded-xl border transition-all text-left group ${activeTab === 'pass' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-900'}`}
        >
           <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold text-white mb-1">789</div>
                <div className={`text-xs font-medium ${activeTab === 'pass' ? 'text-emerald-400' : 'text-zinc-400'}`}>Passed Invoices</div>
              </div>
              <div className={`p-2 rounded-lg ${activeTab === 'pass' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                 <CheckCircle2 className="h-5 w-5" />
              </div>
           </div>
           <div className="mt-3 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[96%]"></div>
           </div>
           <p className="text-[10px] text-zinc-500 mt-2 group-hover:text-emerald-400/70 transition-colors">Ready for reconciliation</p>
        </button>

        <button 
          onClick={() => setActiveTab('fail')}
          className={`p-4 rounded-xl border transition-all text-left group ${activeTab === 'fail' ? 'bg-red-500/10 border-red-500/50' : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-900'}`}
        >
           <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold text-white mb-1">11</div>
                <div className={`text-xs font-medium ${activeTab === 'fail' ? 'text-red-400' : 'text-zinc-400'}`}>Failed Validation</div>
              </div>
              <div className={`p-2 rounded-lg ${activeTab === 'fail' ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-500'}`}>
                 <XCircle className="h-5 w-5" />
              </div>
           </div>
           <div className="mt-3 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-[4%]"></div>
           </div>
           <p className="text-[10px] text-zinc-500 mt-2 group-hover:text-red-400/70 transition-colors">Requires immediate action</p>
        </button>

        <button 
          onClick={() => setActiveTab('partial')}
          className={`p-4 rounded-xl border transition-all text-left group ${activeTab === 'partial' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-900'}`}
        >
           <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold text-white mb-1">23</div>
                <div className={`text-xs font-medium ${activeTab === 'partial' ? 'text-amber-400' : 'text-zinc-400'}`}>Partial Match</div>
              </div>
              <div className={`p-2 rounded-lg ${activeTab === 'partial' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-500'}`}>
                 <AlertTriangle className="h-5 w-5" />
              </div>
           </div>
           <div className="mt-3 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[8%]"></div>
           </div>
           <p className="text-[10px] text-zinc-500 mt-2 group-hover:text-amber-400/70 transition-colors">Minor issues detected</p>
        </button>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex border-b border-white/5">
         <button 
           onClick={() => setActiveTab('fail')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'fail' ? 'border-red-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
         >
           Failed <span className="bg-red-500/20 text-red-500 px-1.5 rounded text-xs">11</span>
         </button>
         <button 
           onClick={() => setActiveTab('partial')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'partial' ? 'border-amber-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
         >
           Partial <span className="bg-amber-500/20 text-amber-500 px-1.5 rounded text-xs">23</span>
         </button>
         <button 
           onClick={() => setActiveTab('pass')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pass' ? 'border-emerald-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
         >
           Passed <span className="bg-emerald-500/20 text-emerald-500 px-1.5 rounded text-xs">789</span>
         </button>
      </div>

      {/* 4. CONTENT TABLES */}
      <div className="min-h-[400px]">
         
         {/* FAILED TAB */}
         {activeTab === 'fail' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
               {failedInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                     <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
                     <p className="text-lg font-medium text-white">No failed invoices!</p>
                     <p className="text-sm">All validations are clear.</p>
                  </div>
               ) : (
                 failedInvoices.map((inv) => (
                   <GlassPanel key={inv.id} className="p-0 overflow-hidden border-l-4 border-l-red-500">
                      {/* Header Row */}
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => toggleRow(inv.id)}
                      >
                         <div className="flex items-center gap-4">
                            <button className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-white' : 'text-zinc-500'}`}>
                               <ChevronRight className="h-5 w-5" />
                            </button>
                            <div>
                               <div className="flex items-center gap-3">
                                  <span className="font-bold text-white">{inv.id}</span>
                                  <span className="text-xs text-zinc-400">{inv.date}</span>
                               </div>
                               <p className="text-sm text-zinc-300 mt-0.5">{inv.vendor}</p>
                            </div>
                         </div>

                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-sm font-bold text-white">₹{inv.amount.toLocaleString()}</p>
                               <p className="text-[10px] text-zinc-500 uppercase">Total Amount</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">{inv.errors.length} Errors</span>
                               <span className={`px-2 py-1 rounded text-xs font-medium border ${inv.priority === 'High' ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                  {inv.priority} Priority
                               </span>
                            </div>
                         </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedRows.includes(inv.id) && (
                         <div className="bg-zinc-900/50 border-t border-white/5 p-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-4">
                               {inv.errors.map((err, idx) => (
                                  <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                                     <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                     <div className="flex-1">
                                        <h4 className="text-sm font-bold text-red-400">{err.message}</h4>
                                        {err.expected && (
                                           <div className="mt-2 grid grid-cols-2 gap-4 max-w-md text-sm">
                                              <div className="bg-black/20 p-2 rounded border border-white/5">
                                                 <span className="text-zinc-500 text-xs uppercase block mb-1">Found</span>
                                                 <span className="text-red-300 font-mono">{err.found}</span>
                                              </div>
                                              <div className="bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                                                 <span className="text-zinc-500 text-xs uppercase block mb-1">Expected</span>
                                                 <span className="text-emerald-300 font-mono">{err.expected}</span>
                                              </div>
                                           </div>
                                        )}
                                        {err.detail && <p className="text-sm text-zinc-400 mt-1">{err.detail}</p>}
                                     </div>
                                     <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-colors">
                                        Fix Now
                                     </button>
                                  </div>
                               ))}
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-4">
                               <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-300 hover:text-red-400 hover:bg-white/5 transition-colors">
                                  <Trash2 className="h-4 w-4" /> Delete
                               </button>
                               <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                                  <Send className="h-4 w-4" /> Request Re-upload
                               </button>
                               <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 shadow-lg shadow-red-500/20 transition-colors">
                                  <Wrench className="h-4 w-4" /> Fix All Issues
                               </button>
                            </div>
                         </div>
                      )}
                   </GlassPanel>
                 ))
               )}
            </div>
         )}

         {/* PARTIAL TAB */}
         {activeTab === 'partial' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="flex justify-end mb-2">
                  <button className="text-sm text-amber-500 hover:text-amber-400 font-medium">Accept All Warnings</button>
               </div>
               {partialInvoices.map((inv) => (
                   <GlassPanel key={inv.id} className="p-0 overflow-hidden border-l-4 border-l-amber-500">
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => toggleRow(inv.id)}
                      >
                         <div className="flex items-center gap-4">
                            <button className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-white' : 'text-zinc-500'}`}>
                               <ChevronRight className="h-5 w-5" />
                            </button>
                            <div>
                               <div className="flex items-center gap-3">
                                  <span className="font-bold text-white">{inv.id}</span>
                                  <span className="text-xs text-zinc-400">{inv.date}</span>
                               </div>
                               <p className="text-sm text-zinc-300 mt-0.5">{inv.vendor}</p>
                            </div>
                         </div>

                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-sm font-bold text-white">₹{inv.amount.toLocaleString()}</p>
                               <p className="text-[10px] text-zinc-500 uppercase">Total Amount</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">{inv.warnings.length} Warnings</span>
                            </div>
                         </div>
                      </div>

                      {expandedRows.includes(inv.id) && (
                         <div className="bg-zinc-900/50 border-t border-white/5 p-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-4">
                               {inv.warnings.map((warn, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                     <div className="flex items-center gap-3">
                                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                        <div>
                                           <h4 className="text-sm font-medium text-amber-200">{warn.message}</h4>
                                           <p className="text-xs text-zinc-500">Impact: {warn.impact}</p>
                                        </div>
                                     </div>
                                     <div className="flex gap-2">
                                        <button className="px-3 py-1.5 text-xs rounded border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5">Fix</button>
                                        <button className="px-3 py-1.5 text-xs rounded border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5">Ignore</button>
                                     </div>
                                  </div>
                               ))}
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-white/5 pt-4">
                               <button className="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                                  Mark for Review
                               </button>
                               <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-colors flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" /> Accept & Approve
                               </button>
                            </div>
                         </div>
                      )}
                   </GlassPanel>
               ))}
            </div>
         )}

         {/* PASS TAB */}
         {activeTab === 'pass' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="flex justify-end mb-2">
                  <button className="flex items-center gap-2 text-sm text-primary hover:text-emerald-400 font-medium bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                     <CheckCircle2 className="h-4 w-4" /> Approve All Validated
                  </button>
               </div>
               <div className="rounded-xl border border-white/5 overflow-hidden">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-white/5 text-zinc-500 font-medium">
                        <tr>
                           <th className="px-6 py-3">Invoice No</th>
                           <th className="px-6 py-3">Date</th>
                           <th className="px-6 py-3">Vendor</th>
                           <th className="px-6 py-3 text-right">Amount</th>
                           <th className="px-6 py-3 text-center">Validation</th>
                           <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5 bg-zinc-900/30">
                        {passedInvoices.map((inv) => (
                           <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-medium text-white">{inv.id}</td>
                              <td className="px-6 py-4 text-zinc-400">{inv.date}</td>
                              <td className="px-6 py-4 text-zinc-300">{inv.vendor}</td>
                              <td className="px-6 py-4 text-right font-mono text-white">₹{inv.amount.toLocaleString()}</td>
                              <td className="px-6 py-4 text-center">
                                 <span className="text-xs text-emerald-500 flex items-center justify-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Passed {inv.validatedAt}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button className="text-zinc-400 hover:text-white flex items-center gap-1 ml-auto text-xs border border-zinc-700 rounded px-2 py-1 hover:bg-zinc-800">
                                    Move to Register <ArrowRight className="h-3 w-3" />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

      </div>
    </div>
  );
}
