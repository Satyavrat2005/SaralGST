'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload, 
  LayoutGrid, 
  List, 
  MoreVertical,
  Phone,
  Mail,
  Copy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Mock Data
const vendors = [
  { id: 1, name: 'ABC Enterprises Pvt Ltd', gstin: '27ABCDE1234F1Z5', pan: 'ABCDE1234F', state: 'Maharashtra', status: 'Compliant', score: 95, invoices: 18, amount: 845600, lastInvoice: '2 days ago', filingStatus: 'On Time' },
  { id: 2, name: 'TechSol Solutions', gstin: '29PQRST5678H1Z2', pan: 'PQRST5678H', state: 'Karnataka', status: 'At Risk', score: 75, invoices: 12, amount: 450000, lastInvoice: '5 days ago', filingStatus: 'Late' },
  { id: 3, name: 'Global Logistics', gstin: '07KLMNO4321J1Z9', pan: 'KLMNO4321J', state: 'Delhi', status: 'Compliant', score: 98, invoices: 8, amount: 1200000, lastInvoice: '1 week ago', filingStatus: 'On Time' },
  { id: 4, name: 'Reddy Traders', gstin: '33FGHIJ9876L1Z4', pan: 'FGHIJ9876L', state: 'Tamil Nadu', status: 'Non-Compliant', score: 45, invoices: 3, amount: 85000, lastInvoice: '3 weeks ago', filingStatus: 'Not Filed' },
  { id: 5, name: 'Office Supplies Co', gstin: '19UVWXY8765K1Z3', pan: 'UVWXY8765K', state: 'West Bengal', status: 'Compliant', score: 92, invoices: 24, amount: 125000, lastInvoice: 'Yesterday', filingStatus: 'On Time' },
];

const complianceData = [
  { name: 'Compliant', value: 45, color: '#10B981' },
  { name: 'At Risk', value: 12, color: '#F59E0B' },
  { name: 'Non-Compliant', value: 3, color: '#EF4444' },
];

