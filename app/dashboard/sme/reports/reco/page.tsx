'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Download, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  ZoomIn, 
  ZoomOut,
  Mail,
  Clock,
  FileBarChart,
  List,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type ReportType = 'summary' | 'detailed' | 'exception';

export default function ReconciliationReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('summary');
  const [previewPage, setPreviewPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Mock Data for Preview Charts
  const matchData = [
    { name: 'Matched', value: 92, color: '#10B981' },
    { name: 'Mismatch', value: 8, color: '#EF4444' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-2">
            <span className="text-emerald-700 text-xs font-semibold">REPORTS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reconciliation Reports</h1>
          <p className="text-gray-600 text-sm mt-1">Detailed reports on invoice matching, discrepancies, and ITC impact</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <select className="appearance-none bg-white border border-gray-200 text-sm rounded-lg pl-9 pr-8 py-2 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-700 cursor-pointer hover:bg-gray-50 shadow-sm">
               <option>November 2025</option>
               <option>October 2025</option>
               <option>Q3 FY 25-26</option>
             </select>
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
           </div>
           <select className="bg-white border border-gray-200 text-sm rounded-lg p-2 text-gray-700 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-gray-50 shadow-sm">
             <option>PDF Format</option>
             <option>Excel (.xlsx)</option>
             <option>CSV</option>
           </select>
           <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
             <FileText className="h-4 w-4" /> Generate Report
           </button>
        </div>
      </div>

      {/* 2. REPORT TYPE SELECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => { setSelectedReport('summary'); setPreviewPage(1); }}
          className={`
            cursor-pointer p-6 rounded-2xl border-2 transition-all relative overflow-hidden group
            ${selectedReport === 'summary' ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-gray-200 hover:border-gray-300'}
          `}
        >
           <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg ${selectedReport === 'summary' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                 <FileBarChart className="h-6 w-6" />
              </div>
              <div>
                 <h3 className={`font-bold ${selectedReport === 'summary' ? 'text-gray-900' : 'text-gray-700'}`}>Summary Report</h3>
                 <p className="text-xs text-gray-600">For Management Review</p>
              </div>
           </div>
           <ul className="space-y-2 text-xs text-gray-600 list-disc list-inside mb-4">
              <li>Executive Dashboard</li>
              <li>Match Rate Statistics</li>
              <li>Top 10 Discrepancies</li>
           </ul>
           {selectedReport === 'summary' && (
              <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
           )}
        </div>

        <div 
          onClick={() => { setSelectedReport('detailed'); setPreviewPage(1); }}
          className={`
            cursor-pointer p-6 rounded-2xl border-2 transition-all relative overflow-hidden group
            ${selectedReport === 'detailed' ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-gray-200 hover:border-gray-300'}
          `}
        >
           <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg ${selectedReport === 'detailed' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                 <List className="h-6 w-6" />
              </div>
              <div>
                 <h3 className={`font-bold ${selectedReport === 'detailed' ? 'text-gray-900' : 'text-gray-700'}`}>Detailed Report</h3>
                 <p className="text-xs text-gray-600">For Audit & Analysis</p>
              </div>
           </div>
           <ul className="space-y-2 text-xs text-gray-600 list-disc list-inside mb-4">
              <li>Line-by-line Matching</li>
              <li>Full Discrepancy List</li>
              <li>Vendor-wise Breakdown</li>
           </ul>
           {selectedReport === 'detailed' && (
              <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
           )}
        </div>

        <div 
          onClick={() => { setSelectedReport('exception'); setPreviewPage(1); }}
          className={`
            cursor-pointer p-6 rounded-2xl border-2 transition-all relative overflow-hidden group
            ${selectedReport === 'exception' ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-gray-200 hover:border-gray-300'}
          `}
        >
           <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg ${selectedReport === 'exception' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                 <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                 <h3 className={`font-bold ${selectedReport === 'exception' ? 'text-gray-900' : 'text-gray-700'}`}>Exception Report</h3>
                 <p className="text-xs text-gray-600">For Action Planning</p>
              </div>
           </div>
           <ul className="space-y-2 text-xs text-gray-600 list-disc list-inside mb-4">
              <li>Missing Invoices Only</li>
              <li>Value Mismatches</li>
              <li>Action Items</li>
           </ul>
           {selectedReport === 'exception' && (
              <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
           )}
        </div>
      </div>

      {/* 3. REPORT PREVIEW AREA */}
      <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
         {/* Preview Canvas */}
         <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
               <span className="text-xs text-gray-600">Preview: {selectedReport === 'summary' ? 'Summary Report' : selectedReport === 'detailed' ? 'Detailed Report' : 'Exception Report'} - Nov 2025.pdf</span>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                     <button onClick={() => setZoomLevel(z => Math.max(50, z - 10))} className="p-1 hover:text-gray-900 text-gray-600"><ZoomOut className="h-3 w-3" /></button>
                     <span className="text-xs w-8 text-center">{zoomLevel}%</span>
                     <button onClick={() => setZoomLevel(z => Math.min(150, z + 10))} className="p-1 hover:text-gray-900 text-gray-600"><ZoomIn className="h-3 w-3" /></button>
                  </div>
                  <div className="w-px h-4 bg-gray-200"></div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => setPreviewPage(p => Math.max(1, p - 1))} className="p-1 hover:text-gray-900 text-gray-600 disabled:opacity-50" disabled={previewPage === 1}><ChevronLeft className="h-4 w-4" /></button>
                     <span className="text-xs text-gray-700">Page {previewPage} of 5</span>
                     <button onClick={() => setPreviewPage(p => Math.min(5, p + 1))} className="p-1 hover:text-gray-900 text-gray-600 disabled:opacity-50" disabled={previewPage === 5}><ChevronRight className="h-4 w-4" /></button>
                  </div>
               </div>
            </div>

            {/* Document Page Simulation */}
            <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center items-start">
               <div 
                  className="bg-white text-black shadow-2xl transition-transform duration-200 origin-top" 
                  style={{ width: '595px', minHeight: '842px', transform: `scale(${zoomLevel/100})` }} // A4 ratio
               >
                  {/* Header */}
                  <div className="p-8 border-b-2 border-emerald-600 flex justify-between items-end">
                     <div>
                        <h1 className="text-2xl font-bold text-emerald-900">SaralGST</h1>
                        <p className="text-xs text-gray-500 mt-1">Automated Reconciliation Report</p>
                     </div>
                     <div className="text-right">
                        <h2 className="text-lg font-bold uppercase text-gray-800">
                           {selectedReport === 'summary' ? 'Executive Summary' : selectedReport === 'detailed' ? 'Detailed Audit' : 'Exception Analysis'}
                        </h2>
                        <p className="text-sm text-gray-600">Period: November 2025</p>
                     </div>
                  </div>

                  {/* Content Body (Varies by Report Type) */}
                  <div className="p-8 space-y-6">
                     {selectedReport === 'summary' && (
                        <>
                           {/* Metrics Grid */}
                           <div className="grid grid-cols-3 gap-4">
                              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                                 <p className="text-xs text-gray-500 uppercase">Match Rate</p>
                                 <p className="text-2xl font-bold text-emerald-600">92%</p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                                 <p className="text-xs text-gray-500 uppercase">ITC Available</p>
                                 <p className="text-2xl font-bold text-gray-800">₹8.22 L</p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                                 <p className="text-xs text-gray-500 uppercase">Discrepancies</p>
                                 <p className="text-2xl font-bold text-red-600">67</p>
                              </div>
                           </div>

                           {/* Chart Section */}
                           <div className="h-64 bg-gray-50 rounded border border-gray-200 p-4 flex items-center justify-center relative">
                              <p className="absolute top-2 left-4 text-sm font-bold text-gray-700">Reconciliation Status</p>
                              <div className="h-48 w-48">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                       <Pie
                                          data={matchData}
                                          innerRadius={40}
                                          outerRadius={60}
                                          paddingAngle={0}
                                          dataKey="value"
                                       >
                                          {matchData.map((entry, index) => (
                                             <Cell key={`cell-${index}`} fill={entry.color} />
                                          ))}
                                       </Pie>
                                    </PieChart>
                                 </ResponsiveContainer>
                              </div>
                              <div className="absolute right-10 top-10 space-y-2">
                                 <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-emerald-500"></div> Matched (92%)</div>
                                 <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-red-500"></div> Mismatch (8%)</div>
                              </div>
                           </div>

                           {/* Table Preview */}
                           <div>
                              <h3 className="text-sm font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1">Top Discrepancies</h3>
                              <table className="w-full text-xs text-left">
                                 <thead className="bg-gray-100 text-gray-600 font-bold">
                                    <tr>
                                       <th className="p-2">Invoice #</th>
                                       <th className="p-2">Vendor</th>
                                       <th className="p-2">Issue</th>
                                       <th className="p-2 text-right">Amount</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100 text-gray-700">
                                    <tr><td className="p-2">INV-001</td><td className="p-2">ABC Corp</td><td className="p-2 text-red-600">Missing in 2B</td><td className="p-2 text-right">₹12,000</td></tr>
                                    <tr><td className="p-2">INV-002</td><td className="p-2">XYZ Ltd</td><td className="p-2 text-amber-600">Value Mismatch</td><td className="p-2 text-right">₹4,500</td></tr>
                                    <tr><td className="p-2">INV-003</td><td className="p-2">Tech Sol</td><td className="p-2 text-red-600">GSTIN Invalid</td><td className="p-2 text-right">₹8,200</td></tr>
                                 </tbody>
                              </table>
                           </div>
                        </>
                     )}

                     {selectedReport === 'detailed' && (
                        <div className="text-center py-20">
                           <List className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                           <h3 className="text-lg font-bold text-gray-400">Detailed Data View</h3>
                           <p className="text-sm text-gray-400 mt-2">Contains {'>'}50 pages of line-item data.</p>
                           <div className="mt-8 text-left max-w-xs mx-auto space-y-2">
                              <div className="h-2 bg-gray-100 rounded w-full"></div>
                              <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                              <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                              <div className="h-2 bg-gray-100 rounded w-full"></div>
                           </div>
                        </div>
                     )}

                     {selectedReport === 'exception' && (
                        <>
                           <div className="p-4 bg-red-50 border border-red-100 rounded">
                              <h3 className="text-red-800 font-bold text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Critical Action Required</h3>
                              <p className="text-xs text-red-600 mt-1">3 high-value invoices are missing from GSTR-2B. Total ITC at risk: ₹1,85,000.</p>
                           </div>
                           <div>
                              <h3 className="text-sm font-bold text-gray-800 mb-2">Missing Invoices List</h3>
                              <table className="w-full text-xs text-left border border-gray-200">
                                 <thead className="bg-gray-100 text-gray-600 font-bold">
                                    <tr>
                                       <th className="p-2 border-b">Vendor</th>
                                       <th className="p-2 border-b">Inv Date</th>
                                       <th className="p-2 border-b text-right">Tax Value</th>
                                       <th className="p-2 border-b text-center">Days Pending</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100 text-gray-700">
                                    <tr><td className="p-2">Global Logistics</td><td className="p-2">01 Nov</td><td className="p-2 text-right font-bold">₹45,000</td><td className="p-2 text-center text-red-600 font-bold">23</td></tr>
                                    <tr><td className="p-2">Alpha Systems</td><td className="p-2">05 Nov</td><td className="p-2 text-right font-bold">₹28,000</td><td className="p-2 text-center text-red-600 font-bold">19</td></tr>
                                 </tbody>
                              </table>
                           </div>
                        </>
                     )}
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-center border-t border-gray-100">
                     <p className="text-[10px] text-gray-400">Generated by SaralGST • Page {previewPage} of 5</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Right: Actions */}
         <div className="w-full lg:w-80 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
               <h4 className="text-sm font-semibold text-gray-900 mb-3">Customize</h4>
               <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                     <input type="checkbox" checked readOnly className="rounded border-gray-300 text-emerald-600" />
                     Include Executive Summary
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                     <input type="checkbox" checked readOnly className="rounded border-gray-300 text-emerald-600" />
                     Include Charts & Graphs
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                     <input type="checkbox" className="rounded border-gray-300 text-emerald-600" />
                     Detailed Annexures
                  </label>
                  <button className="w-full mt-2 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                     <Settings className="h-3 w-3" /> Advanced Options
                  </button>
               </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
               <h4 className="text-sm font-semibold text-gray-900 mb-3">Schedule & Share</h4>
               <div className="space-y-3">
                  <button className="w-full py-2 rounded-lg bg-gray-100 text-gray-900 text-sm hover:bg-gray-200 flex items-center justify-center gap-2">
                     <Clock className="h-4 w-4" /> Schedule Monthly
                  </button>
                  <button className="w-full py-2 rounded-lg bg-gray-100 text-gray-900 text-sm hover:bg-gray-200 flex items-center justify-center gap-2">
                     <Mail className="h-4 w-4" /> Email to Team
                  </button>
               </div>
            </div>

            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center shadow-lg">
               <p className="text-xs text-emerald-700 font-medium mb-2">Ready to Download</p>
               <button className="w-full py-3 rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all">
                  <Download className="h-4 w-4" /> Download PDF
               </button>
            </div>
         </div>
      </div>

      </div>
    </div>
  );
}
