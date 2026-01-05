'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Download, 
  Plus, 
  Search, 
  Calendar, 
  MoreVertical, 
  Eye, 
  FileText, 
  Edit3, 
  Filter,
  ArrowUpRight,
  CreditCard,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

// Mock Data
const customerTypeData = [
  { name: 'B2B', value: 380, color: '#3B82F6' },
  { name: 'B2C Small', value: 34, color: '#10B981' },
  { name: 'Exports', value: 10, color: '#8B5CF6' },
];

const salesInvoices = [
  { id: 'INV-2025-001', date: '18 Nov 2025', customer: 'XYZ Corporation Ltd', gstin: '27XYZAB1234C1Z5', type: 'B2B', amount: 150000, gst: 27000, total: 177000, payment: 'Paid', gstr1: 'Pending' },
  { id: 'INV-2025-002', date: '18 Nov 2025', customer: 'Walk-in Customer', gstin: 'Unregistered', type: 'B2C Small', amount: 5000, gst: 250, total: 5250, payment: 'Paid', gstr1: 'Pending' },
  { id: 'INV-2025-003', date: '17 Nov 2025', customer: 'Global Tech Inc', gstin: '99INTNL1234X1Z1', type: 'Exports', amount: 500000, gst: 0, total: 500000, payment: 'Pending', gstr1: 'Reported' },
  { id: 'INV-2025-004', date: '16 Nov 2025', customer: 'Retail Chain One', gstin: '19RETAL5678Y1Z2', type: 'B2B', amount: 45000, gst: 8100, total: 53100, payment: 'Overdue', gstr1: 'Reported' },
  { id: 'INV-2025-005', date: '15 Nov 2025', customer: 'Alpha Systems', gstin: '33ALPHA9876Z1Z3', type: 'B2B', amount: 12000, gst: 2160, total: 14160, payment: 'Pending', gstr1: 'Reported' },
];

