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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-8 space-y-6">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Validation Queue</h1>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-xs font-semibold border border-emerald-200">Quality Control</span>
          </div>
          <p className="text-gray-600 text-sm">Review and fix invoice validation issues</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
             <Download className="h-4 w-4" /> Export Issues
           </button>
           <button className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 shadow-lg">
             <RefreshCw className="h-4 w-4" /> Re-validate All
           </button>
        </div>
      </div>

      {/* 2. STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setActiveTab('pass')}
          className={`p-4 rounded-xl border transition-all text-left group shadow-sm ${activeTab === 'pass' ? 'bg-emerald-50 border-emerald-200 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
        >
           <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">789</div>
                <div className={`text-xs font-medium ${activeTab === 'pass' ? 'text-emerald-700' : 'text-gray-600'}`}>Passed Invoices</div>
              </div>
              <div className={`p-2 rounded-lg ${activeTab === 'pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                 <CheckCircle2 className="h-5 w-5" />
              </div>
           </div>
           <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[96%]"></div>
           </div>
           <p className="text-[10px] text-gray-500 mt-2 group-hover:text-emerald-600 transition-colors">Ready for reconciliation</p>
        </button>

        <button 
          onClick={() => setActiveTab('fail')}
          className={`p-4 rounded-xl border transition-all text-left group shadow-sm ${activeTab === 'fail' ? 'bg-red-50 border-red-200 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
        >
           <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">11</div>
                <div className={`text-xs font-medium ${activeTab === 'fail' ? 'text-red-700' : 'text-gray-600'}`}>Failed Validation</div>
              </div>
              <div className={`p-2 rounded-lg ${activeTab === 'fail' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                 <XCircle className="h-5 w-5" />
              </div>
           </div>
           <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-[4%]"></div>
           </div>
           <p className="text-[10px] text-gray-500 mt-2 group-hover:text-red-600 transition-colors">Requires immediate action</p>
        </button>

        <button 
          onClick={() => setActiveTab('partial')}
          className={`p-4 rounded-xl border transition-all text-left group shadow-sm ${activeTab === 'partial' ? 'bg-amber-50 border-amber-200 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
        >
           <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">23</div>
                <div className={`text-xs font-medium ${activeTab === 'partial' ? 'text-amber-700' : 'text-gray-600'}`}>Partial Match</div>
              </div>
              <div className={`p-2 rounded-lg ${activeTab === 'partial' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                 <AlertTriangle className="h-5 w-5" />
              </div>
           </div>
           <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[8%]"></div>
           </div>
           <p className="text-[10px] text-gray-500 mt-2 group-hover:text-amber-600 transition-colors">Minor issues detected</p>
        </button>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-2">
         <button 
           onClick={() => setActiveTab('fail')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'fail' ? 'border-red-500 text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
         >
           Failed <span className="bg-red-100 text-red-700 px-1.5 rounded text-xs border border-red-200">11</span>
         </button>
         <button 
           onClick={() => setActiveTab('partial')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'partial' ? 'border-amber-500 text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
         >
           Partial <span className="bg-amber-100 text-amber-700 px-1.5 rounded text-xs border border-amber-200">23</span>
         </button>
         <button 
           onClick={() => setActiveTab('pass')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pass' ? 'border-emerald-500 text-gray-900' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
         >
           Passed <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded text-xs border border-emerald-200">789</span>
         </button>
      </div>

      {/* 4. CONTENT TABLES */}
      <div className="min-h-[400px]">
         
         {/* FAILED TAB */}
         {activeTab === 'fail' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
               {failedInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200 shadow-sm">
                     <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-4" />
                     <p className="text-lg font-medium text-gray-900">No failed invoices!</p>
                     <p className="text-sm text-gray-600">All validations are clear.</p>
                  </div>
               ) : (
                 failedInvoices.map((inv) => (
                   <div key={inv.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden border-l-4 border-l-red-500">
                      {/* Header Row */}
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleRow(inv.id)}
                      >
                         <div className="flex items-center gap-4">
                            <button className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-gray-900' : 'text-gray-500'}`}>
                               <ChevronRight className="h-5 w-5" />
                            </button>
                            <div>
                               <div className="flex items-center gap-3">
                                  <span className="font-bold text-gray-900">{inv.id}</span>
                                  <span className="text-xs text-gray-500">{inv.date}</span>
                               </div>
                               <p className="text-sm text-gray-700 mt-0.5">{inv.vendor}</p>
                            </div>
                         </div>

                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-sm font-bold text-gray-900">₹{inv.amount.toLocaleString()}</p>
                               <p className="text-[10px] text-gray-500 uppercase">Total Amount</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold border border-red-200">{inv.errors.length} Errors</span>
                               <span className={`px-2 py-1 rounded text-xs font-medium border ${inv.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                  {inv.priority} Priority
                               </span>
                            </div>
                         </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedRows.includes(inv.id) && (
                         <div className="bg-gray-50 border-t border-gray-200 p-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-4">
                               {inv.errors.map((err, idx) => (
                                  <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-red-50 border border-red-200">
                                     <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                     <div className="flex-1">
                                        <h4 className="text-sm font-bold text-red-900">{err.message}</h4>
                                        {err.expected && (
                                           <div className="mt-2 grid grid-cols-2 gap-4 max-w-md text-sm">
                                              <div className="bg-white p-2 rounded border border-gray-200 shadow-sm">
                                                 <span className="text-gray-600 text-xs uppercase block mb-1">Found</span>
                                                 <span className="text-red-700 font-mono">{err.found}</span>
                                              </div>
                                              <div className="bg-emerald-50 p-2 rounded border border-emerald-200 shadow-sm">
                                                 <span className="text-gray-600 text-xs uppercase block mb-1">Expected</span>
                                                 <span className="text-emerald-700 font-mono">{err.expected}</span>
                                              </div>
                                           </div>
                                        )}
                                        {err.detail && <p className="text-sm text-gray-600 mt-1">{err.detail}</p>}
                                     </div>
                                     <button className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-sm text-gray-700 transition-colors shadow-sm">
                                        Fix Now
                                     </button>
                                  </div>
                               ))}
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                               <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors">
                                  <Trash2 className="h-4 w-4" /> Delete
                               </button>
                               <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                                  <Send className="h-4 w-4" /> Request Re-upload
                               </button>
                               <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-lg transition-colors">
                                  <Wrench className="h-4 w-4" /> Fix All Issues
                               </button>
                            </div>
                         </div>
                      )}
                   </div>
                 ))
               )}
            </div>
         )}

         {/* PARTIAL TAB */}
         {activeTab === 'partial' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="flex justify-end mb-2">
                  <button className="text-sm text-amber-600 hover:text-amber-700 font-medium bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">Accept All Warnings</button>
               </div>
               {partialInvoices.map((inv) => (
                   <div key={inv.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden border-l-4 border-l-amber-500">
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleRow(inv.id)}
                      >
                         <div className="flex items-center gap-4">
                            <button className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-gray-900' : 'text-gray-500'}`}>
                               <ChevronRight className="h-5 w-5" />
                            </button>
                            <div>
                               <div className="flex items-center gap-3">
                                  <span className="font-bold text-gray-900">{inv.id}</span>
                                  <span className="text-xs text-gray-500">{inv.date}</span>
                               </div>
                               <p className="text-sm text-gray-700 mt-0.5">{inv.vendor}</p>
                            </div>
                         </div>

                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-sm font-bold text-gray-900">₹{inv.amount.toLocaleString()}</p>
                               <p className="text-[10px] text-gray-500 uppercase">Total Amount</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">{inv.warnings.length} Warnings</span>
                            </div>
                         </div>
                      </div>

                      {expandedRows.includes(inv.id) && (
                         <div className="bg-gray-50 border-t border-gray-200 p-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-4">
                               {inv.warnings.map((warn, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                                     <div className="flex items-center gap-3">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                        <div>
                                           <h4 className="text-sm font-medium text-amber-900">{warn.message}</h4>
                                           <p className="text-xs text-gray-600">Impact: {warn.impact}</p>
                                        </div>
                                     </div>
                                     <div className="flex gap-2">
                                        <button className="px-3 py-1.5 text-xs rounded border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100">Fix</button>
                                        <button className="px-3 py-1.5 text-xs rounded border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100">Ignore</button>
                                     </div>
                                  </div>
                               ))}
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                               <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                                  Mark for Review
                               </button>
                               <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-700 hover:to-teal-700 shadow-lg transition-colors flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" /> Accept & Approve
                               </button>
                            </div>
                         </div>
                      )}
                   </div>
               ))}
            </div>
         )}

         {/* PASS TAB */}
         {activeTab === 'pass' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="flex justify-end mb-2">
                  <button className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 font-medium bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200 shadow-sm">
                     <CheckCircle2 className="h-4 w-4" /> Approve All Validated
                  </button>
               </div>
               <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
                        <tr>
                           <th className="px-6 py-3">Invoice No</th>
                           <th className="px-6 py-3">Date</th>
                           <th className="px-6 py-3">Vendor</th>
                           <th className="px-6 py-3 text-right">Amount</th>
                           <th className="px-6 py-3 text-center">Validation</th>
                           <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200">
                        {passedInvoices.map((inv) => (
                           <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-900">{inv.id}</td>
                              <td className="px-6 py-4 text-gray-600">{inv.date}</td>
                              <td className="px-6 py-4 text-gray-700">{inv.vendor}</td>
                              <td className="px-6 py-4 text-right font-mono text-gray-900">₹{inv.amount.toLocaleString()}</td>
                              <td className="px-6 py-4 text-center">
                                 <span className="text-xs text-emerald-700 flex items-center justify-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Passed {inv.validatedAt}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 ml-auto text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-100">
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
