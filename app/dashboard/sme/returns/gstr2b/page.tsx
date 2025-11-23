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
    <div className="space-y-6 pb-20">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">GSTR-2B Fetch</h1>
          <p className="text-muted-foreground text-sm mt-1">Auto-generated ITC statement - fetch from GST portal or upload manually</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-zinc-900 border border-white/10 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-primary outline-none text-zinc-300 cursor-pointer hover:bg-zinc-800">
               <option>November 2025</option>
               <option>October 2025</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
           </div>
           
           <button 
             onClick={handleFetch}
             className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
             disabled={fetchState === 'fetching'}
           >
             {fetchState === 'fetching' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} 
             {fetchState === 'success' ? 'Re-fetch' : 'Fetch from Portal'}
           </button>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Upload className="h-4 w-4" /> Upload Manually
           </button>
        </div>
      </div>

      {/* 2. FETCH STATUS CARD (Dynamic) */}
      <div className="w-full">
         {fetchState === 'not_fetched' && (
            <GlassPanel className="p-8 flex flex-col items-center justify-center text-center min-h-[300px] relative overflow-hidden border-dashed border-2 border-zinc-700 bg-zinc-900/20">
               <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                  <Download className="h-8 w-8 text-zinc-500" />
               </div>
               <h3 className="text-xl font-semibold text-white">GSTR-2B Not Fetched</h3>
               <p className="text-zinc-400 max-w-md mt-2 mb-6">Data for November 2025 is expected to be available on the GST Portal after 14th Dec 2025. You can try fetching now to check availability.</p>
               <button 
                  onClick={handleFetch}
                  className="px-6 py-3 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors font-medium"
               >
                  Check Availability & Fetch
               </button>
            </GlassPanel>
         )}

         {fetchState === 'fetching' && (
            <GlassPanel className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
               <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
               <h3 className="text-xl font-semibold text-white animate-pulse">Fetching GSTR-2B from GST Portal...</h3>
               <div className="w-full max-w-md mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                     <span>Authenticating...</span>
                     <span className="text-emerald-500">Done</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                     <div className="h-full bg-primary w-[60%] animate-[width_2s_ease-in-out_infinite]"></div>
                  </div>
                  <p className="text-xs text-zinc-500">Estimated time: 15 seconds</p>
               </div>
            </GlassPanel>
         )}

         {fetchState === 'success' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <BentoCard className="border-emerald-500/30 bg-emerald-500/5">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-2">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                           <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-white">Fetched Successfully!</h3>
                           <p className="text-sm text-zinc-400">Updated: Just now by You</p>
                        </div>
                     </div>
                     
                     <div className="flex gap-8 text-center">
                        <div>
                           <p className="text-xs text-zinc-500 uppercase">Total Invoices</p>
                           <p className="text-2xl font-bold text-white">856</p>
                        </div>
                        <div>
                           <p className="text-xs text-zinc-500 uppercase">ITC Available</p>
                           <p className="text-2xl font-bold text-emerald-500">₹8.22 L</p>
                        </div>
                        <div>
                           <p className="text-xs text-zinc-500 uppercase">Matched</p>
                           <p className="text-2xl font-bold text-blue-400">92%</p>
                        </div>
                     </div>

                     <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white hover:bg-zinc-800">
                        Run Reconciliation
                     </button>
                  </div>
               </BentoCard>

               {/* Data Tables */}
               <div className="flex border-b border-white/5 overflow-x-auto">
                  {['b2b', 'b2c', 'cdnr', 'isd', 'impg'].map(tab => (
                     <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors uppercase ${activeTab === tab ? 'border-primary text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                     >
                        {tab}
                     </button>
                  ))}
               </div>

               <GlassPanel className="p-0 overflow-hidden">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-white/5 text-zinc-500 font-medium">
                        <tr>
                           <th className="px-6 py-3">Invoice No</th>
                           <th className="px-6 py-3">Date</th>
                           <th className="px-6 py-3">Vendor</th>
                           <th className="px-6 py-3 text-right">Value</th>
                           <th className="px-6 py-3 text-right">Tax</th>
                           <th className="px-6 py-3 text-center">Eligibility</th>
                           <th className="px-6 py-3 text-center">Match Status</th>
                           <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {[1,2,3,4,5].map((i) => (
                           <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-medium text-white">INV-00123{i}</td>
                              <td className="px-6 py-4 text-zinc-400">18 Nov 2025</td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                    <span className="text-zinc-200">ABC Enterprises</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">27ABCDE1234F1Z5</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right text-white font-mono">₹53,808</td>
                              <td className="px-6 py-4 text-right text-zinc-300 font-mono">₹8,208</td>
                              <td className="px-6 py-4 text-center">
                                 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Eligible</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className={`inline-flex items-center gap-1 text-xs font-medium ${i % 2 === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {i % 2 === 0 ? <CheckCircle2 className="h-3 w-3" /> : <AlertOctagon className="h-3 w-3" />}
                                    {i % 2 === 0 ? 'Matched' : 'Partial'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button className="text-xs text-zinc-400 hover:text-white"><ChevronRight className="h-4 w-4" /></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </GlassPanel>
            </div>
         )}
      </div>
    </div>
  );
}
