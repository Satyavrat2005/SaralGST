'use client';

import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertOctagon, 
  Clock, 
  Download, 
  RefreshCw, 
  Zap, 
  TrendingUp, 
  Users, 
  CheckSquare
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
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

// Mock Data
const vendorExceptionData = [
  { name: 'ABC Ent', gstr2b: 10, books: 6, value: 2, total: 18 },
  { name: 'XYZ Supp', gstr2b: 5, books: 5, value: 2, total: 12 },
  { name: 'LMN Trad', gstr2b: 2, books: 6, value: 1, total: 9 },
  { name: 'PQR Ind', gstr2b: 6, books: 0, value: 1, total: 7 },
  { name: 'Alpha Sys', gstr2b: 0, books: 5, value: 0, total: 5 },
];

const categoryData = [
  { name: 'Missing in Books', value: 34, color: '#F97316' }, // Orange
  { name: 'Missing in GSTR-2B', value: 23, color: '#EF4444' }, // Red
  { name: 'Value Mismatch', value: 10, color: '#EAB308' }, // Yellow
];

export default function ExceptionDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      
        {/* 1. PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-block bg-purple-50 border border-purple-200 rounded-full px-6 py-2 mb-4">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Exception Dashboard</h1>
            </div>
            <p className="text-gray-600 text-sm ml-1">Visual analysis of reconciliation discrepancies</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="bg-white border border-gray-300 text-sm rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm">
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last 3 Months</option>
            </select>
            <button className="p-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2 shadow-lg">
              <Download className="h-4 w-4" /> Download Analysis
            </button>
          </div>
        </div>

        {/* 2. KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Exceptions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Total Exceptions</p>
                <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                  <AlertOctagon className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">67</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-emerald-600 text-sm flex items-center font-medium">
                    <ArrowDownRight className="h-4 w-4 mr-1" /> 5% down
                  </span>
                  <span className="text-xs text-gray-500">8% of total invoices</span>
                </div>
              </div>
            </div>
          </div>

          {/* ITC at Risk */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">ITC at Risk</p>
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-red-200">
                  <AlertOctagon className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-red-600">₹ 3.68 L</h3>
                <p className="text-xs text-gray-500 mt-2">15% of eligible ITC</p>
              </div>
            </div>
          </div>

          {/* High Priority */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">High Priority</p>
                <div className="relative">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200">
                    <AlertOctagon className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse"></span>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">12</h3>
                <p className="text-xs text-gray-500 mt-2">Amount {'>'} ₹50k or {'>'} 30 days</p>
              </div>
            </div>
          </div>

          {/* Avg Resolution Time */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Avg Resolution</p>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">4.5 days</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-emerald-600 text-sm flex items-center font-medium">
                    <ArrowDownRight className="h-4 w-4 mr-1" /> 1.2 days
                  </span>
                  <span className="text-xs text-gray-500">Median time</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendor-wise Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Vendor-wise Breakdown</h3>
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorExceptionData} layout="vertical" margin={{ left: 20, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#9ca3af" tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{fill: '#111827', fontSize: 12}} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ fontSize: '12px', color: '#111827' }}
                    cursor={{fill: 'rgba(16, 185, 129, 0.05)'}}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="gstr2b" name="Missing GSTR-2B" stackId="a" fill="#EF4444" barSize={20} />
                  <Bar dataKey="books" name="Missing Books" stackId="a" fill="#F97316" barSize={20} />
                  <Bar dataKey="value" name="Value Mismatch" stackId="a" fill="#EAB308" barSize={20} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Breakdown</h3>
            <div className="w-full h-[320px] flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '8px', 
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }} 
                      itemStyle={{color: '#111827'}} 
                    />
                    <Legend 
                      verticalAlign="middle" 
                      align="right"
                      layout="vertical"
                      wrapperStyle={{ 
                        fontSize: '12px',
                        backgroundColor: '#ffffff',
                        padding: '8px',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-4 pl-4">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shadow-sm" style={{backgroundColor: item.color}}></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.value} invoices</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. AI INSIGHTS PANEL */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-emerald-100">
              <Zap className="h-5 w-5 text-purple-600 fill-current" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Automated Insights & Recommendations</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Insight 1: Priority */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 hover:border-red-300 transition-all hover:shadow-md flex items-start gap-4">
              <div className="p-2.5 rounded-full bg-white shadow-sm mt-1">
                <AlertOctagon className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900">Priority Action Needed</h4>
                <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
                  12 high-value invoices ({'>'}₹50K) have been pending {'>'}15 days. Focus on these first to secure <span className="text-red-700 font-semibold">₹1,85,600 ITC</span>.
                </p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm">
                View List
              </button>
            </div>

            {/* Insight 2: Trend */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 transition-all hover:shadow-md flex items-start gap-4">
              <div className="p-2.5 rounded-full bg-white shadow-sm mt-1">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900">Negative Trend Alert</h4>
                <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
                  Exceptions increased by 15% this month. Top contributor: <span className="text-blue-700 font-semibold">ABC Enterprises (18 issues)</span>.
                </p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                Analyze
              </button>
            </div>

            {/* Insight 3: Quick Win */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-300 transition-all hover:shadow-md flex items-start gap-4">
              <div className="p-2.5 rounded-full bg-white shadow-sm mt-1">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900">Quick Win Identified</h4>
                <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
                  6 invoices have rounding differences {'<'}₹10. Accept GSTR-2B values to instantly resolve these exceptions.
                </p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
                Auto-Resolve
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
