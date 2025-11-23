'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Calendar, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  MoreVertical, 
  Search, 
  Filter, 
  Download,
  Eye,
  CheckSquare,
  AlertOctagon,
  Info,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import GlassPanel from '../../../components/ui/GlassPanel';
import BentoCard from '../../../components/ui/BentoCard';

// --- MOCK DATA ---

const ITCTrendData = [
  { month: 'Jun', available: 120000, claimed: 115000, lost: 5000 },
  { month: 'Jul', available: 135000, claimed: 130000, lost: 5000 },
  { month: 'Aug', available: 110000, claimed: 100000, lost: 10000 },
  { month: 'Sep', available: 145000, claimed: 140000, lost: 5000 },
  { month: 'Oct', available: 160000, claimed: 158000, lost: 2000 },
  { month: 'Nov', available: 180000, claimed: 165000, lost: 15000 },
];

const VendorComplianceData = [
  { name: 'Compliant', value: 45, color: '#10B981' },
  { name: 'At Risk', value: 12, color: '#F59E0B' },
  { name: 'Non-Compliant', value: 3, color: '#EF4444' },
];

const AlertsData = [
  { id: 1, type: 'critical', message: 'GSTIN validation failed for INV-1234', time: '20 mins ago' },
  { id: 2, type: 'warning', message: 'Vendor ABC Corp hasn\'t filed GSTR-1 yet', time: '2 hours ago' },
  { id: 3, type: 'info', message: 'ITC claim reduced by ₹5,000 due to mismatch', time: '4 hours ago' },
  { id: 4, type: 'critical', message: 'GSTR-3B filing deadline tomorrow', time: '5 hours ago' },
  { id: 5, type: 'warning', message: 'Unreconciled difference found in purchase register', time: '1 day ago' },
];

const RecentInvoicesData = [
  { id: 'INV-001234', date: '18 Nov 2025', type: 'Purchase', party: 'TechSol Pvt Ltd', gstin: '27AAACW1234F1Z5', amount: 45600, gst: 8208, status: 'Matched' },
  { id: 'INV-001235', date: '18 Nov 2025', type: 'Sales', party: 'Alpha Traders', gstin: '29XYZZZ9876G2Z1', amount: 12500, gst: 2250, status: 'Pending' },
  { id: 'INV-001236', date: '17 Nov 2025', type: 'Purchase', party: 'Gamma Logistics', gstin: '07PQRST5678H1Z9', amount: 89000, gst: 16020, status: 'Failed' },
  { id: 'INV-001237', date: '17 Nov 2025', type: 'Purchase', party: 'Beta Retail', gstin: '19LMNOP4321J1Z2', amount: 3400, gst: 612, status: 'Matched' },
  { id: 'INV-001238', date: '16 Nov 2025', type: 'Sales', party: 'Delta Corp', gstin: '33UVWXY8765K1Z3', amount: 150000, gst: 27000, status: 'Matched' },
];

