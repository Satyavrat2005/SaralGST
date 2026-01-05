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
  AreaChart,
  Area,
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
      case 'Matched': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Failed': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-8 pb-10">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500 text-white rounded-lg px-3 py-1 mb-3 text-xs font-semibold">
            <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>
            LIVE
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select 
               value={dateRange}
               onChange={(e) => setDateRange(e.target.value)}
               className="appearance-none bg-white border border-gray-200 text-sm rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer hover:bg-gray-50 transition-colors text-gray-900 font-medium shadow-sm"
             >
               <option>This Month</option>
               <option>Last Month</option>
               <option>This Quarter</option>
               <option>Custom Range</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
           </div>
           
           <button 
             onClick={handleRefresh}
             className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm"
             title="Refresh Data"
           >
             <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
           </button>
           
           <span className="text-xs text-gray-500 whitespace-nowrap hidden md:inline-block">
             Last updated: <span className="text-gray-900 font-medium">2 mins ago</span>
           </span>
        </div>
      </div>

      {/* 2. KEY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Invoices - Blue Gradient */}
        <div 
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden relative"
          onClick={() => router.push('/dashboard/sme/invoices/purchase')}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
          </div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-blue-100 text-xs font-medium mb-1">TOTAL INVOICES</p>
                <h3 className="text-3xl font-bold text-white mb-2">1,247</h3>
              </div>
              <FileText className="h-6 w-6 text-white opacity-90" />
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/90">Purchase</span>
                <span className="text-sm font-bold text-white">823</span>
              </div>
              <div className="h-1 bg-white/30 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-white rounded-full" style={{width: '66%'}}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/90">Sales</span>
                <span className="text-sm font-bold text-white">424</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-100">This Month</span>
              <span className="flex items-center gap-1 text-white font-semibold">
                <ArrowUpRight className="h-3 w-3" /> 12%
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: ITC Available - Emerald Gradient */}
        <div 
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden relative"
          onClick={() => router.push('/dashboard/sme/itc')}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
          </div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-emerald-100 text-xs font-medium mb-1">ITC AVAILABLE</p>
                <h3 className="text-3xl font-bold text-white mb-2">₹2.45L</h3>
              </div>
              <TrendingUp className="h-6 w-6 text-white opacity-90" />
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/90">Claimed</span>
                <span className="text-sm font-bold text-white">₹1.80L</span>
              </div>
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{width: '73%'}}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-100">Pending: ₹0.65L</span>
              <span className="flex items-center gap-1 text-white font-semibold">
                <ArrowUpRight className="h-3 w-3" /> 5%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Tax Payable - Amber Gradient */}
        <div 
          className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden relative"
          onClick={() => router.push('/dashboard/sme/returns/gstr3b')}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
          </div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-amber-100 text-xs font-medium mb-1">TAX PAYABLE</p>
                <h3 className="text-3xl font-bold text-white mb-2">₹1.12L</h3>
              </div>
              <AlertCircle className="h-6 w-6 text-white opacity-90" />
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/90">Output Tax</span>
                <span className="text-sm font-bold text-white">₹2.92L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/90">Input Credit</span>
                <span className="text-sm font-bold text-white">-₹1.80L</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-100 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Due: 20th Nov
              </span>
              <span className="text-white font-semibold">14 days</span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Actions - Rose/Red Gradient */}
        <div 
          className="bg-gradient-to-br from-rose-500 to-red-500 rounded-2xl shadow-lg p-5 cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden relative"
          onClick={() => router.push('/dashboard/sme/alerts')}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
          </div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-rose-100 text-xs font-medium mb-1">PENDING ACTIONS</p>
                <h3 className="text-3xl font-bold text-white mb-2">23</h3>
              </div>
              <div className="relative">
                <AlertTriangle className="h-6 w-6 text-white opacity-90" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/90">Failed Validations</span>
                <span className="text-sm font-bold text-white">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/90">IMS Decisions</span>
                <span className="text-sm font-bold text-white">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/90">Reminders</span>
                <span className="text-sm font-bold text-white">3</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-100">Requires Attention</span>
              <span className="text-white font-semibold">View All</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STATUS PROGRESS BARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* GSTR-1 Status */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/dashboard/sme/returns/gstr1')}>
           <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">GSTR-1 Filing</h4>
                <p className="text-xs text-emerald-600 mt-1">85% Complete</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/sme/returns/gstr1'); }}
                className="text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
              >
                View
              </button>
           </div>
           
           <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[85%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-gray-400">Last Filed: 11th Nov 2025</p>
           </div>
        </div>

        {/* GSTR-3B Status */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/dashboard/sme/returns/gstr3b')}>
           <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">GSTR-3B Filing</h4>
                <p className="text-xs text-amber-600 mt-1">Ready to File</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/sme/returns/gstr3b'); }}
                className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded transition-colors"
              >
                File
              </button>
           </div>
           
           <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[100%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-amber-600 font-medium">Due: 20th Nov</p>
           </div>
        </div>

        {/* Reconciliation Status */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/dashboard/sme/reconciliation/run')}>
           <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Reconciliation</h4>
                <p className="text-xs text-gray-500 mt-1">92% Matched • 67 Issues</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/sme/reconciliation/run'); }}
                className="text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
              >
                Run
              </button>
           </div>
           
           <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 w-[92%]"></div>
                <div className="h-full bg-red-500 w-[8%]"></div>
              </div>
              <p className="text-[10px] text-gray-400">Last Run: 2 hours ago</p>
           </div>
        </div>

      </div>

      {/* 4. MAIN CONTENT AREA (Charts + Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px]">
        
        {/* LEFT SECTION (Charts) */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          
          {/* Chart 1: ITC Trend */}
          <div className="flex-1 p-5 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" /> ITC Trend Analysis
              </h3>
              <div className="flex gap-2">
                 <span className="flex items-center text-[10px] text-gray-600"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>Available</span>
                 <span className="flex items-center text-[10px] text-gray-600"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></div>Claimed</span>
                 <span className="flex items-center text-[10px] text-gray-600"><div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>Lost</span>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ITCTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClaimed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#6b7280" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', color: '#374151' }}
                    labelStyle={{ color: '#111827', marginBottom: '8px', fontWeight: 'bold' }}
                    formatter={(value: number) => [`₹ ${value.toLocaleString()}`, '']}
                  />
                  <Area type="monotone" dataKey="available" stroke="#3b82f6" strokeWidth={2} fill="url(#colorAvailable)" dot={{r:3, fill:'#3b82f6'}} activeDot={{r:6, strokeWidth:0}} name="Available" />
                  <Area type="monotone" dataKey="claimed" stroke="#10B981" strokeWidth={2} fill="url(#colorClaimed)" dot={{r:3, fill:'#10B981'}} activeDot={{r:6, strokeWidth:0}} name="Claimed" />
                  <Area type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} fill="url(#colorLost)" dot={{r:3, fill:'#ef4444'}} activeDot={{r:6, strokeWidth:0}} name="Lost" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Vendor Compliance - Modified to fit height */}
          <div className="h-48 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-4 flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-lg">
                <div>
                   <h4 className="text-sm font-bold text-gray-900 mb-4">Vendor Compliance</h4>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Compliant (45)</div>
                      <div className="flex items-center gap-2 text-xs text-gray-600"><div className="w-2 h-2 rounded-full bg-amber-500"></div> At Risk (12)</div>
                      <div className="flex items-center gap-2 text-xs text-gray-600"><div className="w-2 h-2 rounded-full bg-red-500"></div> Non-Compliant (3)</div>
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
                         <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{color: '#374151'}} />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-gray-900">60</span>
                   </div>
                </div>
             </div>
             
             {/* Quick Stats or Promo */}
             <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex flex-col justify-center">
                 <h4 className="text-sm font-bold text-gray-900 mb-3">Reconciliation Efficiency</h4>
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                       <CheckSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-gray-900">98.5%</h3>
                       <p className="text-xs text-gray-600">Accuracy Rate</p>
                    </div>
                 </div>
                 <div className="mt-4 text-xs text-gray-600 leading-relaxed">
                   Your AI-driven reconciliation has saved approximately <span className="text-emerald-600 font-bold">14 hours</span> of manual work this month.
                 </div>
             </div>
          </div>
        </div>

        {/* RIGHT SECTION (Sticky Alerts Panel) */}
        <div className="lg:col-span-1 h-full relative">
           <div className="h-full max-h-[500px] flex flex-col sticky top-6 overflow-hidden bg-white rounded-2xl border border-amber-200 shadow-lg">
              <div className="p-4 border-b border-amber-200 flex items-center justify-between shrink-0 bg-gradient-to-r from-amber-50 to-white">
                 <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">Critical Alerts</h3>
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-red-50 text-[10px] font-bold text-red-700 border border-red-200">5</span>
                 </div>
                 <button onClick={() => router.push('/dashboard/sme/alerts')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">View All</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                 {AlertsData.map((alert) => (
                    <div key={alert.id} className="group p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer relative">
                       <div className="flex gap-3">
                          <div className="mt-0.5 shrink-0">
                             {alert.type === 'critical' && <AlertOctagon className="h-4 w-4 text-red-500" />}
                             {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                             {alert.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                          </div>
                          <div className="flex-1">
                             <p className="text-sm text-gray-900 leading-snug">{alert.message}</p>
                             <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {alert.time}
                             </p>
                          </div>
                          
                          {/* Hover Actions */}
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white rounded p-0.5 border border-gray-200 shadow-sm">
                             <button className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900" title="View">
                                <Eye className="h-3 w-3" />
                             </button>
                             <button className="p-1 hover:bg-red-50 rounded text-gray-600 hover:text-red-600" title="Dismiss">
                                <X className="h-3 w-3" />
                             </button>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>

      {/* 5. RECENT ACTIVITY TABLE */}
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Invoices</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by invoice or vendor..." 
                    className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full sm:w-64 hover:border-gray-300 transition-colors"
                  />
               </div>
               
               <div className="flex gap-2">
                  <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 flex items-center gap-2 transition-colors">
                     <Filter className="h-3.5 w-3.5" /> Filter
                  </button>
                  <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-colors" onClick={() => router.push('/dashboard/sme/invoices/purchase')}>
                     View All
                  </button>
               </div>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                     <th className="px-4 py-3 font-bold text-gray-600">Invoice No</th>
                     <th className="px-4 py-3 font-bold text-gray-600">Date</th>
                     <th className="px-4 py-3 font-bold text-gray-600">Type</th>
                     <th className="px-4 py-3 font-bold text-gray-600">Vendor/Customer</th>
                     <th className="px-4 py-3 font-bold text-gray-600 text-right">Amount</th>
                     <th className="px-4 py-3 font-bold text-gray-600 text-right">GST</th>
                     <th className="px-4 py-3 font-bold text-gray-600 text-center">Status</th>
                     <th className="px-4 py-3 font-bold text-gray-600 text-center">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                  {RecentInvoicesData.map((inv) => (
                     <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3 font-bold text-gray-900">{inv.id}</td>
                        <td className="px-4 py-3 text-gray-600">{inv.date}</td>
                        <td className="px-4 py-3">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${inv.type === 'Purchase' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                              {inv.type}
                           </span>
                        </td>
                        <td className="px-4 py-3">
                           <div className="flex flex-col">
                              <span className="text-gray-900">{inv.party}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{inv.gstin}</span>
                           </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">₹{inv.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-900">₹{inv.gst.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(inv.status)}`}>
                              {inv.status}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-center relative">
                           <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                              <MoreVertical className="h-4 w-4" />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         {/* Pagination / Footer of table */}
         <div className="mt-4 flex items-center justify-between text-xs text-gray-600 px-2">
            <span>Showing 5 of 1,247 invoices</span>
            <div className="flex gap-2">
               <button className="px-2 py-1 rounded bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600" disabled>Previous</button>
               <button className="px-2 py-1 rounded bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-medium">Next</button>
            </div>
         </div>
      </div>

    </div>
    </div>
  );
}
