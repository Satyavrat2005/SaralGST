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
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

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
    <div className="space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Discrepancies</h1>
          <p className="text-muted-foreground text-sm mt-1">Invoices that didn't match or have differences</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <MessageSquare className="h-4 w-4" /> Send Bulk Reminders
           </button>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Download className="h-4 w-4" /> Export All
           </button>
        </div>
      </div>

      {/* 2. SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BentoCard>
           <div className="flex flex-col h-full justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Discrepancies</p>
              <div>
                 <h3 className="text-3xl font-bold text-white">67</h3>
                 <p className="text-xs text-emerald-500 mt-1">↓ 12% vs last month</p>
              </div>
           </div>
        </BentoCard>

        <BentoCard 
          className={`cursor-pointer transition-colors ${activeTab === 'books' ? 'border-orange-500/50 bg-orange-500/5' : 'hover:border-white/20'}`}
          onClick={() => setActiveTab('books')}
        >
           <div className="flex flex-col h-full justify-between">
              <p className="text-xs text-orange-400 uppercase tracking-wider font-semibold">Missing in Books</p>
              <div>
                 <h3 className="text-2xl font-bold text-white">34</h3>
                 <p className="text-xs text-zinc-500 mt-1">ITC at Risk: <span className="text-white">₹2.24 L</span></p>
              </div>
           </div>
        </BentoCard>

        <BentoCard 
          className={`cursor-pointer transition-colors ${activeTab === 'gstr2b' ? 'border-red-500/50 bg-red-500/5' : 'hover:border-white/20'}`}
          onClick={() => setActiveTab('gstr2b')}
        >
           <div className="flex flex-col h-full justify-between">
              <p className="text-xs text-red-400 uppercase tracking-wider font-semibold">Missing in GSTR-2B</p>
              <div>
                 <h3 className="text-2xl font-bold text-white">23</h3>
                 <p className="text-xs text-zinc-500 mt-1">Amount: <span className="text-white">₹8.67 L</span></p>
              </div>
           </div>
        </BentoCard>

        <BentoCard 
          className={`cursor-pointer transition-colors ${activeTab === 'value' ? 'border-yellow-500/50 bg-yellow-500/5' : 'hover:border-white/20'}`}
          onClick={() => setActiveTab('value')}
        >
           <div className="flex flex-col h-full justify-between">
              <p className="text-xs text-yellow-400 uppercase tracking-wider font-semibold">Value Mismatches</p>
              <div>
                 <h3 className="text-2xl font-bold text-white">10</h3>
                 <p className="text-xs text-zinc-500 mt-1">Avg Diff: <span className="text-white">₹234</span></p>
              </div>
           </div>
        </BentoCard>
      </div>

      {/* 3. TABS */}
      <div className="flex border-b border-white/5">
         <button 
           onClick={() => setActiveTab('books')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'books' ? 'border-orange-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
         >
           Missing in Books <span className="bg-orange-500/20 text-orange-500 px-1.5 rounded text-xs">34</span>
         </button>
         <button 
           onClick={() => setActiveTab('gstr2b')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'gstr2b' ? 'border-red-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
         >
           Missing in GSTR-2B <span className="bg-red-500/20 text-red-500 px-1.5 rounded text-xs">23</span>
         </button>
         <button 
           onClick={() => setActiveTab('value')}
           className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'value' ? 'border-yellow-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
         >
           Value Mismatches <span className="bg-yellow-500/20 text-yellow-500 px-1.5 rounded text-xs">10</span>
         </button>
      </div>

      {/* 4. CONTENT TABLES */}
      <GlassPanel className="p-0 overflow-hidden min-h-[400px]">
         
         {/* TAB 1: MISSING IN BOOKS */}
         {activeTab === 'books' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div className="p-4 bg-orange-500/10 border-b border-orange-500/20 text-orange-200 text-sm flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4" />
                  These invoices are reported in GSTR-2B but not found in your purchase register. Add them to claim ITC.
               </div>
               
               {missingInBooks.map((inv) => (
                  <div key={inv.id} className="border-b border-white/5 last:border-0">
                     <div 
                       className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                       onClick={() => toggleRow(inv.id)}
                     >
                        <div className="flex items-center gap-4">
                           <input 
                             type="checkbox" 
                             onClick={(e) => e.stopPropagation()}
                             onChange={() => toggleRowSelection(inv.id)}
                             checked={selectedRows.includes(inv.id)}
                             className="rounded bg-zinc-800 border-zinc-600 text-orange-500 focus:ring-orange-500"
                           />
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
                              <p className="text-[10px] text-zinc-500">GSTR-2B Amount</p>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-bold text-orange-500">₹{inv.gst.toLocaleString()}</p>
                              <p className="text-[10px] text-zinc-500">ITC at Risk</p>
                           </div>
                           <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs border border-white/5">
                              {inv.reason}
                           </span>
                        </div>
                     </div>

                     {expandedRows.includes(inv.id) && (
                        <div className="bg-zinc-900/50 p-6 animate-in slide-in-from-top-2 duration-200">
                           <div className="flex justify-between items-start">
                              <div className="space-y-4">
                                 <h4 className="text-sm font-semibold text-white">GSTR-2B Details</h4>
                                 <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <div className="flex justify-between w-64">
                                       <span className="text-zinc-500">Taxable Value</span>
                                       <span className="text-white">₹{(inv.amount - inv.gst).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between w-64">
                                       <span className="text-zinc-500">Tax Amount</span>
                                       <span className="text-white">₹{inv.gst.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between w-64">
                                       <span className="text-zinc-500">Place of Supply</span>
                                       <span className="text-white">27-Maharashtra</span>
                                    </div>
                                    <div className="flex justify-between w-64">
                                       <span className="text-zinc-500">Filing Date</span>
                                       <span className="text-white">12 Nov 2025</span>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 w-80">
                                 <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-3">Suggested Action</h4>
                                 <button className="w-full py-2 mb-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-500 transition-colors flex items-center justify-center gap-2">
                                    <Plus className="h-4 w-4" /> Add to Books
                                 </button>
                                 <button className="w-full py-2 rounded-lg border border-white/10 text-zinc-300 text-sm hover:bg-white/5 transition-colors">
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
               <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-200 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  These invoices are in your books but missing from GSTR-2B. Follow up with vendor to avoid ITC reversal.
               </div>

               {missingInGSTR2B.map((inv) => (
                  <div key={inv.id} className="border-b border-white/5 last:border-0">
                     <div 
                       className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                       onClick={() => toggleRow(inv.id)}
                     >
                        <div className="flex items-center gap-4">
                           <input 
                             type="checkbox" 
                             onClick={(e) => e.stopPropagation()}
                             onChange={() => toggleRowSelection(inv.id)}
                             checked={selectedRows.includes(inv.id)}
                             className="rounded bg-zinc-800 border-zinc-600 text-red-500 focus:ring-red-500"
                           />
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
                              <p className="text-[10px] text-zinc-500">Your Amount</p>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-bold text-red-500">₹{inv.gst.toLocaleString()}</p>
                              <p className="text-[10px] text-zinc-500">ITC at Risk</p>
                           </div>
                           <div className="text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${inv.daysPending > 15 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                 {inv.daysPending} Days
                              </span>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Pending</p>
                           </div>
                        </div>
                     </div>

                     {expandedRows.includes(inv.id) && (
                        <div className="bg-zinc-900/50 p-6 animate-in slide-in-from-top-2 duration-200">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="p-4 rounded-xl bg-zinc-900 border border-white/10">
                                 <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-3">Vendor Filing Status</h4>
                                 <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                       <span className="text-zinc-500">Status</span>
                                       <span className="text-red-400 font-medium">{inv.filingStatus}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-zinc-500">Avg Filing Date</span>
                                       <span className="text-white">12th of Month</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-zinc-500">Compliance Score</span>
                                       <span className="text-amber-500">72% (Average)</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="p-4 rounded-xl bg-zinc-900 border border-white/10">
                                 <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-3">Action History</h4>
                                 <div className="space-y-3 relative pl-4 border-l border-zinc-700">
                                    <div className="relative">
                                       <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-zinc-600"></div>
                                       <p className="text-xs text-zinc-400">Invoice recorded in books</p>
                                    </div>
                                    {inv.lastReminder !== 'Never' && (
                                       <div className="relative">
                                          <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                                          <p className="text-xs text-white">Reminder sent via WhatsApp</p>
                                          <p className="text-[10px] text-zinc-500">{inv.lastReminder}</p>
                                       </div>
                                    )}
                                 </div>
                              </div>

                              <div className="flex flex-col gap-3 justify-center">
                                 <button className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2">
                                    <MessageSquare className="h-4 w-4" /> Send Reminder
                                 </button>
                                 <div className="flex gap-2">
                                    <button className="flex-1 py-2 rounded-lg border border-white/10 text-zinc-300 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                                       <Phone className="h-4 w-4" /> Call
                                    </button>
                                    <button className="flex-1 py-2 rounded-lg border border-white/10 text-zinc-300 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
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
               <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-200 text-sm flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Invoice numbers match but amounts differ. Verify if differences are due to rounding or calculation errors.
               </div>

               {valueMismatches.map((inv) => (
                  <div key={inv.id} className="border-b border-white/5 last:border-0">
                     <div 
                       className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                       onClick={() => toggleRow(inv.id)}
                     >
                        <div className="flex items-center gap-4">
                           <input 
                             type="checkbox" 
                             onClick={(e) => e.stopPropagation()}
                             onChange={() => toggleRowSelection(inv.id)}
                             checked={selectedRows.includes(inv.id)}
                             className="rounded bg-zinc-800 border-zinc-600 text-yellow-500 focus:ring-yellow-500"
                           />
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
                              <p className="text-sm font-bold text-blue-400">₹{inv.bookAmount.toLocaleString()}</p>
                              <p className="text-[10px] text-zinc-500">Your Books</p>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-bold text-orange-400">₹{inv.gstr2bAmount.toLocaleString()}</p>
                              <p className="text-[10px] text-zinc-500">GSTR-2B</p>
                           </div>
                           <div className="text-right min-w-[80px]">
                              <p className={`text-sm font-bold ${inv.withinTolerance ? 'text-yellow-500' : 'text-red-500'}`}>
                                 {inv.bookAmount > inv.gstr2bAmount ? '+' : '-'}₹{Math.abs(inv.diff)}
                              </p>
                              <p className="text-[10px] text-zinc-500">{inv.type}</p>
                           </div>
                           <div className="text-center">
                              {inv.withinTolerance ? (
                                 <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                                    <CheckCircle2 className="h-3 w-3" /> Tolerable
                                 </span>
                              ) : (
                                 <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded">
                                    <X className="h-3 w-3" /> Exceeds
                                 </span>
                              )}
                           </div>
                        </div>
                     </div>

                     {expandedRows.includes(inv.id) && (
                        <div className="bg-zinc-900/50 p-6 animate-in slide-in-from-top-2 duration-200">
                           <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-white">Comparison Analysis</h4>
                              {inv.withinTolerance && (
                                 <p className="text-xs text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Difference is within configured tolerance of ₹10
                                 </p>
                              )}
                           </div>

                           <div className="flex gap-4 items-center justify-center p-4 bg-zinc-900 rounded-xl border border-white/5 mb-6">
                              <div className="text-center">
                                 <p className="text-xs text-zinc-500 mb-1">Your Value</p>
                                 <p className="text-xl font-bold text-blue-400">₹{inv.bookAmount}</p>
                              </div>
                              <ArrowRight className="h-5 w-5 text-zinc-600" />
                              <div className="text-center">
                                 <p className="text-xs text-zinc-500 mb-1">GSTR-2B Value</p>
                                 <p className="text-xl font-bold text-orange-400">₹{inv.gstr2bAmount}</p>
                              </div>
                              <div className="ml-8 pl-8 border-l border-white/10 text-left">
                                 <p className="text-xs text-zinc-500 mb-1">Difference</p>
                                 <p className={`text-xl font-bold ${inv.withinTolerance ? 'text-yellow-500' : 'text-red-500'}`}>₹{inv.diff}</p>
                              </div>
                           </div>

                           <div className="flex justify-end gap-3">
                              <button className="px-4 py-2 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors">
                                 Accept GSTR-2B Value
                              </button>
                              <button className="px-4 py-2 rounded-lg border border-white/10 text-zinc-300 text-sm hover:bg-white/5 transition-colors">
                                 Request Vendor Amendment
                              </button>
                           </div>
                        </div>
                     )}
                  </div>
               ))}
            </div>
         )}

      </GlassPanel>
    </div>
  );
}
