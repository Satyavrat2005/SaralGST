'use client';

import React from 'react';
import BentoCard from '../../../components/ui/BentoCard';
import GlassPanel from '../../../components/ui/GlassPanel';
import { UploadCloud, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function SMEDashboard() {
  // Mock Data
  const itcData = [
    { name: 'Jan', output: 4000, itc: 2400 },
    { name: 'Feb', output: 3000, itc: 1398 },
    { name: 'Mar', output: 2000, itc: 9800 },
    { name: 'Apr', output: 2780, itc: 3908 },
    { name: 'May', output: 1890, itc: 4800 },
    { name: 'Jun', output: 2390, itc: 3800 },
  ];

  const healthData = [
    { name: 'Score', value: 85 },
    { name: 'Remaining', value: 15 },
  ];
  const COLORS = ['#10B981', '#27272a'];

  return (
    <div className="space-y-6">
      {/* Top Bar Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassPanel className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Business Health Score</p>
            <h2 className="text-4xl font-bold text-white">85<span className="text-lg text-muted-foreground font-normal">/100</span></h2>
            <p className="text-xs text-emerald-400 mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" /> Top 10% of peers
            </p>
          </div>
          <div className="h-16 w-16 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={32}
                  startAngle={180}
                  endAngle={0}
                  fill="#8884d8"
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {healthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
           <p className="text-sm text-muted-foreground mb-1">Liability This Month</p>
           <h2 className="text-3xl font-bold text-white">₹ 2,45,000</h2>
           <div className="mt-3 h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
             <div className="h-full w-[60%] bg-red-500/80"></div>
           </div>
           <p className="text-xs text-zinc-500 mt-2">60% accumulated vs last month</p>
        </GlassPanel>

        <GlassPanel className="p-6 bg-gradient-to-br from-emerald-900/20 to-transparent border-emerald-500/20">
           <p className="text-sm text-emerald-400/80 mb-1">ITC Available</p>
           <h2 className="text-3xl font-bold text-emerald-500">₹ 1,80,000</h2>
           <button className="mt-3 w-full py-1.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors">
             Offset Liability Now
           </button>
        </GlassPanel>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 grid-rows-2 gap-6 h-auto lg:h-[600px]">
        
        {/* Main Chart - ITC vs Output */}
        <BentoCard className="lg:col-span-2 lg:row-span-2" title="Financial Overview: ITC vs Liability">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={itcData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{fill: '#666'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#666" tick={{fill: '#666'}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="output" stroke="#ef4444" strokeWidth={2} dot={{r:4, fill:'#ef4444'}} activeDot={{r:6}} name="Liability" />
              <Line type="monotone" dataKey="itc" stroke="#10B981" strokeWidth={2} dot={{r:4, fill:'#10B981'}} activeDot={{r:6}} name="ITC" />
            </LineChart>
          </ResponsiveContainer>
        </BentoCard>

        {/* Notification Card - Deadline Guardian */}
        <BentoCard className="border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-500">Deadline Guardian</h4>
              <p className="text-sm text-zinc-300 mt-1">GSTR-1 filing due in <span className="font-bold text-white">2 days</span>.</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                 WhatsApp reminder sent
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Quick Action */}
        <BentoCard title="Quick Actions">
          <div className="border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center h-32 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
              <UploadCloud className="h-5 w-5 text-zinc-400 group-hover:text-white" />
            </div>
            <p className="text-sm font-medium text-zinc-300">Upload Purchase Invoice</p>
            <p className="text-xs text-zinc-500">Drag & drop or click to browse</p>
          </div>
        </BentoCard>

        {/* Recent Activity */}
        <BentoCard className="lg:col-span-1 lg:row-span-1 overflow-hidden" title="Recent Smart Invoices">
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">INV</div>
                   <div>
                     <p className="text-sm font-medium text-white">TechSol Pvt Ltd</p>
                     <p className="text-xs text-zinc-500">₹ 12,400 • Just now</p>
                   </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  IRN GEN
                </span>
              </div>
            ))}
          </div>
        </BentoCard>

      </div>
    </div>
  );
}
