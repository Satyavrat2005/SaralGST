'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertOctagon, 
  ArrowRight, 
  AlertTriangle, 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Download, 
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Phone
} from 'lucide-react';

// Mock Data
const missingInBooks = [
  { id: 'INV-005678', date: '15 Nov 2025', vendor: 'XYZ Suppliers Ltd', gstin: '27XYZAB1234C1Z5', amount: 34560, gst: 6220, reason: 'Not Uploaded', status: 'Active' },
  { id: 'INV-005679', date: '14 Nov 2025', vendor: 'Alpha Systems', gstin: '33ALPHA9876Z1Z3', amount: 12000, gst: 2160, reason: 'Validation Failed', status: 'Active' },
];

const missingInGSTR2B = [
  { id: 'INV-001234', date: '12 Nov 2025', vendor: 'ABC Enterprises', gstin: '27ABCDE1234F1Z5', amount: 45600, gst: 8208, daysPending: 11, filingStatus: 'Not Filed', lastReminder: '2 days ago' },
  { id: 'INV-001299', date: '01 Nov 2025', vendor: 'Global Logistics', gstin: '07KLMNO4321J1Z9', amount: 15000, gst: 2700, daysPending: 22, filingStatus: 'Missing in Return', lastReminder: 'Never' },
];

const valueMismatches = [
  { id: 'INV-003456', date: '20 Nov 2025', vendor: 'LMN Traders', bookAmount: 53808, gstr2bAmount: 53800, diff: 8, type: 'Rounding', withinTolerance: true },
  { id: 'INV-003457', date: '19 Nov 2025', vendor: 'PQR Industries', bookAmount: 11800, gstr2bAmount: 10000, diff: 1800, type: 'GST Amount', withinTolerance: false },
];

