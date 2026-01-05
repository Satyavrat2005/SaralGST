'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  AlertOctagon, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Types
type FetchState = 'not_fetched' | 'fetching' | 'success' | 'failed';

export default function GSTR2BFetchPage() {
  const [fetchState, setFetchState] = useState<FetchState>('not_fetched');
  const [activeTab, setActiveTab] = useState('b2b');

  const handleFetch = () => {
    setFetchState('fetching');
    setTimeout(() => {
      setFetchState('success');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <Download className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Fetch Returns</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GSTR-2B Fetch</h1>
          <p className="text-gray-600 text-sm mt-1">Auto-generated ITC statement - fetch from GST portal or upload manually</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
               <option>November 2025</option>
               <option>October 2025</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
           </div>
           
           <button 
             onClick={handleFetch}
             className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
             disabled={fetchState === 'fetching'}
           >
             {fetchState === 'fetching' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} 
             {fetchState === 'success' ? 'Re-fetch' : 'Fetch from Portal'}
           </button>
           <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium">
             <Upload className="h-4 w-4" /> Upload Manually
           </button>
        </div>
      </div>

      {/* 2. FETCH STATUS CARD (Dynamic) */}
      <div className="w-full">
         {fetchState === 'not_fetched' && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 shadow-lg p-8 flex flex-col items-center justify-center text-center min-h-[300px] relative overflow-hidden">
               <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 shadow-sm">
                  <Download className="h-8 w-8 text-gray-500" strokeWidth={2} />
               </div>
               <h3 className="text-xl font-semibold text-gray-900">GSTR-2B Not Fetched</h3>
               <p className="text-gray-600 max-w-md mt-2 mb-6">Data for November 2025 is expected to be available on the GST Portal after 14th Dec 2025. You can try fetching now to check availability.</p>
               <button 
                  onClick={handleFetch}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-all font-semibold shadow-sm hover:shadow-md"
               >
                  Check Availability & Fetch
               </button>
            </div>
         )}

         {fetchState === 'fetching' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
               <Loader2 className="h-16 w-16 text-emerald-600 animate-spin mb-6" strokeWidth={2.5} />
               <h3 className="text-xl font-semibold text-gray-900 animate-pulse">Fetching GSTR-2B from GST Portal...</h3>
               <div className="w-full max-w-md mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                     <span>Authenticating...</span>
                     <span className="text-emerald-600 font-semibold">Done</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 w-[60%] animate-[width_2s_ease-in-out_infinite]"></div>
                  </div>
                  <p className="text-xs text-gray-500">Estimated time: 15 seconds</p>
               </div>
            </div>
         )}

         {fetchState === 'success' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="bg-white rounded-2xl border border-emerald-200 shadow-lg overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                           <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-900">Fetched Successfully!</h3>
                           <p className="text-sm text-gray-600">Updated: Just now by You</p>
                        </div>
                     </div>
                     
                     <div className="flex gap-8 text-center">
                        <div>
                           <p className="text-xs text-gray-600 uppercase font-semibold">Total Invoices</p>
                           <p className="text-2xl font-bold text-gray-900">856</p>
                        </div>
                        <div>
                           <p className="text-xs text-gray-600 uppercase font-semibold">ITC Available</p>
                           <p className="text-2xl font-bold text-emerald-600">₹8.22 L</p>
                        </div>
                        <div>
                           <p className="text-xs text-gray-600 uppercase font-semibold">Matched</p>
                           <p className="text-2xl font-bold text-blue-600">92%</p>
                        </div>
                     </div>

                     <button className="btn-primary-custom px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all">
                        Run Reconciliation
                     </button>
                  </div>
               </div>

               {/* Data Tables */}
               <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 inline-flex gap-1 overflow-x-auto">
                  {['b2b', 'b2c', 'cdnr', 'isd', 'impg'].map(tab => (
                     <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap uppercase ${activeTab === tab ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                     >
                        {tab}
                     </button>
                  ))}
               </div>

               <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                           <tr>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Invoice No</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Date</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap min-w-[180px]">Vendor</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Value</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Tax</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center whitespace-nowrap">Eligibility</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center whitespace-nowrap">Match Status</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {[1,2,3,4,5].map((i) => (
                              <tr key={i} className="hover:bg-gray-50 transition-colors">
                                 <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">INV-00123{i}</td>
                                 <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">18 Nov 2025</td>
                                 <td className="px-4 py-3 min-w-[180px]">
                                    <div className="flex flex-col">
                                       <span className="text-gray-900 font-medium text-xs">ABC Enterprises</span>
                                       <span className="text-[10px] text-gray-500 font-mono">27ABCDE1234F1Z5</span>
                                    </div>
                                 </td>
                                 <td className="px-4 py-3 text-right text-gray-900 font-semibold whitespace-nowrap text-xs">₹53,808</td>
                                 <td className="px-4 py-3 text-right text-gray-700 font-semibold whitespace-nowrap text-xs">₹8,208</td>
                                 <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">Eligible</span>
                                 </td>
                                 <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${i % 2 === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                       {i % 2 === 0 ? <CheckCircle2 className="h-3 w-3" /> : <AlertOctagon className="h-3 w-3" />}
                                       {i % 2 === 0 ? 'Matched' : 'Partial'}
                                    </span>
                                 </td>
                                 <td className="px-4 py-3 text-right">
                                    <button className="text-gray-400 hover:text-gray-700 transition-colors"><ChevronRight className="h-4 w-4" /></button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
    </div>
  );
}