export default function SalesRegisterPage() {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Overdue': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const getGSTR1Color = (status: string) => {
    switch (status) {
      case 'Reported': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Amended': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getTypeBadge = (type: string) => {
    let color = 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    if (type === 'B2B') color = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (type.includes('B2C')) color = 'bg-green-500/10 text-green-400 border-green-500/20';
    if (type === 'Exports') color = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>{type}</span>;
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Sales Register</h1>
            <p className="text-muted-foreground text-sm mt-1">All outward invoices to customers</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
                <Download className="h-4 w-4" /> Export
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 overflow-hidden pointer-events-none group-hover:pointer-events-auto">
                 <button className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5">GSTR-1 Format</button>
                 <button className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5">Export to Excel</button>
                 <button className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5">Export to PDF</button>
              </div>
            </div>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Invoice
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between backdrop-blur-sm">
           <div className="flex flex-wrap items-center gap-3 w-full">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2 appearance-none cursor-pointer hover:bg-black/40">
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Quarter</option>
                </select>
              </div>

              <div className="w-px h-8 bg-white/5 hidden md:block"></div>

              <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
                <option>All Types</option>
                <option>B2B</option>
                <option>B2C Large</option>
                <option>B2C Small</option>
                <option>Exports</option>
              </select>

              <select className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 cursor-pointer hover:bg-black/40">
                <option>All Payments</option>
                <option>Paid</option>
                <option>Pending</option>
                <option>Overdue</option>
              </select>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input type="text" className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2 placeholder-zinc-600" placeholder="Search customers..." />
              </div>
           </div>
           <button className="text-xs text-zinc-500 hover:text-white whitespace-nowrap">Clear Filters</button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <h3 className="text-3xl font-bold text-white mt-2">₹ 67,89,450</h3>
              <p className="text-xs text-zinc-500 mt-1">424 Invoices • This Month</p>
            </div>
            <div className="px-2 py-1 bg-emerald-500/10 rounded text-emerald-500 text-xs font-medium flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" /> 22%
            </div>
          </div>
        </BentoCard>

        <BentoCard className="p-6">
          <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-sm text-muted-foreground">Output Tax Liability</p>
               <h3 className="text-3xl font-bold text-amber-500 mt-2">₹ 12,22,101</h3>
             </div>
             <div className="p-2 bg-amber-500/10 rounded-lg">
               <CreditCard className="h-5 w-5 text-amber-500" />
             </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-3">
             <div>
               <p className="text-[10px] text-zinc-500">CGST</p>
               <p className="text-xs font-mono text-white">₹6.11L</p>
             </div>
             <div>
               <p className="text-[10px] text-zinc-500">SGST</p>
               <p className="text-xs font-mono text-white">₹6.11L</p>
             </div>
             <div>
               <p className="text-[10px] text-zinc-500">IGST</p>
               <p className="text-xs font-mono text-white">₹0</p>
             </div>
          </div>
        </BentoCard>

        <BentoCard className="p-4 flex items-center gap-4">
           <div className="h-24 w-24 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerTypeData}
                    innerRadius={25}
                    outerRadius={35}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {customerTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #333' }} itemStyle={{color: '#fff'}} />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-white mb-2">Customer Breakdown</p>
              {customerTypeData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                      <span className="text-zinc-400">{item.name}</span>
                   </div>
                   <span className="text-white font-mono">{item.value}</span>
                </div>
              ))}
           </div>
        </BentoCard>
      </div>

      {/* 3. DATA TABLE */}
      <GlassPanel className="p-0 overflow-hidden flex flex-col h-[600px]">
        {/* Table Actions Bar */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
           <div className="flex items-center gap-4">
              <span className="text-sm text-white font-medium">424 Invoices Found</span>
           </div>
           {selectedRows.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                 <span className="text-sm text-zinc-300">{selectedRows.length} selected</span>
                 <div className="flex items-center rounded-lg bg-zinc-800 border border-white/10 overflow-hidden">
                    <button className="px-3 py-1.5 text-xs hover:bg-white/5 text-zinc-300 border-r border-white/10">Generate E-Invoice</button>
                    <button className="px-3 py-1.5 text-xs hover:bg-white/5 text-zinc-300 border-r border-white/10">Send Reminder</button>
                    <button className="px-3 py-1.5 text-xs hover:bg-white/5 text-red-400 hover:text-red-300">Delete</button>
                 </div>
              </div>
           )}
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm relative">
            <thead className="text-zinc-500 font-medium bg-zinc-950/50 sticky top-0 z-10 backdrop-blur-sm">
               <tr>
                 <th className="px-6 py-3 w-12"></th>
                 <th className="px-6 py-3">Invoice No</th>
                 <th className="px-6 py-3">Date</th>
                 <th className="px-6 py-3">Customer</th>
                 <th className="px-6 py-3 text-center">Type</th>
                 <th className="px-6 py-3 text-right">Amount</th>
                 <th className="px-6 py-3 text-right">GST</th>
                 <th className="px-6 py-3 text-right">Total</th>
                 <th className="px-6 py-3 text-center">Payment</th>
                 <th className="px-6 py-3 text-center">GSTR-1</th>
                 <th className="px-6 py-3 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {salesInvoices.map((inv) => (
                 <tr key={inv.id} className="group hover:bg-white/5 transition-colors">
                   <td className="px-6 py-4">
                     <input 
                       type="checkbox" 
                       className="rounded bg-zinc-800 border-zinc-600 text-primary focus:ring-primary"
                       checked={selectedRows.includes(inv.id)}
                       onChange={() => toggleRowSelection(inv.id)}
                     />
                   </td>
                   <td className="px-6 py-4 font-medium text-white">{inv.id}</td>
                   <td className="px-6 py-4 text-zinc-400">{inv.date}</td>
                   <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-200">{inv.customer}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{inv.gstin}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4 text-center">
                      {getTypeBadge(inv.type)}
                   </td>
                   <td className="px-6 py-4 text-right text-zinc-300 font-mono">₹{inv.amount.toLocaleString()}</td>
                   <td className="px-6 py-4 text-right text-zinc-300 font-mono">₹{inv.gst.toLocaleString()}</td>
                   <td className="px-6 py-4 text-right font-bold text-white font-mono">₹{inv.total.toLocaleString()}</td>
                   <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPaymentColor(inv.payment)}`}>
                         {inv.payment}
                      </span>
                   </td>
                   <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${getGSTR1Color(inv.gstr1)}`}>
                         {inv.gstr1 === 'Reported' && <CheckCircle2 className="h-3 w-3" />}
                         {inv.gstr1 === 'Pending' && <Clock className="h-3 w-3" />}
                         {inv.gstr1}
                      </span>
                   </td>
                   <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         {inv.payment !== 'Paid' && (
                           <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-emerald-500" title="Mark Paid">
                              <CheckCircle2 className="h-4 w-4" />
                           </button>
                         )}
                         <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white" title="View Details">
                            <Eye className="h-4 w-4" />
                         </button>
                         <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white">
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
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-zinc-900/50">
           <div className="text-xs text-zinc-500">Showing 1-50 of 424</div>
           <div className="flex items-center gap-2">
              <div className="flex gap-1">
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700" disabled>Previous</button>
                 <button className="px-2 py-1 rounded bg-primary text-white text-xs">1</button>
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">2</button>
                 <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:text-white hover:bg-zinc-700">Next</button>
              </div>
           </div>
        </div>
      </GlassPanel>
    </div>
  );
}
