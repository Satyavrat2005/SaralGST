'use client';

import React from 'react';
import BentoCard from '../../../components/ui/BentoCard';
import { FileCheck, AlertOctagon, ChevronRight, Search, Filter } from 'lucide-react';

export default function CADashboard() {
  const clients = [
    { name: 'Alpha Tech Solutions', gstin: '27ABCDE1234F1Z5', gstr1: 'Filed', gstr3b: 'Filed', score: 98 },
    { name: 'Beta Retailers', gstin: '29XYZZZ9876G2Z1', gstr1: 'Pending', gstr3b: 'Pending', score: 45 },
    { name: 'Gamma Logistics', gstin: '07PQRST5678H1Z9', gstr1: 'Filed', gstr3b: 'Pending', score: 72 },
    { name: 'Delta Corp', gstin: '19LMNOP4321J1Z2', gstr1: 'Filed', gstr3b: 'Filed', score: 100 },
    { name: 'Epsilon Traders', gstin: '33UVWXY8765K1Z3', gstr1: 'Pending', gstr3b: 'Pending', score: 60 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar Portfolio Overview */}
      <div className="flex items-center justify-between bg-card border border-border/50 p-4 rounded-xl">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Clients</p>
            <p className="text-2xl font-bold text-white flex items-center gap-2">
              45 <span className="text-xs font-normal text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">+2 new</span>
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-800"></div>
          <div>
             <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Filings Pending</p>
             <p className="text-2xl font-bold text-amber-500">12</p>
          </div>
          <div className="h-8 w-px bg-zinc-800"></div>
           <div>
             <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Critical Alerts</p>
             <p className="text-2xl font-bold text-red-500">3</p>
          </div>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-lg shadow-primary/20 hover:bg-primary/90">
             <FileCheck className="h-4 w-4" /> Bulk File GSTR-1
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Client Table */}
        <div className="lg:col-span-3 space-y-4">
           {/* Table Controls */}
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Client Portfolio</h3>
              <div className="flex items-center gap-2">
                 <div className="relative">
                   <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                   <input type="text" placeholder="Search Client or GSTIN" className="bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:border-primary/50 outline-none w-64" />
                 </div>
                 <button className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400"><Filter className="h-4 w-4" /></button>
              </div>
           </div>

           {/* Table */}
           <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
             <table className="w-full text-left text-sm">
               <thead className="bg-white/5 text-muted-foreground font-medium">
                 <tr>
                   <th className="px-6 py-3">Client Name</th>
                   <th className="px-6 py-3">GSTR-1</th>
                   <th className="px-6 py-3">GSTR-3B</th>
                   <th className="px-6 py-3">ITC Match Score</th>
                   <th className="px-6 py-3 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {clients.map((client, idx) => (
                   <tr key={idx} className="hover:bg-white/5 transition-colors group cursor-pointer">
                     <td className="px-6 py-4">
                       <p className="font-medium text-white">{client.name}</p>
                       <p className="text-xs text-zinc-500 font-mono">{client.gstin}</p>
                     </td>
                     <td className="px-6 py-4">
                       <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${client.gstr1 === 'Filed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                         <span className={`h-1.5 w-1.5 rounded-full ${client.gstr1 === 'Filed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                         {client.gstr1}
                       </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${client.gstr3b === 'Filed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                         <span className={`h-1.5 w-1.5 rounded-full ${client.gstr3b === 'Filed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                         {client.gstr3b}
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="w-full max-w-[100px]">
                         <div className="flex justify-between text-xs mb-1">
                           <span className={client.score < 50 ? 'text-red-400' : 'text-white'}>{client.score}%</span>
                         </div>
                         <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                           <div 
                            className={`h-full rounded-full ${client.score < 50 ? 'bg-red-500' : client.score < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${client.score}%` }}
                           ></div>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <ChevronRight className="h-4 w-4 text-zinc-600 inline-block group-hover:text-white transition-colors" />
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* Sidebar Right - Activity & Alerts */}
        <div className="space-y-6">
           
           {/* Compliance Alerts */}
           <BentoCard title="Compliance Alerts" className="border-red-500/20 bg-red-500/5">
              <div className="space-y-3">
                 <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertOctagon className="h-4 w-4 text-red-500 mt-0.5" />
                      <p className="text-sm text-zinc-200 leading-snug">
                        <span className="font-bold text-white">3 Clients</span> have unmatched GSTR-2B data {'>'} ₹50k.
                      </p>
                    </div>
                    <button className="mt-2 text-xs font-medium text-red-400 hover:text-red-300 underline">View Details</button>
                 </div>
                 <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-lg">
                    <p className="text-sm text-zinc-400">Beta Retailers GST registration expires in 5 days.</p>
                 </div>
              </div>
           </BentoCard>

           {/* Team Activity Feed */}
           <BentoCard title="Team Activity">
             <div className="relative pl-4 border-l border-zinc-800 space-y-6">
               <div className="relative">
                 <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-zinc-600 border-2 border-card"></div>
                 <p className="text-xs text-zinc-500 mb-0.5">10 mins ago</p>
                 <p className="text-sm text-zinc-300"><span className="font-semibold text-white">Rohan (Jr. CA)</span> drafted GSTR-1 for Client X.</p>
               </div>
               <div className="relative">
                 <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-card"></div>
                 <p className="text-xs text-zinc-500 mb-0.5">1 hour ago</p>
                 <p className="text-sm text-zinc-300"><span className="font-semibold text-white">System</span> auto-reconciled 450 invoices for Delta Corp.</p>
               </div>
               <div className="relative">
                 <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-zinc-600 border-2 border-card"></div>
                 <p className="text-xs text-zinc-500 mb-0.5">2 hours ago</p>
                 <p className="text-sm text-zinc-300"><span className="font-semibold text-white">Priya</span> downloaded GSTR-2A for all retail clients.</p>
               </div>
             </div>
           </BentoCard>

        </div>

      </div>
    </div>
  );
}