export default function VendorListPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showAddModal, setShowAddModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Compliant': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'At Risk': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Non-Compliant': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Vendor Management</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">All Vendors</h1>
          <p className="text-gray-600 text-sm mt-1">Track vendor compliance and invoice patterns</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium">
             <Download className="h-4 w-4" /> Export
           </button>
           <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium">
             <Upload className="h-4 w-4" /> Import
           </button>
           <button 
             onClick={() => setShowAddModal(true)}
             className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
           >
             <Plus className="h-4 w-4" /> Add Vendor
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
         <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input type="text" className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2.5 placeholder-gray-500 outline-none transition-all" placeholder="Search by name, GSTIN..." />
            </div>
            
            <select className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-2.5 cursor-pointer hover:border-gray-300 outline-none transition-all">
              <option>All Compliance Levels</option>
              <option>Compliant</option>
              <option>At Risk</option>
              <option>Non-Compliant</option>
            </select>

            <select className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-2.5 cursor-pointer hover:border-gray-300 outline-none transition-all">
              <option>All States</option>
              <option>Maharashtra</option>
              <option>Karnataka</option>
              <option>Delhi</option>
            </select>

            <select className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 p-2.5 cursor-pointer hover:border-gray-300 outline-none transition-all">
              <option>Sort By: Compliance</option>
              <option>Sort By: Total Amount</option>
              <option>Sort By: Name</option>
            </select>
         </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-gray-600 font-medium">Total Vendors</p>
               <h3 className="text-3xl font-bold text-gray-900 mt-2">60</h3>
               <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  <span>Active: 54</span>
                  <span>Inactive: 6</span>
               </div>
             </div>
             <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">+3 this month</span>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center gap-6">
           <div className="h-20 w-20 relative shrink-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={complianceData}
                   innerRadius={20}
                   outerRadius={30}
                   paddingAngle={5}
                   dataKey="value"
                   stroke="none"
                 >
                   {complianceData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }} itemStyle={{color: '#111'}} />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="flex-1 space-y-1">
             <p className="text-sm font-semibold text-gray-900 mb-1">Compliance</p>
             <div className="flex items-center justify-between text-xs">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-gray-600">Compliant</span>
               </div>
               <span className="text-gray-900 font-semibold">75%</span>
             </div>
             <div className="flex items-center justify-between text-xs">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-gray-600">At Risk</span>
               </div>
               <span className="text-gray-900 font-semibold">20%</span>
             </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-gray-600 font-medium">Total Purchase Value</p>
               <h3 className="text-3xl font-bold text-gray-900 mt-2">₹ 45.67 L</h3>
               <p className="text-xs text-gray-500 mt-1">Top: ABC Ent (₹ 8.45 L)</p>
             </div>
           </div>
        </div>
      </div>

      {/* 3. VIEW TOGGLE */}
      <div className="flex justify-end">
         <div className="bg-white border border-gray-200 p-1 rounded-xl flex shadow-sm">
            <button 
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
               <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
               <List className="h-4 w-4" />
            </button>
         </div>
      </div>

      {/* 4. VENDOR LIST */}
      {viewMode === 'card' ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
               <div key={vendor.id} className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden group hover:border-emerald-300 hover:shadow-xl transition-all">
                  <div className="p-6 border-b border-gray-100 relative">
                     <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreColor(vendor.score).replace('bg-emerald-500/10 text-emerald-500 border-emerald-500/20', 'bg-emerald-50 text-emerald-700 border-emerald-200').replace('bg-amber-500/10 text-amber-500 border-amber-500/20', 'bg-amber-50 text-amber-700 border-amber-200').replace('bg-red-500/10 text-red-500 border-red-500/20', 'bg-red-50 text-red-700 border-red-200')}`}>
                        {vendor.score}%
                     </div>
                     <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate pr-12">{vendor.name}</h3>
                     <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                           <Copy className="h-3 w-3 cursor-pointer hover:text-gray-900" strokeWidth={2.5} /> 
                           <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-xs">{vendor.gstin}</span>
                        </div>
                        <p className="text-xs text-gray-500">PAN: {vendor.pan} • {vendor.state}</p>
                        <div className="flex gap-3 pt-2">
                           <button className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 transition-colors"><Phone className="h-3 w-3" /></button>
                           <button className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 transition-colors"><Mail className="h-3 w-3" /></button>
                        </div>
                     </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-white grid grid-cols-3 divide-x divide-gray-200 text-center">
                     <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Invoices</p>
                        <p className="text-sm font-bold text-gray-900">{vendor.invoices}</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Amount</p>
                        <p className="text-sm font-bold text-gray-900">₹{(vendor.amount/100000).toFixed(2)}L</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">GSTR-1</p>
                        <p className={`text-xs font-bold ${vendor.filingStatus === 'On Time' ? 'text-emerald-600' : vendor.filingStatus === 'Not Filed' ? 'text-red-600' : 'text-amber-600'}`}>{vendor.filingStatus}</p>
                     </div>
                  </div>
                  <div className="p-3 border-t border-gray-100 flex gap-2">
                     <button onClick={() => router.push('/dashboard/sme/vendors/details')} className="flex-1 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors">View Details</button>
                     <button onClick={() => router.push('/dashboard/sme/vendors/reminders')} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors">Send Reminder</button>
                  </div>
               </div>
            ))}
         </div>
      ) : (
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <table className="w-full text-left text-sm">
               <thead className="bg-gradient-to-r from-gray-50 to-white text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Vendor Name</th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Compliance</th>
                     <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Invoices</th>
                     <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Amount</th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">Filing Status</th>
                     <th className="px-4 py-3 text-xs uppercase tracking-wider">State</th>
                     <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {vendors.map((vendor) => (
                     <tr key={vendor.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3">
                           <p className="font-semibold text-gray-900 cursor-pointer hover:text-emerald-600 text-xs" onClick={() => router.push('/dashboard/sme/vendors/details')}>{vendor.name}</p>
                           <p className="text-xs text-gray-500 font-mono">{vendor.gstin}</p>
                        </td>
                        <td className="px-4 py-3">
                           <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                 <div className={`h-full rounded-full ${vendor.score >= 90 ? 'bg-emerald-500' : vendor.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width: `${vendor.score}%`}}></div>
                              </div>
                              <span className="text-xs text-gray-600 font-semibold">{vendor.score}%</span>
                           </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-semibold text-xs">{vendor.invoices}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-900 font-semibold text-xs">₹{vendor.amount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                           <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${vendor.filingStatus === 'On Time' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : vendor.filingStatus === 'Not Filed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {vendor.filingStatus}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{vendor.state}</td>
                        <td className="px-4 py-3 text-right">
                           <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-all">
                                 <MoreVertical className="h-4 w-4" />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden shadow-2xl">
               <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-xl font-bold text-gray-900">Add New Vendor</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"><XCircle className="h-5 w-5" /></button>
               </div>
               <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-4">
                     <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Basic Details</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                           <label className="text-xs text-gray-600 mb-1 block font-medium">Vendor Name <span className="text-red-500">*</span></label>
                           <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Enter vendor name" />
                        </div>
                        <div>
                           <label className="text-xs text-gray-600 mb-1 block font-medium">GSTIN <span className="text-red-500">*</span></label>
                           <div className="relative">
                              <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none uppercase transition-all" placeholder="27ABCDE1234F1Z5" />
                              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                           </div>
                        </div>
                        <div>
                           <label className="text-xs text-gray-600 mb-1 block font-medium">PAN</label>
                           <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Auto-filled from GSTIN" disabled />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200">
                     <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Contact Information</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs text-gray-600 mb-1 block font-medium">Email</label>
                           <input type="email" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="vendor@company.com" />
                        </div>
                        <div>
                           <label className="text-xs text-gray-600 mb-1 block font-medium">Phone</label>
                           <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="+91 98765 43210" />
                        </div>
                     </div>
                  </div>
               </div>
               <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gradient-to-r from-gray-50 to-white">
                  <button onClick={() => setShowAddModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm transition-all font-medium">Cancel</button>
                  <button onClick={() => setShowAddModal(false)} className="btn-primary-custom px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all">Add Vendor</button>
               </div>
            </div>
         </div>
      )}
    </div>
    </div>
  );
}
