'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Info, 
  RefreshCw, 
  FileText,
  ArrowRight,
  Download,
  CreditCard,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

export default function GSTR3BDraftPage() {
  const [activeTab, setActiveTab] = useState('3.1');

  return (
    <div className="space-y-6 pb-20">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">GSTR-3B Draft</h1>
          <p className="text-muted-foreground text-sm mt-1">Monthly self-assessed return with tax liability</p>
        </div>
        <div className="flex items-center gap-3">
           <select className="bg-zinc-900 border border-white/10 text-sm rounded-lg p-2 text-zinc-300 focus:ring-1 focus:ring-primary outline-none">
             <option>Nov 2025</option>
             <option>Oct 2025</option>
           </select>
           <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
             <RefreshCw className="h-4 w-4" /> Auto-Generate
           </button>
        </div>
      </div>

      {/* 2. STATUS & SUMMARY CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <GlassPanel className="p-6 lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start z-10 relative">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <h3 className="text-lg font-bold text-white">Tax Liability Summary</h3>
                     <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-medium">Draft In Progress</span>
                  </div>
                  <p className="text-sm text-zinc-400">Filing Deadline: <span className="text-white font-medium">20 Dec 2025</span> (27 days left)</p>
               </div>
               <div className="text-right">
                  <p className="text-xs text-zinc-500 uppercase font-semibold">Net Payable in Cash</p>
                  <p className="text-3xl font-bold text-white mt-1">₹ 3,67,181</p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5 z-10 relative">
               <div>
                  <p className="text-xs text-zinc-500">Output Tax (3.1)</p>
                  <p className="text-lg font-mono text-white">₹12.22 L</p>
               </div>
               <div>
                  <p className="text-xs text-zinc-500">ITC Available (4)</p>
                  <p className="text-lg font-mono text-emerald-500">₹8.22 L</p>
               </div>
               <div>
                  <p className="text-xs text-zinc-500">Reversals (5)</p>
                  <p className="text-lg font-mono text-red-400">₹25,000</p>
               </div>
            </div>
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none"></div>
         </GlassPanel>

         <div className="space-y-4">
            <button className="w-full p-4 rounded-xl bg-zinc-900 border border-white/10 hover:border-primary/50 transition-all text-left group">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                     <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                     <h4 className="font-bold text-white">Generate Challan</h4>
                     <p className="text-xs text-zinc-500 group-hover:text-zinc-300">Create PMT-06 for ₹3.67L</p>
                  </div>
               </div>
            </button>
            <button className="w-full p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-all text-left shadow-lg shadow-emerald-500/20 group">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-black/20 text-white">
                     <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                     <h4 className="font-bold text-white">File GSTR-3B</h4>
                     <p className="text-xs text-emerald-100">Proceed to EVC/DSC</p>
                  </div>
               </div>
            </button>
         </div>
      </div>

      {/* 3. TABLES NAVIGATION */}
      <div className="flex border-b border-white/5 overflow-x-auto">
         {[
            { id: '3.1', label: '3.1 Tax on Supplies' },
            { id: '3.2', label: '3.2 Inter-State' },
            { id: '4', label: '4. ITC Available' },
            { id: '5', label: '5. Exempt/Nil' },
            { id: '6.1', label: '6.1 Payment' },
         ].map(tab => (
            <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-white bg-white/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
               {tab.label}
            </button>
         ))}
      </div>

      {/* 4. FORM CONTENT */}
      <div className="min-h-[400px]">
         {activeTab === '3.1' && (
            <GlassPanel className="p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                  <h3 className="font-bold text-white">3.1 Details of Outward Supplies and Inward Supplies Liable to Reverse Charge</h3>
               </div>
               <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-zinc-500 font-medium border-b border-white/5">
                        <tr>
                           <th className="py-3 pr-4 min-w-[250px]">Nature of Supplies</th>
                           <th className="py-3 px-2 text-right min-w-[120px]">Total Taxable Value</th>
                           <th className="py-3 px-2 text-right min-w-[120px]">Integrated Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px]">Central Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px]">State/UT Tax</th>
                           <th className="py-3 px-2 text-right min-w-[100px]">Cess</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {[
                           { label: '(a) Outward taxable supplies (other than zero rated, nil rated and exempted)', taxable: 6456789, igst: 567890, cgst: 327055, sgst: 327055, cess: 0 },
                           { label: '(b) Outward taxable supplies (zero rated)', taxable: 845600, igst: 0, cgst: 0, sgst: 0, cess: 0 },
                           { label: '(c) Other outward supplies (Nil rated, exempted)', taxable: 123400, igst: 0, cgst: 0, sgst: 0, cess: 0 },
                           { label: '(d) Inward supplies (liable to reverse charge)', taxable: 45600, igst: 0, cgst: 4104, sgst: 4104, cess: 0 },
                           { label: '(e) Non-GST outward supplies', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
                        ].map((row, i) => (
                           <tr key={i}>
                              <td className="py-4 pr-4 text-zinc-300">{row.label}</td>
                              <td className="px-2 py-2">
                                 <input type="text" defaultValue={row.taxable} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white focus:border-primary outline-none font-mono" />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="text" defaultValue={row.igst} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white focus:border-primary outline-none font-mono" />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="text" defaultValue={row.cgst} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white focus:border-primary outline-none font-mono" disabled={i===1} />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="text" defaultValue={row.sgst} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white focus:border-primary outline-none font-mono" disabled={i===1} />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="text" defaultValue={row.cess} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white focus:border-primary outline-none font-mono" />
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-zinc-900/50">
                  <button className="px-4 py-2 rounded bg-zinc-800 text-white text-sm hover:bg-zinc-700">Cancel</button>
                  <button className="px-4 py-2 rounded bg-primary text-white text-sm font-bold hover:bg-primary/90">Confirm</button>
               </div>
            </GlassPanel>
         )}

         {activeTab === '4' && (
            <GlassPanel className="p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                  <h3 className="font-bold text-white">4. Eligible ITC</h3>
               </div>
               <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-zinc-500 font-medium border-b border-white/5">
                        <tr>
                           <th className="py-3 pr-4 min-w-[250px]">Details</th>
                           <th className="py-3 px-2 text-right min-w-[120px]">Integrated Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px]">Central Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px]">State/UT Tax</th>
                           <th className="py-3 px-2 text-right min-w-[100px]">Cess</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        <tr><td colSpan={5} className="py-2 font-semibold text-primary text-xs uppercase tracking-wider">A. ITC Available (whether in full or part)</td></tr>
                        {[
                           { label: '(1) Import of goods', igst: 45600, cgst: 0, sgst: 0, cess: 0 },
                           { label: '(2) Import of services', igst: 12300, cgst: 0, sgst: 0, cess: 0 },
                           { label: '(3) Inward supplies liable to reverse charge', igst: 0, cgst: 4104, sgst: 4104, cess: 0 },
                           { label: '(4) Inward supplies from IS D', igst: 0, cgst: 0, sgst: 0, cess: 0 },
                           { label: '(5) All other ITC', igst: 0, cgst: 411010, sgst: 411010, cess: 0 },
                        ].map((row, i) => (
                           <tr key={i}>
                              <td className="py-4 pr-4 text-zinc-300 pl-4">{row.label}</td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.igst} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white font-mono" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.cgst} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white font-mono" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.sgst} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white font-mono" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.cess} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white font-mono" /></td>
                           </tr>
                        ))}
                        
                        <tr><td colSpan={5} className="py-2 pt-4 font-semibold text-red-400 text-xs uppercase tracking-wider">B. ITC Reversed</td></tr>
                        {[
                           { label: '(1) As per rules 38, 42 & 43 of CGST Rules', igst: 0, cgst: 12500, sgst: 12500, cess: 0 },
                           { label: '(2) Others', igst: 0, cgst: 0, sgst: 0, cess: 0 },
                        ].map((row, i) => (
                           <tr key={`rev-${i}`}>
                              <td className="py-4 pr-4 text-zinc-300 pl-4">{row.label}</td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.igst} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white font-mono" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.cgst} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white font-mono" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.sgst} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white font-mono" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.cess} className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-right text-white font-mono" /></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center bg-zinc-900/50">
                  <div className="text-sm text-zinc-400">Net ITC Available (A - B): <span className="text-emerald-500 font-bold ml-2">₹ 8,54,920</span></div>
                  <button className="px-4 py-2 rounded bg-primary text-white text-sm font-bold hover:bg-primary/90">Confirm</button>
               </div>
            </GlassPanel>
         )}
      </div>
    </div>
  );
}
