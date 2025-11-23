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
    <div className="space-y-6 pb-20">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vendor Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Track vendor compliance and invoice patterns</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Download className="h-4 w-4" /> Export
           </button>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Upload className="h-4 w-4" /> Import
           </button>
           <button 
             onClick={() => setShowAddModal(true)}
             className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
           >
             <Plus className="h-4 w-4" /> Add Vendor
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between backdrop-blur-sm">
         <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input type="text" className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2 placeholder-zinc-600" placeholder="Search by name, GSTIN..." />
            </div>
            
            <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
              <option>All Compliance Levels</option>
              <option>Compliant</option>
              <option>At Risk</option>
              <option>Non-Compliant</option>
            </select>

            <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
              <option>All States</option>
              <option>Maharashtra</option>
              <option>Karnataka</option>
              <option>Delhi</option>
            </select>

            <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
              <option>Sort By: Compliance</option>
              <option>Sort By: Total Amount</option>
              <option>Sort By: Name</option>
            </select>
         </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard className="p-6">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-muted-foreground">Total Vendors</p>
               <h3 className="text-3xl font-bold text-white mt-2">60</h3>
               <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                  <span>Active: 54</span>
                  <span>Inactive: 6</span>
               </div>
             </div>
             <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-1 rounded border border-emerald-500/20">+3 this month</span>
           </div>
        </BentoCard>

        <BentoCard className="p-4 flex items-center gap-6">
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
                 <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #333' }} itemStyle={{color: '#fff'}} />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="flex-1 space-y-1">
             <p className="text-sm font-medium text-white mb-1">Compliance Overview</p>
             <div className="flex items-center justify-between text-xs">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-zinc-400">Compliant</span>
               </div>
               <span className="text-white">75%</span>
             </div>
             <div className="flex items-center justify-between text-xs">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-zinc-400">At Risk</span>
               </div>
               <span className="text-white">20%</span>
             </div>
           </div>
        </BentoCard>

        <BentoCard className="p-6">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm text-muted-foreground">Total Purchase Value</p>
               <h3 className="text-3xl font-bold text-white mt-2">₹ 45.67 L</h3>
               <p className="text-xs text-zinc-500 mt-1">Top: ABC Ent (₹ 8.45 L)</p>
             </div>
           </div>
        </BentoCard>
      </div>

      {/* 3. VIEW TOGGLE */}
      <div className="flex justify-end">
         <div className="bg-zinc-900 p-1 rounded-lg border border-white/10 flex">
            <button 
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
               <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
               <List className="h-4 w-4" />
            </button>
         </div>
      </div>

      {/* 4. VENDOR LIST */}
      {viewMode === 'card' ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
               <GlassPanel key={vendor.id} className="p-0 group hover:border-primary/30 transition-all">
                  <div className="p-6 border-b border-white/5 relative">
                     <div className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold border ${getScoreColor(vendor.score)}`}>
                        {vendor.score}%
                     </div>
                     <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate pr-12">{vendor.name}</h3>
                     <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                           <Copy className="h-3 w-3 cursor-pointer hover:text-white" /> 
                           <span className="font-mono bg-black/20 px-1.5 rounded">{vendor.gstin}</span>
                        </div>
                        <p className="text-xs text-zinc-500">PAN: {vendor.pan} • {vendor.state}</p>
                        <div className="flex gap-3 pt-2">
                           <button className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"><Phone className="h-3 w-3" /></button>
                           <button className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"><Mail className="h-3 w-3" /></button>
                        </div>
                     </div>
                  </div>
                  <div className="p-4 bg-zinc-900/30 grid grid-cols-3 gap-2 text-center">
                     <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Invoices</p>
                        <p className="text-sm font-bold text-white">{vendor.invoices}</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Amount</p>
                        <p className="text-sm font-bold text-white">₹{(vendor.amount/100000).toFixed(2)}L</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-zinc-500 uppercase">GSTR-1</p>
                        <p className={`text-xs font-bold ${vendor.filingStatus === 'On Time' ? 'text-emerald-500' : vendor.filingStatus === 'Not Filed' ? 'text-red-500' : 'text-amber-500'}`}>{vendor.filingStatus}</p>
                     </div>
                  </div>
                  <div className="p-3 border-t border-white/5 flex gap-2">
                     <button onClick={() => router.push('/dashboard/sme/vendors/details')} className="flex-1 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">View Details</button>
                     <button onClick={() => router.push('/dashboard/sme/vendors/reminders')} className="flex-1 py-2 rounded-lg border border-white/10 text-zinc-300 text-xs font-medium hover:bg-white/5 transition-colors">Send Reminder</button>
                  </div>
               </GlassPanel>
            ))}
         </div>
      ) : (
         <GlassPanel className="p-0 overflow-hidden">
            <table className="w-full text-left text-sm">
               <thead className="bg-white/5 text-zinc-500 font-medium">
                  <tr>
                     <th className="px-6 py-3">Vendor Name</th>
                     <th className="px-6 py-3">Compliance</th>
                     <th className="px-6 py-3 text-right">Invoices</th>
                     <th className="px-6 py-3 text-right">Amount</th>
                     <th className="px-6 py-3">Filing Status</th>
                     <th className="px-6 py-3">State</th>
                     <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {vendors.map((vendor) => (
                     <tr key={vendor.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                           <p className="font-medium text-white cursor-pointer hover:text-primary" onClick={() => router.push('/dashboard/sme/vendors/details')}>{vendor.name}</p>
                           <p className="text-xs text-zinc-500 font-mono">{vendor.gstin}</p>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                 <div className={`h-full rounded-full ${vendor.score >= 90 ? 'bg-emerald-500' : vendor.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width: `${vendor.score}%`}}></div>
                              </div>
                              <span className="text-xs text-zinc-400">{vendor.score}%</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right text-zinc-300">{vendor.invoices}</td>
                        <td className="px-6 py-4 text-right font-mono text-white">₹{vendor.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${vendor.filingStatus === 'On Time' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : vendor.filingStatus === 'Not Filed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                              {vendor.filingStatus}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">{vendor.state}</td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white">
                                 <MoreVertical className="h-4 w-4" />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </GlassPanel>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden shadow-2xl">
               <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Add New Vendor</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"><XCircle className="h-5 w-5" /></button>
               </div>
               <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-4">
                     <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Basic Details</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                           <label className="text-xs text-zinc-500 mb-1 block">Vendor Name <span className="text-red-500">*</span></label>
                           <input type="text" className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" placeholder="Enter vendor name" />
                        </div>
                        <div>
                           <label className="text-xs text-zinc-500 mb-1 block">GSTIN <span className="text-red-500">*</span></label>
                           <div className="relative">
                              <input type="text" className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none uppercase" placeholder="27ABCDE1234F1Z5" />
                              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                           </div>
                        </div>
                        <div>
                           <label className="text-xs text-zinc-500 mb-1 block">PAN</label>
                           <input type="text" className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-400 focus:border-primary outline-none" placeholder="Auto-filled from GSTIN" disabled />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                     <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Contact Information</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs text-zinc-500 mb-1 block">Email</label>
                           <input type="email" className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" placeholder="vendor@company.com" />
                        </div>
                        <div>
                           <label className="text-xs text-zinc-500 mb-1 block">Phone</label>
                           <input type="text" className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" placeholder="+91 98765 43210" />
                        </div>
                     </div>
                  </div>
               </div>
               <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-zinc-900/50">
                  <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                  <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">Add Vendor</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