export default function SMEDashboard() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('This Month');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Matched': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview for <span className="text-white font-medium">Saral GST Demo Account</span></p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select 
               value={dateRange}
               onChange={(e) => setDateRange(e.target.value)}
               className="appearance-none bg-secondary/50 border border-white/10 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-primary outline-none cursor-pointer hover:bg-secondary/80 transition-colors text-white font-medium"
             >
               <option>This Month</option>
               <option>Last Month</option>
               <option>This Quarter</option>
               <option>Custom Range</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
           </div>
           
           <button 
             onClick={handleRefresh}
             className="p-2 rounded-lg bg-secondary/50 border border-white/10 text-zinc-400 hover:text-white hover:bg-secondary transition-all"
             title="Refresh Data"
           >
             <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
           </button>
           
           <span className="text-xs text-muted-foreground whitespace-nowrap hidden md:inline-block">
             Last updated: <span className="text-zinc-400">2 mins ago</span>
           </span>
        </div>
      </div>

      {/* 2. KEY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Invoices */}
        <BentoCard 
          className="cursor-pointer hover:border-primary/30 transition-colors group"
          onClick={() => router.push('/dashboard/sme/invoices/purchase')}
        >
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-primary transition-colors">1,247</h3>
                <p className="text-xs text-zinc-500 mt-1">This Month</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Purchase</span>
                <span className="text-white font-mono">823</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Sales</span>
                <span className="text-white font-mono">424</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center text-xs text-emerald-500 font-medium">
                <ArrowUpRight className="h-3 w-3 mr-1" /> +12% vs last month
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Card 2: ITC Available */}
        <BentoCard 
          className="cursor-pointer hover:border-emerald-500/30 transition-colors group"
          onClick={() => router.push('/dashboard/sme/itc')}
        >
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ITC Available</p>
                <h3 className="text-3xl font-bold text-emerald-500 mt-1">₹ 2.45 L</h3>
                <p className="text-xs text-zinc-500 mt-1">Eligible for Claim</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Claimed</span>
                <span className="text-white font-mono">₹ 1.80 L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Pending</span>
                <span className="text-white font-mono">₹ 0.65 L</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center text-xs text-emerald-500 font-medium">
                <ArrowUpRight className="h-3 w-3 mr-1" /> +5% vs last month
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Card 3: Tax Payable */}
        <BentoCard 
          className="cursor-pointer hover:border-amber-500/30 transition-colors group"
          onClick={() => router.push('/dashboard/sme/returns/gstr3b')}
        >
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tax Payable</p>
                <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-amber-500 transition-colors">₹ 1.12 L</h3>
                <p className="text-xs text-zinc-500 mt-1">For GSTR-3B</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Output Tax</span>
                <span className="text-white font-mono">₹ 2.92 L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Input Credit</span>
                <span className="text-emerald-500 font-mono">-₹ 1.80 L</span>
              </div>
              <div className="pt-2 border-t border-white/5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/20 uppercase tracking-wide">
                  Due: 20th Nov
                </span>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Card 4: Pending Actions */}
        <BentoCard 
          className="cursor-pointer hover:border-red-500/30 transition-colors group"
          onClick={() => router.push('/dashboard/sme/alerts')}
        >
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Actions</p>
                <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-red-500 transition-colors">23</h3>
                <p className="text-xs text-zinc-500 mt-1">Requires Attention</p>
              </div>
              <div className="relative p-2 rounded-lg bg-red-500/10 text-red-500">
                <AlertTriangle className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Failed Validations</span>
                <span className="text-red-400 font-bold font-mono">12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">IMS Decisions</span>
                <span className="text-white font-mono">8</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Vendor Reminders</span>
                <span className="text-white font-mono">3</span>
              </div>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* 3. STATUS PROGRESS BARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* GSTR-1 Status */}
        <GlassPanel className="p-4 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/sme/returns/gstr1')}>
           <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-white">GSTR-1 Filing</h4>
                <p className="text-xs text-emerald-500 mt-0.5">Draft Ready - 85% Complete</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/sme/returns/gstr1'); }}
                className="text-xs font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-2 py-1 rounded transition-colors"
              >
                View Draft
              </button>
           </div>
           
           <div className="space-y-2">
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              </div>
              <p className="text-[10px] text-zinc-500 text-right">Last Filed: 11th Nov 2025</p>
           </div>
        </GlassPanel>

        {/* GSTR-3B Status */}
        <GlassPanel className="p-4 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/sme/returns/gstr3b')}>
           <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-white">GSTR-3B Filing</h4>
                <p className="text-xs text-amber-500 mt-0.5">Ready to File</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/sme/returns/gstr3b'); }}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded shadow-lg shadow-emerald-500/20 transition-all"
              >
                File Now
              </button>
           </div>
           
           <div className="space-y-2">
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[100%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-amber-500 font-bold text-right uppercase">Due Date: 20th Nov</p>
           </div>
        </GlassPanel>

        {/* Reconciliation Status */}
        <GlassPanel className="p-4 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/sme/reconciliation/run')}>
           <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-white">Reconciliation</h4>
                <p className="text-xs text-zinc-400 mt-0.5"><span className="text-white font-bold">92%</span> Matched • <span className="text-red-400">67</span> Discrepancies</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/sme/reconciliation/run'); }}
                className="text-xs font-medium text-primary hover:text-white border border-primary/30 hover:bg-primary hover:border-primary px-2 py-1 rounded transition-colors"
              >
                Run Now
              </button>
           </div>
           
           <div className="space-y-2">
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 w-[92%]"></div>
                <div className="h-full bg-red-500 w-[8%]"></div>
              </div>
              <p className="text-[10px] text-zinc-500 text-right">Last Run: 2 hours ago</p>
           </div>
        </GlassPanel>

      </div>

      {/* 4. MAIN CONTENT AREA (Charts + Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px]">
        
        {/* LEFT SECTION (Charts) */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          
          {/* Chart 1: ITC Trend */}
          <GlassPanel className="flex-1 p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> ITC Trend Analysis
              </h3>
              <div className="flex gap-2">
                 <span className="flex items-center text-[10px] text-zinc-400"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>Available</span>
                 <span className="flex items-center text-[10px] text-zinc-400"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></div>Claimed</span>
                 <span className="flex items-center text-[10px] text-zinc-400"><div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>Lost</span>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ITCTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="month" stroke="#666" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#666" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: '12px' }}
                    labelStyle={{ color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}
                    formatter={(value: number) => [`₹ ${value.toLocaleString()}`, '']}
                  />
                  <Line type="monotone" dataKey="available" stroke="#3b82f6" strokeWidth={2} dot={{r:3, fill:'#3b82f6'}} activeDot={{r:6, strokeWidth:0}} name="Available" />
                  <Line type="monotone" dataKey="claimed" stroke="#10B981" strokeWidth={2} dot={{r:3, fill:'#10B981'}} activeDot={{r:6, strokeWidth:0}} name="Claimed" />
                  <Line type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} dot={{r:3, fill:'#ef4444'}} activeDot={{r:6, strokeWidth:0}} name="Lost" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

          {/* Chart 2: Vendor Compliance - Modified to fit height */}
          <div className="h-48 grid grid-cols-1 md:grid-cols-2 gap-6">
             <GlassPanel className="p-4 flex items-center justify-between">
                <div>
                   <h4 className="text-sm font-semibold text-white mb-4">Vendor Compliance</h4>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-zinc-300"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Compliant (45)</div>
                      <div className="flex items-center gap-2 text-xs text-zinc-300"><div className="w-2 h-2 rounded-full bg-amber-500"></div> At Risk (12)</div>
                      <div className="flex items-center gap-2 text-xs text-zinc-300"><div className="w-2 h-2 rounded-full bg-red-500"></div> Non-Compliant (3)</div>
                   </div>
                </div>
                <div className="h-32 w-32 relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                           data={VendorComplianceData}
                           cx="50%"
                           cy="50%"
                           innerRadius={40}
                           outerRadius={55}
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                         >
                           {VendorComplianceData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                         </Pie>
                         <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #333' }} itemStyle={{color: '#fff'}} />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-white">60</span>
                   </div>
                </div>
             </GlassPanel>
             
             {/* Quick Stats or Promo */}
             <BentoCard title="Reconciliation Efficiency" className="flex flex-col justify-center">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                       <CheckSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-white">98.5%</h3>
                       <p className="text-xs text-muted-foreground">Accuracy Rate</p>
                    </div>
                 </div>
                 <div className="mt-4 text-xs text-zinc-400 leading-relaxed">
                   Your AI-driven reconciliation has saved approximately <span className="text-emerald-400 font-bold">14 hours</span> of manual work this month.
                 </div>
             </BentoCard>
          </div>
        </div>

        {/* RIGHT SECTION (Sticky Alerts Panel) */}
        <div className="lg:col-span-1 h-full relative">
           <GlassPanel className="h-full max-h-[500px] flex flex-col sticky top-6 overflow-hidden border-amber-500/20 bg-amber-500/5">
              <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20 backdrop-blur-md">
                 <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">Critical Alerts</h3>
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white">5</span>
                 </div>
                 <button onClick={() => router.push('/dashboard/sme/alerts')} className="text-xs font-medium text-primary hover:text-white transition-colors">View All</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                 {AlertsData.map((alert) => (
                    <div key={alert.id} className="group p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10 transition-all cursor-pointer relative">
                       <div className="flex gap-3">
                          <div className="mt-0.5 shrink-0">
                             {alert.type === 'critical' && <AlertOctagon className="h-4 w-4 text-red-500" />}
                             {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                             {alert.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                          </div>
                          <div className="flex-1">
                             <p className="text-sm text-zinc-200 leading-snug group-hover:text-white">{alert.message}</p>
                             <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {alert.time}
                             </p>
                          </div>
                          
                          {/* Hover Actions */}
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-zinc-800 rounded p-0.5 border border-white/10">
                             <button className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white" title="View">
                                <Eye className="h-3 w-3" />
                             </button>
                             <button className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-red-400" title="Dismiss">
                                <X className="h-3 w-3" />
                             </button>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </GlassPanel>
        </div>

      </div>

      {/* 5. RECENT ACTIVITY TABLE */}
      <GlassPanel className="p-6">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Invoices</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search by invoice or vendor..." 
                    className="pl-9 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:ring-1 focus:ring-primary outline-none w-full sm:w-64"
                  />
               </div>
               
               <div className="flex gap-2">
                  <button className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-400 hover:text-white flex items-center gap-2">
                     <Filter className="h-3.5 w-3.5" /> Filter
                  </button>
                  <button className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" onClick={() => router.push('/dashboard/sme/invoices/purchase')}>
                     View All
                  </button>
               </div>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead>
                  <tr className="border-b border-white/5 text-zinc-500 font-medium">
                     <th className="px-4 py-3 font-medium">Invoice No</th>
                     <th className="px-4 py-3 font-medium">Date</th>
                     <th className="px-4 py-3 font-medium">Type</th>
                     <th className="px-4 py-3 font-medium">Vendor/Customer</th>
                     <th className="px-4 py-3 font-medium text-right">Amount</th>
                     <th className="px-4 py-3 font-medium text-right">GST</th>
                     <th className="px-4 py-3 font-medium text-center">Status</th>
                     <th className="px-4 py-3 font-medium text-center">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {RecentInvoicesData.map((inv) => (
                     <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-3 font-medium text-white">{inv.id}</td>
                        <td className="px-4 py-3 text-zinc-400">{inv.date}</td>
                        <td className="px-4 py-3">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${inv.type === 'Purchase' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                              {inv.type}
                           </span>
                        </td>
                        <td className="px-4 py-3">
                           <div className="flex flex-col">
                              <span className="text-zinc-200">{inv.party}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">{inv.gstin}</span>
                           </div>
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-300">₹{inv.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-zinc-300">₹{inv.gst.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(inv.status)}`}>
                              {inv.status}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-center relative">
                           <button className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                              <MoreVertical className="h-4 w-4" />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         {/* Pagination / Footer of table */}
         <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 px-2">
            <span>Showing 5 of 1,247 invoices</span>
            <div className="flex gap-2">
               <button className="px-2 py-1 rounded hover:bg-white/5 disabled:opacity-50" disabled>Previous</button>
               <button className="px-2 py-1 rounded hover:bg-white/5 text-white">Next</button>
            </div>
         </div>
      </GlassPanel>

    </div>
  );
}
