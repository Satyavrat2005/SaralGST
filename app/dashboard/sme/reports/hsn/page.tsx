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
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';
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
    <div className="space-y-6 pb-20">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">HSN/SAC Analysis</h1>
          <p className="text-muted-foreground text-sm mt-1">Category-wise breakdown of purchases and sales</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-zinc-900 border border-white/10 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-primary outline-none text-zinc-300 cursor-pointer hover:bg-zinc-800">
               <option>This Month</option>
               <option>This Quarter</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
           </div>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Plus className="h-4 w-4" /> Add HSN
           </button>
           <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
             <Download className="h-4 w-4" /> Download Report
           </button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <BentoCard>
            <div className="flex flex-col h-full justify-between">
               <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Codes Used</p>
               <div>
                  <h3 className="text-3xl font-bold text-white mt-1">24</h3>
                  <p className="text-xs text-zinc-500 mt-1">18 Goods • 6 Services</p>
               </div>
            </div>
         </BentoCard>
         
         <BentoCard>
            <div className="flex flex-col h-full justify-between">
               <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Purchase Value</p>
               <div>
                  <h3 className="text-3xl font-bold text-white mt-1">₹ 45.67 L</h3>
                  <p className="text-xs text-emerald-500 mt-1">Top: 8471 (27%)</p>
               </div>
            </div>
         </BentoCard>

         <BentoCard>
            <div className="flex flex-col h-full justify-between">
               <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sales Value</p>
               <div>
                  <h3 className="text-3xl font-bold text-white mt-1">₹ 67.89 L</h3>
                  <p className="text-xs text-emerald-500 mt-1">Top: 8471 (42%)</p>
               </div>
            </div>
         </BentoCard>

         <BentoCard className="flex items-center justify-between">
            <div>
               <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Tax Rate Dist.</p>
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
         </BentoCard>
      </div>

      {/* 3. TREEMAP VISUALIZATION (Simulated Grid) */}
      <GlassPanel className="p-6 h-80 flex flex-col">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
               <Grid className="h-5 w-5 text-primary" /> HSN Distribution by Value
            </h3>
            <div className="flex gap-2 text-xs text-zinc-400">
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> 18%</div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> 12%</div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded-sm"></div> 5%</div>
            </div>
         </div>
         
         <div className="flex-1 w-full flex gap-1 overflow-hidden">
            <div className="w-[27%] h-full bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 relative group hover:bg-blue-500/30 transition-colors flex flex-col justify-between">
               <div>
                  <span className="font-bold text-blue-400 text-lg">8471</span>
                  <p className="text-xs text-blue-200 line-clamp-2">Computers & Processing Units</p>
               </div>
               <div>
                  <p className="text-xl font-bold text-white">₹12.4 L</p>
                  <p className="text-xs text-blue-300">27%</p>
               </div>
            </div>
            <div className="w-[19%] flex flex-col gap-1">
               <div className="h-full bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-3 relative group hover:bg-emerald-500/30 transition-colors flex flex-col justify-between">
                  <div>
                     <span className="font-bold text-emerald-400">8517</span>
                     <p className="text-xs text-emerald-200 truncate">Telecom Equipment</p>
                  </div>
                  <div>
                     <p className="text-lg font-bold text-white">₹8.9 L</p>
                     <p className="text-xs text-emerald-300">19%</p>
                  </div>
               </div>
            </div>
            <div className="w-[15%] flex flex-col gap-1">
                <div className="h-full bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 relative group hover:bg-amber-500/30 transition-colors flex flex-col justify-between">
                  <div>
                     <span className="font-bold text-amber-400">9403</span>
                     <p className="text-xs text-amber-200 truncate">Office Furniture</p>
                  </div>
                  <div>
                     <p className="text-lg font-bold text-white">₹6.7 L</p>
                     <p className="text-xs text-amber-300">15%</p>
                  </div>
               </div>
            </div>
            <div className="w-[10%] flex flex-col gap-1">
                <div className="h-full bg-purple-500/20 border border-purple-500/50 rounded-lg p-2 relative group hover:bg-purple-500/30 transition-colors flex flex-col justify-between">
                  <div>
                     <span className="font-bold text-purple-400 text-sm">9983</span>
                     <p className="text-[10px] text-purple-200 truncate">IT Svcs</p>
                  </div>
                  <div>
                     <p className="text-sm font-bold text-white">₹4.5L</p>
                  </div>
               </div>
            </div>
            <div className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 flex items-center justify-center text-center">
               <div>
                  <p className="text-zinc-400 font-bold">Others</p>
                  <p className="text-xs text-zinc-500">20+ Codes</p>
                  <p className="text-sm font-bold text-white mt-1">₹10.7 L</p>
               </div>
            </div>
         </div>
      </GlassPanel>

      {/* 4. DATA TABLE */}
      <GlassPanel className="p-0 overflow-hidden">
         <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input type="text" placeholder="Search code or desc..." className="pl-9 pr-4 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:ring-1 focus:ring-primary outline-none" />
               </div>
               <button className="p-1.5 bg-zinc-900 border border-white/10 rounded-lg text-zinc-400 hover:text-white"><Filter className="h-4 w-4" /></button>
            </div>
            <span className="text-sm text-white font-medium">24 HSN Codes Found</span>
         </div>
         <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/50 text-zinc-500 font-medium">
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
            <tbody className="divide-y divide-white/5">
               {hsnData.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                     <td className="px-6 py-4 font-mono text-white font-medium">{row.code}</td>
                     <td className="px-6 py-4 text-zinc-300">{row.desc}</td>
                     <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${row.code.startsWith('99') ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                           {row.code.startsWith('99') ? 'Service' : 'Goods'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-center text-zinc-400">18%</td>
                     <td className="px-6 py-4 text-right text-white font-mono">₹{row.value.toLocaleString()}</td>
                     <td className="px-6 py-4 text-right text-zinc-400 font-mono">₹{(row.value * 0.18).toLocaleString()}</td>
                     <td className="px-6 py-4 text-right text-zinc-300">{row.count}</td>
                     <td className="px-6 py-4 text-right">
                        <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><Edit3 className="h-4 w-4" /></button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </GlassPanel>
    </div>
  );
}
