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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <FileText className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Monthly Return</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GSTR-3B Draft</h1>
          <p className="text-gray-600 text-sm mt-1">Monthly self-assessed return with tax liability</p>
        </div>
        <div className="flex items-center gap-3">
           <select className="bg-white border border-gray-200 text-sm rounded-xl p-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
             <option>Nov 2025</option>
             <option>Oct 2025</option>
           </select>
           <button className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2">
             <RefreshCw className="h-4 w-4" /> Auto-Generate
           </button>
        </div>
      </div>

      {/* 2. STATUS & SUMMARY CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg lg:col-span-2 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
               {/* Left: Summary Info */}
               <div className="p-6 lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-start">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <h3 className="text-lg font-bold text-gray-900">Tax Liability Summary</h3>
                           <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">Draft In Progress</span>
                        </div>
                        <p className="text-sm text-gray-600">Filing Deadline: <span className="text-gray-900 font-semibold">20 Dec 2025</span> <span className="text-emerald-600 font-semibold">(27 days left)</span></p>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                     <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Output Tax (3.1)</p>
                        <p className="text-xl font-bold text-gray-900">₹12.22 L</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">ITC Available (4)</p>
                        <p className="text-xl font-bold text-emerald-600">₹8.22 L</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Reversals (5)</p>
                        <p className="text-xl font-bold text-red-600">₹25,000</p>
                     </div>
                  </div>
               </div>

               {/* Right: Net Payable */}
               <div className="p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-emerald-50 to-teal-50">
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Net Payable in Cash</p>
                  <p className="text-4xl font-bold text-gray-900">₹3,67,181</p>
               </div>
            </div>
         </div>

         <div className="space-y-4">
            <button className="w-full p-5 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all text-left group">
               <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all">
                     <CreditCard className="h-6 w-6" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                     <h4 className="font-bold text-gray-900 text-base">Generate Challan</h4>
                     <p className="text-xs text-gray-600 mt-0.5">Create PMT-06 for ₹3.67L</p>
                  </div>
               </div>
            </button>
            <button className="w-full p-5 rounded-2xl bg-white border border-emerald-200 shadow-lg hover:shadow-xl hover:border-emerald-300 transition-all text-left group">
               <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 group-hover:shadow-xl group-hover:shadow-emerald-500/40 transition-all">
                     <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                     <h4 className="font-bold text-gray-900 text-base">File GSTR-3B</h4>
                     <p className="text-xs text-gray-600 mt-0.5">Proceed to EVC/DSC</p>
                  </div>
               </div>
            </button>
         </div>
      </div>

      {/* 3. TABLES NAVIGATION */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 inline-flex gap-1 overflow-x-auto">
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
               className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
               {tab.label}
            </button>
         ))}
      </div>

      {/* 4. FORM CONTENT */}
      <div className="min-h-[400px]">
         {activeTab === '3.1' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="font-bold text-gray-900 text-sm">3.1 Details of Outward Supplies and Inward Supplies Liable to Reverse Charge</h3>
               </div>
               <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-gray-700 font-semibold border-b border-gray-200 bg-gray-50">
                        <tr>
                           <th className="py-3 pr-4 min-w-[250px] text-xs uppercase tracking-wider">Nature of Supplies</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Total Taxable Value</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Integrated Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Central Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">State/UT Tax</th>
                           <th className="py-3 px-2 text-right min-w-[100px] text-xs uppercase tracking-wider">Cess</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {[
                           { label: '(a) Outward taxable supplies (other than zero rated, nil rated and exempted)', taxable: 6456789, igst: 567890, cgst: 327055, sgst: 327055, cess: 0 },
                           { label: '(b) Outward taxable supplies (zero rated)', taxable: 845600, igst: 0, cgst: 0, sgst: 0, cess: 0 },
                           { label: '(c) Other outward supplies (Nil rated, exempted)', taxable: 123400, igst: 0, cgst: 0, sgst: 0, cess: 0 },
                           { label: '(d) Inward supplies (liable to reverse charge)', taxable: 45600, igst: 0, cgst: 4104, sgst: 4104, cess: 0 },
                           { label: '(e) Non-GST outward supplies', taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 },
                        ].map((row, i) => (
                           <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 pr-4 text-gray-700 text-xs">{row.label}</td>
                              <td className="px-2 py-2">
                                 <input type="text" defaultValue={row.taxable} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="text" defaultValue={row.igst} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="text" defaultValue={row.cgst} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" disabled={i===1} />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="text" defaultValue={row.sgst} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" disabled={i===1} />
                              </td>
                              <td className="px-2 py-2">
                                 <input type="text" defaultValue={row.cess} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" />
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gradient-to-r from-gray-50 to-white">
                  <button className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-all font-medium">Cancel</button>
                  <button className="btn-primary-custom px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all">Confirm</button>
               </div>
            </div>
         )}

         {activeTab === '4' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
               <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="font-bold text-gray-900 text-sm">4. Eligible ITC</h3>
               </div>
               <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-gray-700 font-semibold border-b border-gray-200 bg-gray-50">
                        <tr>
                           <th className="py-3 pr-4 min-w-[250px] text-xs uppercase tracking-wider">Details</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Integrated Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">Central Tax</th>
                           <th className="py-3 px-2 text-right min-w-[120px] text-xs uppercase tracking-wider">State/UT Tax</th>
                           <th className="py-3 px-2 text-right min-w-[100px] text-xs uppercase tracking-wider">Cess</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        <tr><td colSpan={5} className="py-2 font-semibold text-emerald-700 text-xs uppercase tracking-wider bg-emerald-50">A. ITC Available (whether in full or part)</td></tr>
                        {[
                           { label: '(1) Import of goods', igst: 45600, cgst: 0, sgst: 0, cess: 0 },
                           { label: '(2) Import of services', igst: 12300, cgst: 0, sgst: 0, cess: 0 },
                           { label: '(3) Inward supplies liable to reverse charge', igst: 0, cgst: 4104, sgst: 4104, cess: 0 },
                           { label: '(4) Inward supplies from IS D', igst: 0, cgst: 0, sgst: 0, cess: 0 },
                           { label: '(5) All other ITC', igst: 0, cgst: 411010, sgst: 411010, cess: 0 },
                        ].map((row, i) => (
                           <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 pr-4 text-gray-700 pl-4 text-xs">{row.label}</td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.igst} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.cgst} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.sgst} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.cess} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                           </tr>
                        ))}
                        
                        <tr><td colSpan={5} className="py-2 pt-4 font-semibold text-red-700 text-xs uppercase tracking-wider bg-red-50">B. ITC Reversed</td></tr>
                        {[
                           { label: '(1) As per rules 38, 42 & 43 of CGST Rules', igst: 0, cgst: 12500, sgst: 12500, cess: 0 },
                           { label: '(2) Others', igst: 0, cgst: 0, sgst: 0, cess: 0 },
                        ].map((row, i) => (
                           <tr key={`rev-${i}`} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 pr-4 text-gray-700 pl-4 text-xs">{row.label}</td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.igst} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.cgst} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.sgst} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                              <td className="px-2 py-2"><input type="text" defaultValue={row.cess} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs" /></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                  <div className="text-sm text-gray-700">Net ITC Available (A - B): <span className="text-emerald-600 font-bold ml-2">₹ 8,54,920</span></div>
                  <button className="btn-primary-custom px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all">Confirm</button>
               </div>
            </div>
         )}
      </div>
    </div>
    </div>
  );
}
