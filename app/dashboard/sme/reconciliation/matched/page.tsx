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
      case 'Exact Match': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Fuzzy Match': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'HSN Match': return 'bg-purple-50 text-purple-700 border border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              <span className="text-emerald-700 font-bold text-sm uppercase tracking-wide">Matched Invoices</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Successfully Reconciled</h1>
            <p className="text-gray-600 text-sm mt-1">Invoices matched across all sources with high confidence</p>
          </div>
          <div className="flex items-center gap-3">
             <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all flex items-center gap-2 shadow-sm">
               <Download className="h-4 w-4" /> Export Matched
             </button>
             <button className="btn-primary-custom px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
               <CheckCircle2 className="h-4 w-4" /> Mark All Reviewed
             </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between shadow-sm">
           <div className="flex flex-wrap items-center gap-3 w-full">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2 appearance-none cursor-pointer hover:bg-gray-50">
                  <option>Last Run (Nov)</option>
                  <option>October 2025</option>
                  <option>Custom Range</option>
                </select>
              </div>

              <div className="w-px h-8 bg-gray-200 hidden md:block"></div>

              <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-50">
                <option>All Vendors</option>
                <option>ABC Enterprises</option>
                <option>TechSol Solutions</option>
              </select>

              <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer hover:bg-gray-50">
                <option>All Match Types</option>
                <option>Exact Match</option>
                <option>Fuzzy Match</option>
                <option>HSN Match</option>
              </select>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input type="text" className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2 placeholder-gray-400" placeholder="Search by invoice number..." />
              </div>
           </div>
        </div>
      </div>

      {/* 2. SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-gray-500">Total Matched</p>
               <h3 className="text-3xl font-bold text-gray-900 mt-2">789</h3>
               <p className="text-xs text-gray-500 mt-1">92% of total invoices</p>
             </div>
             <div className="text-right">
                <p className="text-sm text-emerald-600 font-bold">ITC Secured</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹ 7,54,230</h3>
             </div>
           </div>
           <div className="mt-4 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 w-[92%]"></div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center gap-6">
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
                 <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} itemStyle={{color: '#111827'}} />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="flex-1 space-y-2">
             <p className="text-sm font-bold text-gray-900 mb-1">Match Type Breakdown</p>
             <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {matchBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                        <span className="text-gray-600">{item.name}</span>
                     </div>
                     <span className="text-gray-900 font-mono font-bold">{item.value}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>

      {/* 3. DATA TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col min-h-[500px]">
         <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <span className="text-sm text-gray-900 font-bold">789 Matched Invoices</span>
            {selectedRows.length > 0 && (
               <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-sm text-gray-600">{selectedRows.length} selected</span>
                  <div className="flex items-center rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                     <button className="px-3 py-1.5 text-xs hover:bg-emerald-50 text-emerald-600 font-bold border-r border-gray-200">Mark Reviewed</button>
                     <button className="px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700 font-medium">Export</button>
                  </div>
               </div>
            )}
         </div>

         <div className="flex-1 overflow-auto">
           <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-white text-gray-600 font-bold sticky top-0 z-10 border-b border-gray-200">
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
              <tbody className="divide-y divide-gray-200">
                 {matchedInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                       <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded bg-white border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            checked={selectedRows.includes(inv.id)}
                            onChange={() => toggleRowSelection(inv.id)}
                          />
                       </td>
                       <td className="px-6 py-4">
                          <button onClick={() => setSelectedInvoice(inv)} className="font-bold text-gray-900 hover:text-emerald-600 hover:underline">
                             {inv.id}
                          </button>
                       </td>
                       <td className="px-6 py-4 text-gray-600">{inv.date}</td>
                       <td className="px-6 py-4">
                          <div className="flex flex-col">
                             <span className="text-gray-900 font-medium">{inv.vendor}</span>
                             <span className="text-[10px] text-gray-500 font-mono">{inv.gstin}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right text-gray-900 font-mono font-semibold">₹{inv.amount.toLocaleString()}</td>
                       <td className="px-6 py-4 text-right text-gray-900 font-mono font-semibold">
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
                       <td className="px-6 py-4 text-right font-bold text-emerald-600 font-mono">₹{inv.itc.toLocaleString()}</td>
                       <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${inv.status === 'Reviewed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                             {inv.status}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors" title="View Details">
                                <Eye className="h-4 w-4" />
                             </button>
                             <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors">
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
         <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
           <div className="text-xs text-gray-600">Showing 1-5 of 789</div>
           <div className="flex items-center gap-2">
              <div className="flex gap-1">
                 <button className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 text-xs hover:bg-gray-50" disabled>Previous</button>
                 <button className="px-3 py-1.5 rounded-lg btn-primary-custom text-white text-xs font-medium shadow-sm">1</button>
                 <button className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs hover:bg-gray-50">2</button>
                 <button className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs hover:bg-gray-50">Next</button>
              </div>
           </div>
         </div>
      </div>

      {/* THREE-WAY COMPARISON MODAL */}
      {selectedInvoice && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200 w-full max-w-5xl rounded-2xl flex flex-col overflow-hidden shadow-2xl max-h-[90vh]">
               {/* Header */}
               <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                  <div>
                     <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        Three-Way Match Comparison
                        <span className={`text-xs px-2 py-1 rounded border ${getMatchTypeStyle(selectedInvoice.type)}`}>{selectedInvoice.type}</span>
                     </h2>
                     <p className="text-sm text-gray-600 mt-1">Comparing Invoice <span className="text-gray-900 font-mono font-semibold">{selectedInvoice.id}</span> across sources</p>
                  </div>
                  <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors">
                     <X className="h-5 w-5" />
                  </button>
               </div>

               {/* Comparison Grid */}
               <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     
                     {/* Column 1: Your Books */}
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-gray-600" />
                           </div>
                           <h3 className="font-semibold text-gray-900">Your Books</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-3 text-sm shadow-sm">
                           <div className="flex justify-between">
                              <span className="text-gray-500">Invoice No</span>
                              <span className="text-gray-900 font-mono font-semibold">{selectedInvoice.id}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-gray-500">Date</span>
                              <span className="text-gray-900">{selectedInvoice.date}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-gray-500">Vendor</span>
                              <span className="text-gray-900">{selectedInvoice.vendor}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-gray-500">GSTIN</span>
                              <span className="text-gray-900 font-mono">{selectedInvoice.gstin}</span>
                           </div>
                           <div className="h-px bg-gray-200 my-2"></div>
                           <div className="flex justify-between">
                              <span className="text-gray-500">Taxable</span>
                              <span className="text-gray-900 font-mono">₹{(selectedInvoice.amount * 0.82).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-gray-500">GST (18%)</span>
                              <span className="text-gray-900 font-mono">₹{(selectedInvoice.amount * 0.18).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between pt-2 border-t border-gray-200">
                              <span className="text-gray-600 font-medium">Total</span>
                              <span className="text-gray-900 font-bold font-mono">₹{selectedInvoice.amount.toLocaleString()}</span>
                           </div>
                        </div>
                     </div>

                     {/* Column 2: GSTR-2B */}
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="h-8 w-8 rounded bg-emerald-100 flex items-center justify-center">
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                           </div>
                           <h3 className="font-semibold text-emerald-600">GSTR-2B</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-sm relative shadow-sm">
                           {/* Checkmarks overlay logic could be added here */}
                           <div className="flex justify-between">
                              <span className="text-gray-500">Invoice No</span>
                              <span className="text-gray-900 font-mono font-semibold flex items-center gap-1">{selectedInvoice.id} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-gray-500">Date</span>
                              <span className="text-gray-900 flex items-center gap-1">{selectedInvoice.date} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-gray-500">Vendor</span>
                              <span className="text-gray-900 flex items-center gap-1">{selectedInvoice.vendor} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-gray-500">GSTIN</span>
                              <span className="text-gray-900 font-mono flex items-center gap-1">{selectedInvoice.gstin} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span>
                           </div>
                           <div className="h-px bg-emerald-200 my-2"></div>
                           <div className="flex justify-between">
                              <span className="text-gray-500">Taxable</span>
                              <span className="text-gray-900 font-mono flex items-center gap-1">₹{(selectedInvoice.gstr2bAmount * 0.82).toFixed(2)} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-gray-500">GST (18%)</span>
                              <span className="text-gray-900 font-mono flex items-center gap-1">₹{(selectedInvoice.gstr2bAmount * 0.18).toFixed(2)} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span>
                           </div>
                           <div className="flex justify-between pt-2 border-t border-emerald-200">
                              <span className="text-gray-600 font-medium">Total</span>
                              <span className="text-gray-900 font-bold font-mono flex items-center gap-1">₹{selectedInvoice.gstr2bAmount.toLocaleString()} <CheckCircle2 className="h-3 w-3 text-emerald-600" /></span>
                           </div>
                        </div>
                     </div>

                     {/* Column 3: GSTR-2A */}
                     <div className="space-y-4 opacity-60">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-gray-400" />
                           </div>
                           <h3 className="font-semibold text-gray-500">GSTR-2A (Optional)</h3>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-3 text-sm shadow-sm">
                           <div className="flex justify-between">
                              <span className="text-gray-400">Invoice No</span>
                              <span className="text-gray-500 font-mono">{selectedInvoice.id}</span>
                           </div>
                           <div className="flex justify-center items-center h-40 text-gray-400 text-xs italic">
                              Matching GSTR-2A data available
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Footer */}
               <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-medium">Match Confidence</span>
                        <span className="text-lg font-bold text-emerald-600">{selectedInvoice.confidence}%</span>
                     </div>
                     <div className="w-px h-8 bg-gray-300"></div>
                     <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-medium">ITC Status</span>
                        <span className="text-lg font-bold text-gray-900">Eligible - ₹{selectedInvoice.itc.toLocaleString()}</span>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Download className="h-4 w-4" /> Download PDF
                     </button>
                     <button className="px-4 py-2 rounded-lg btn-primary-custom text-white text-sm font-bold hover:shadow-lg transition-all flex items-center gap-2 shadow-md">
                        <CheckCircle2 className="h-4 w-4" /> Mark as Reviewed
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      </div>
    </div>
  );
}
