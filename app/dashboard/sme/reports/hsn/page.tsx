'use client';

import React from 'react';
import { 
  Calendar, 
  Download, 
  Filter, 
  Plus, 
  Search, 
  Edit3, 
  BarChart2, 
  Grid
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const hsnData = [
  { code: '8471', desc: 'Computers & Processing Units', value: 1245600, percent: 27, color: '#3B82F6', count: 145 },
  { code: '8517', desc: 'Telecom Equipment', value: 890400, percent: 19, color: '#10B981', count: 89 },
  { code: '9403', desc: 'Office Furniture', value: 678900, percent: 15, color: '#F59E0B', count: 45 },
  { code: '9983', desc: 'IT Services (SAC)', value: 450000, percent: 10, color: '#8B5CF6', count: 12 },
  { code: '3926', desc: 'Plastic Articles', value: 230000, percent: 5, color: '#EC4899', count: 34 },
  { code: 'Other', desc: 'Various', value: 1072990, percent: 24, color: '#71717A', count: 99 },
];

const taxDistData = [
  { name: '18%', value: 70, color: '#3B82F6' },
  { name: '12%', value: 22, color: '#10B981' },
  { name: '5%', value: 7, color: '#F59E0B' },
  { name: '28%', value: 1, color: '#EF4444' },
];

export default function HSNAnalysisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-2">
            <span className="text-emerald-700 text-xs font-semibold">REPORTS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">HSN/SAC Analysis</h1>
          <p className="text-gray-600 text-sm mt-1">Category-wise breakdown of purchases and sales</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-white border border-gray-200 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-700 cursor-pointer hover:bg-gray-50 shadow-sm">
               <option>This Month</option>
               <option>This Quarter</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
           </div>
           <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm">
             <Plus className="h-4 w-4" /> Add HSN
           </button>
           <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
             <Download className="h-4 w-4" /> Download Report
           </button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <div className="flex flex-col h-full justify-between">
               <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Codes Used</p>
               <div>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">24</h3>
                  <p className="text-xs text-gray-600 mt-1">18 Goods • 6 Services</p>
               </div>
            </div>
         </div>
         
         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <div className="flex flex-col h-full justify-between">
               <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Purchase Value</p>
               <div>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">₹ 45.67 L</h3>
                  <p className="text-xs text-emerald-600 mt-1">Top: 8471 (27%)</p>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
            <div className="flex flex-col h-full justify-between">
               <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Sales Value</p>
               <div>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">₹ 67.89 L</h3>
                  <p className="text-xs text-emerald-600 mt-1">Top: 8471 (42%)</p>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 flex items-center justify-between">
            <div>
               <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Tax Rate Dist.</p>
               <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 18% (70%)</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> 12% (22%)</div>
               </div>
            </div>
            <div className="h-16 w-16">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={taxDistData} innerRadius={15} outerRadius={25} dataKey="value" stroke="none">
                        {taxDistData.map((e, i) => <Cell key={i} fill={e.color} />)}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* 3. TREEMAP VISUALIZATION (Simulated Grid) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 h-80 flex flex-col">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
               <Grid className="h-5 w-5 text-emerald-600" /> HSN Distribution by Value
            </h3>
            <div className="flex gap-2 text-xs text-gray-600">
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> 18%</div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> 12%</div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded-sm"></div> 5%</div>
            </div>
         </div>
         
         <div className="flex-1 w-full flex gap-1 overflow-hidden">
            <div className="w-[27%] h-full bg-blue-50 border-2 border-blue-300 rounded-lg p-4 relative group hover:bg-blue-100 transition-colors flex flex-col justify-between">
               <div>
                  <span className="font-bold text-blue-700 text-lg">8471</span>
                  <p className="text-xs text-blue-600 line-clamp-2">Computers & Processing Units</p>
               </div>
               <div>
                  <p className="text-xl font-bold text-gray-900">₹12.4 L</p>
                  <p className="text-xs text-blue-700">27%</p>
               </div>
            </div>
            <div className="w-[19%] flex flex-col gap-1">
               <div className="h-full bg-emerald-50 border-2 border-emerald-300 rounded-lg p-3 relative group hover:bg-emerald-100 transition-colors flex flex-col justify-between">
                  <div>
                     <span className="font-bold text-emerald-700">8517</span>
                     <p className="text-xs text-emerald-600 truncate">Telecom Equipment</p>
                  </div>
                  <div>
                     <p className="text-lg font-bold text-gray-900">₹8.9 L</p>
                     <p className="text-xs text-emerald-700">19%</p>
                  </div>
               </div>
            </div>
            <div className="w-[15%] flex flex-col gap-1">
                <div className="h-full bg-amber-50 border-2 border-amber-300 rounded-lg p-3 relative group hover:bg-amber-100 transition-colors flex flex-col justify-between">
                  <div>
                     <span className="font-bold text-amber-700">9403</span>
                     <p className="text-xs text-amber-600 truncate">Office Furniture</p>
                  </div>
                  <div>
                     <p className="text-lg font-bold text-gray-900">₹6.7 L</p>
                     <p className="text-xs text-amber-700">15%</p>
                  </div>
               </div>
            </div>
            <div className="w-[10%] flex flex-col gap-1">
                <div className="h-full bg-purple-50 border-2 border-purple-300 rounded-lg p-2 relative group hover:bg-purple-100 transition-colors flex flex-col justify-between">
                  <div>
                     <span className="font-bold text-purple-700 text-sm">9983</span>
                     <p className="text-[10px] text-purple-600 truncate">IT Svcs</p>
                  </div>
                  <div>
                     <p className="text-sm font-bold text-gray-900">₹4.5L</p>
                  </div>
               </div>
            </div>
            <div className="flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-4 flex items-center justify-center text-center">
               <div>
                  <p className="text-gray-700 font-bold">Others</p>
                  <p className="text-xs text-gray-600">20+ Codes</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">₹10.7 L</p>
               </div>
            </div>
         </div>
      </div>

      {/* 4. DATA TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
         <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input type="text" placeholder="Search code or desc..." className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-emerald-500 outline-none" />
               </div>
               <button className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900"><Filter className="h-4 w-4" /></button>
            </div>
            <span className="text-sm text-gray-900 font-medium">24 HSN Codes Found</span>
         </div>
         <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
               <tr>
                  <th className="px-6 py-3">HSN/SAC</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-center">Type</th>
                  <th className="px-6 py-3 text-center">Tax %</th>
                  <th className="px-6 py-3 text-right">Txn Value</th>
                  <th className="px-6 py-3 text-right">Tax Amount</th>
                  <th className="px-6 py-3 text-right">Count</th>
                  <th className="px-6 py-3 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {hsnData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4 font-mono text-gray-900 font-medium">{row.code}</td>
                     <td className="px-6 py-4 text-gray-700">{row.desc}</td>
                     <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${row.code.startsWith('99') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                           {row.code.startsWith('99') ? 'Service' : 'Goods'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-center text-gray-600">18%</td>
                     <td className="px-6 py-4 text-right text-gray-900 font-mono">₹{row.value.toLocaleString()}</td>
                     <td className="px-6 py-4 text-right text-gray-600 font-mono">₹{(row.value * 0.18).toLocaleString()}</td>
                     <td className="px-6 py-4 text-right text-gray-700">{row.count}</td>
                     <td className="px-6 py-4 text-right">
                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"><Edit3 className="h-4 w-4" /></button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
      </div>
    </div>
  );
}