export default function DiscrepanciesPage() {
  const [activeTab, setActiveTab] = useState<'books' | 'gstr2b' | 'value'>('books');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-2">
            <span className="text-emerald-700 text-xs font-semibold">RECONCILIATION</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Discrepancies</h1>
          <p className="text-gray-600 text-sm mt-1">Invoices that didn't match or have differences</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm">
             <MessageSquare className="h-4 w-4" /> Send Bulk Reminders
           </button>
           <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm">
             <Download className="h-4 w-4" /> Export All
           </button>
        </div>
      </div>

      {/* 2. SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
           <div className="flex flex-col h-full justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Discrepancies</p>
              <div>
                 <h3 className="text-3xl font-bold text-gray-900">67</h3>
                 <p className="text-xs text-emerald-600 mt-1">↓ 12% vs last month</p>
              </div>
           </div>
        </div>

        <div 
          className={`bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-200 shadow-lg p-5 cursor-pointer transition-all ${activeTab === 'books' ? 'ring-2 ring-orange-400' : 'hover:border-orange-300'}`}
          onClick={() => setActiveTab('books')}
        >
           <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <AlertOctagon className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-xs text-orange-700 uppercase tracking-wider font-semibold">Missing in Books</p>
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-gray-900">34</h3>
                 <p className="text-xs text-gray-600 mt-1">ITC at Risk: <span className="text-orange-700 font-semibold">₹2.24 L</span></p>
              </div>
           </div>
        </div>

        <div 
          className={`bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-200 shadow-lg p-5 cursor-pointer transition-all ${activeTab === 'gstr2b' ? 'ring-2 ring-red-400' : 'hover:border-red-300'}`}
          onClick={() => setActiveTab('gstr2b')}
        >
           <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-xs text-red-700 uppercase tracking-wider font-semibold">Missing in GSTR-2B</p>
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-gray-900">23</h3>
                 <p className="text-xs text-gray-600 mt-1">Amount: <span className="text-red-700 font-semibold">₹8.67 L</span></p>
              </div>
           </div>
        </div>

        <div 
          className={`bg-gradient-to-br from-yellow-50 to-white rounded-2xl border border-yellow-200 shadow-lg p-5 cursor-pointer transition-all ${activeTab === 'value' ? 'ring-2 ring-yellow-400' : 'hover:border-yellow-300'}`}
          onClick={() => setActiveTab('value')}
        >
           <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-lg">
                  <HelpCircle className="h-4 w-4 text-yellow-600" />
                </div>
                <p className="text-xs text-yellow-700 uppercase tracking-wider font-semibold">Value Mismatches</p>
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-gray-900">10</h3>
                 <p className="text-xs text-gray-600 mt-1">Avg Diff: <span className="text-yellow-700 font-semibold">₹234</span></p>
              </div>
           </div>
        </div>
      </div>

      {/* 3. TABS */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl">
         <button 
           onClick={() => setActiveTab('books')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'books' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
           Missing in Books <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">34</span>
         </button>
         <button 
           onClick={() => setActiveTab('gstr2b')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'gstr2b' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
           Missing in GSTR-2B <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">23</span>
         </button>
         <button 
           onClick={() => setActiveTab('value')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'value' ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
           Value Mismatches <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-semibold">10</span>
         </button>
      </div>

      {/* 4. CONTENT TABLES */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 shadow-lg overflow-hidden min-h-[400px]">
         
         {/* TAB 1: MISSING IN BOOKS */}
         {activeTab === 'books' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="p-4 bg-orange-50 border-b border-orange-200 text-orange-700 text-sm flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4" />
                  These invoices are reported in GSTR-2B but not found in your purchase register. Add them to claim ITC.
               </div>
               
               {missingInBooks.map((inv) => (
                  <div key={inv.id} className="border-b border-gray-100 last:border-0">
                     <div 
                       className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => toggleRow(inv.id)}
                     >
                        <div className="flex items-center gap-4">
                           <input 
                             type="checkbox" 
                             onClick={(e) => e.stopPropagation()}
                             onChange={() => toggleRowSelection(inv.id)}
                             checked={selectedRows.includes(inv.id)}
                             className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                           />
                           <button className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-gray-900' : 'text-gray-400'}`}>
                               <ChevronRight className="h-5 w-5" />
                            </button>
                           <div>
                              <div className="flex items-center gap-3">
                                 <span className="font-bold text-gray-900">{inv.id}</span>
                                 <span className="text-xs text-gray-500">{inv.date}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-0.5">{inv.vendor}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">₹{inv.amount.toLocaleString()}</p>
                              <p className="text-[10px] text-gray-500">GSTR-2B Amount</p>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-bold text-orange-600">₹{inv.gst.toLocaleString()}</p>
                              <p className="text-[10px] text-gray-500">ITC at Risk</p>
                           </div>
                           <span className="px-2 py-1 rounded bg-orange-50 text-orange-700 text-xs border border-orange-200">
                              {inv.reason}
                           </span>
                        </div>
                     </div>

                     {expandedRows.includes(inv.id) && (
                        <div className="bg-gray-50 p-6 animate-in slide-in-from-top-2 duration-200">
                           <div className="flex justify-between items-start">
                              <div className="space-y-4">
                                 <h4 className="text-sm font-semibold text-gray-900">GSTR-2B Details</h4>
                                 <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <div className="flex justify-between w-64">
                                       <span className="text-gray-600">Taxable Value</span>
                                       <span className="text-gray-900 font-medium">₹{(inv.amount - inv.gst).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between w-64">
                                       <span className="text-gray-600">Tax Amount</span>
                                       <span className="text-gray-900 font-medium">₹{inv.gst.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between w-64">
                                       <span className="text-gray-600">Place of Supply</span>
                                       <span className="text-gray-900 font-medium">27-Maharashtra</span>
                                    </div>
                                    <div className="flex justify-between w-64">
                                       <span className="text-gray-600">Filing Date</span>
                                       <span className="text-gray-900 font-medium">12 Nov 2025</span>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm w-80">
                                 <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Suggested Action</h4>
                                 <button className="w-full py-2.5 mb-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-sm">
                                    <Plus className="h-4 w-4" /> Add to Books
                                 </button>
                                 <button className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                                    Mark as Duplicate
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               ))}
            </div>
         )}

         {/* TAB 2: MISSING IN GSTR-2B */}
         {activeTab === 'gstr2b' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  These invoices are in your books but missing from GSTR-2B. Follow up with vendor to avoid ITC reversal.
               </div>

               {missingInGSTR2B.map((inv) => (
                  <div key={inv.id} className="border-b border-gray-100 last:border-0">
                     <div 
                       className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => toggleRow(inv.id)}
                     >
                        <div className="flex items-center gap-4">
                           <input 
                             type="checkbox" 
                             onClick={(e) => e.stopPropagation()}
                             onChange={() => toggleRowSelection(inv.id)}
                             checked={selectedRows.includes(inv.id)}
                             className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                           />
                           <button className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-gray-900' : 'text-gray-400'}`}>
                               <ChevronRight className="h-5 w-5" />
                            </button>
                           <div>
                              <div className="flex items-center gap-3">
                                 <span className="font-bold text-gray-900">{inv.id}</span>
                                 <span className="text-xs text-gray-500">{inv.date}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-0.5">{inv.vendor}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">₹{inv.amount.toLocaleString()}</p>
                              <p className="text-[10px] text-gray-500">Your Amount</p>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-bold text-red-600">₹{inv.gst.toLocaleString()}</p>
                              <p className="text-[10px] text-gray-500">ITC at Risk</p>
                           </div>
                           <div className="text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${inv.daysPending > 15 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                 {inv.daysPending} Days
                              </span>
                              <p className="text-[10px] text-gray-500 mt-0.5">Pending</p>
                           </div>
                        </div>
                     </div>

                     {expandedRows.includes(inv.id) && (
                        <div className="bg-gray-50 p-6 animate-in slide-in-from-top-2 duration-200">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                                 <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Vendor Filing Status</h4>
                                 <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                       <span className="text-gray-600">Status</span>
                                       <span className="text-red-600 font-medium">{inv.filingStatus}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-gray-600">Avg Filing Date</span>
                                       <span className="text-gray-900 font-medium">12th of Month</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-gray-600">Compliance Score</span>
                                       <span className="text-amber-600 font-medium">72% (Average)</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                                 <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Action History</h4>
                                 <div className="space-y-3 relative pl-4 border-l border-gray-300">
                                    <div className="relative">
                                       <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-gray-400 border-2 border-white"></div>
                                       <p className="text-xs text-gray-600">Invoice recorded in books</p>
                                    </div>
                                    {inv.lastReminder !== 'Never' && (
                                       <div className="relative">
                                          <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white"></div>
                                          <p className="text-xs text-gray-900 font-medium">Reminder sent via WhatsApp</p>
                                          <p className="text-[10px] text-gray-500">{inv.lastReminder}</p>
                                       </div>
                                    )}
                                 </div>
                              </div>

                              <div className="flex flex-col gap-3 justify-center">
                                 <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 shadow-sm">
                                    <MessageSquare className="h-4 w-4" /> Send Reminder
                                 </button>
                                 <div className="flex gap-2">
                                    <button className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                       <Phone className="h-4 w-4" /> Call
                                    </button>
                                    <button className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                       <Mail className="h-4 w-4" /> Email
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               ))}
            </div>
         )}

         {/* TAB 3: VALUE MISMATCHES */}
         {activeTab === 'value' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="p-4 bg-yellow-50 border-b border-yellow-200 text-yellow-700 text-sm flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Invoice numbers match but amounts differ. Verify if differences are due to rounding or calculation errors.
               </div>

               {valueMismatches.map((inv) => (
                  <div key={inv.id} className="border-b border-gray-100 last:border-0">
                     <div 
                       className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => toggleRow(inv.id)}
                     >
                        <div className="flex items-center gap-4">
                           <input 
                             type="checkbox" 
                             onClick={(e) => e.stopPropagation()}
                             onChange={() => toggleRowSelection(inv.id)}
                             checked={selectedRows.includes(inv.id)}
                             className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                           />
                           <button className={`p-1 rounded transition-transform duration-200 ${expandedRows.includes(inv.id) ? 'rotate-90 text-gray-900' : 'text-gray-400'}`}>
                               <ChevronRight className="h-5 w-5" />
                            </button>
                           <div>
                              <div className="flex items-center gap-3">
                                 <span className="font-bold text-gray-900">{inv.id}</span>
                                 <span className="text-xs text-gray-500">{inv.date}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-0.5">{inv.vendor}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="text-right">
                              <p className="text-sm font-bold text-blue-600">₹{inv.bookAmount.toLocaleString()}</p>
                              <p className="text-[10px] text-gray-500">Your Books</p>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-bold text-orange-600">₹{inv.gstr2bAmount.toLocaleString()}</p>
                              <p className="text-[10px] text-gray-500">GSTR-2B</p>
                           </div>
                           <div className="text-right min-w-[80px]">
                              <p className={`text-sm font-bold ${inv.withinTolerance ? 'text-yellow-600' : 'text-red-600'}`}>
                                 {inv.bookAmount > inv.gstr2bAmount ? '+' : '-'}₹{Math.abs(inv.diff)}
                              </p>
                              <p className="text-[10px] text-gray-500">{inv.type}</p>
                           </div>
                           <div className="text-center">
                              {inv.withinTolerance ? (
                                 <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3" /> Tolerable
                                 </span>
                              ) : (
                                 <span className="inline-flex items-center gap-1 text-xs text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                    <X className="h-3 w-3" /> Exceeds
                                 </span>
                              )}
                           </div>
                        </div>
                     </div>

                     {expandedRows.includes(inv.id) && (
                        <div className="bg-gray-50 p-6 animate-in slide-in-from-top-2 duration-200">
                           <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-gray-900">Comparison Analysis</h4>
                              {inv.withinTolerance && (
                                 <p className="text-xs text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3" /> Difference is within configured tolerance of ₹10
                                 </p>
                              )}
                           </div>

                           <div className="flex gap-4 items-center justify-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                              <div className="text-center">
                                 <p className="text-xs text-gray-500 mb-1">Your Value</p>
                                 <p className="text-xl font-bold text-blue-600">₹{inv.bookAmount}</p>
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                              <div className="text-center">
                                 <p className="text-xs text-gray-500 mb-1">GSTR-2B Value</p>
                                 <p className="text-xl font-bold text-orange-600">₹{inv.gstr2bAmount}</p>
                              </div>
                              <div className="ml-8 pl-8 border-l border-gray-200 text-left">
                                 <p className="text-xs text-gray-500 mb-1">Difference</p>
                                 <p className={`text-xl font-bold ${inv.withinTolerance ? 'text-yellow-600' : 'text-red-600'}`}>₹{inv.diff}</p>
                              </div>
                           </div>

                           <div className="flex justify-end gap-3">
                              <button className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm">
                                 Accept GSTR-2B Value
                              </button>
                              <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                                 Request Vendor Amendment
                              </button>
                           </div>
                        </div>
                     )}
                  </div>
               ))}
            </div>
         )}

      </div>
      </div>
    </div>
  );
}
