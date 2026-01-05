'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Settings, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Calendar,
  FileText,
  Database,
  Loader2,
  MoreVertical,
  X,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';


// Mock History Data
const runHistory = [
  { id: 1, date: '23 Nov 2025, 4:00 PM', period: 'Nov 2025', processed: 823, matchRate: 92, discrepancies: 67, duration: '2m 34s', status: 'Completed' },
  { id: 2, date: '22 Nov 2025, 10:00 AM', period: 'Nov 2025', processed: 810, matchRate: 88, discrepancies: 95, duration: '2m 10s', status: 'Completed' },
  { id: 3, date: '15 Nov 2025, 6:30 PM', period: 'Oct 2025', processed: 1250, matchRate: 95, discrepancies: 62, duration: '3m 45s', status: 'Completed' },
  { id: 4, date: '15 Nov 2025, 6:00 PM', period: 'Oct 2025', processed: 0, matchRate: 0, discrepancies: 0, duration: '0m 10s', status: 'Failed' },
];

type RunState = 'idle' | 'running' | 'completed';

export default function RunReconciliationPage() {
  const router = useRouter();
  const [runState, setRunState] = useState<RunState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Fetching purchase invoices', completed: false },
    { label: 'Matching with GSTR-2B', completed: false },
    { label: 'Identifying discrepancies', completed: false },
    { label: 'Generating report', completed: false },
  ];

  // Simulate Reconciliation Process
  const startReconciliation = () => {
    setRunState('running');
    setProgress(0);
    setCurrentStep(0);
  };

  useEffect(() => {
    if (runState === 'running') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setRunState('completed');
            return 100;
          }
          // Update steps based on progress
          if (prev > 20) setCurrentStep(1);
          if (prev > 60) setCurrentStep(2);
          if (prev > 90) setCurrentStep(3);
          
          return prev + 1;
        });
      }, 50); // Speed of simulation
      return () => clearInterval(interval);
    }
  }, [runState]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'Cancelled': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-3">
            <RefreshCw className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
            <span className="text-emerald-700 font-bold text-sm uppercase tracking-wide">Run Reconciliation</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reconciliation Engine</h1>
          <p className="text-gray-600 text-sm mt-1">Match your invoices with GSTR-2B and identify discrepancies</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all flex items-center gap-2 shadow-sm">
             <Clock className="h-4 w-4" /> Schedule Automatic Run
           </button>
           <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all flex items-center gap-2 shadow-sm">
             <Settings className="h-4 w-4" /> View Settings
           </button>
        </div>
      </div>

      {/* 2. RECONCILIATION STATUS CARD (CENTERPIECE) */}
      <div className="w-full">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[400px]">
           {/* Background Decoration */}
           <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/30 to-transparent pointer-events-none"></div>
           
           {/* STATE: IDLE */}
           {runState === 'idle' && (
             <div className="space-y-8 relative z-10 w-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center gap-4">
                   <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center border-2 border-emerald-200 shadow-lg">
                      <RefreshCw className="h-10 w-10 text-emerald-600" strokeWidth={2.5} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-bold text-gray-900">Ready to Reconcile</h2>
                      <div className="flex items-center justify-center gap-2 mt-2 text-gray-600 text-sm">
                         <Clock className="h-3 w-3" /> Last run: 2 hours ago (23 Nov, 4:00 PM)
                      </div>
                      <div className="mt-1 text-sm">
                         <span className="text-gray-500">Result: </span>
                         <span className="text-emerald-600 font-bold">92% Matched</span>
                         <span className="text-gray-400 mx-2">•</span>
                         <span className="text-red-600 font-bold cursor-pointer hover:underline" onClick={() => router.push('/dashboard/sme/reconciliation/discrepancies')}>67 Discrepancies</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full">
                   <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Purchase Invoices</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">823</p>
                   </div>
                   <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">GSTR-2B Entries</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">856</p>
                   </div>
                   <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 shadow-sm">
                      <p className="text-xs text-emerald-600 uppercase tracking-wider font-bold">Last Matched</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">789</p>
                   </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                   <button 
                     onClick={startReconciliation}
                     className="btn-primary-custom px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                   >
                     <Play className="h-5 w-5 fill-current" /> Run Reconciliation Now
                   </button>
                   <p className="text-xs text-gray-500">Estimated time: 2-3 minutes for 823 invoices</p>
                </div>
             </div>
           )}

           {/* STATE: RUNNING */}
           {runState === 'running' && (
             <div className="space-y-8 relative z-10 w-full max-w-xl mx-auto animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-4">
                   <div className="h-20 w-20 relative">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className="text-emerald-600 transition-all duration-300 ease-out" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-gray-900">{progress}%</div>
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-gray-900 animate-pulse">Reconciliation in Progress...</h2>
                      <p className="text-gray-600 mt-1">Step {currentStep + 1} of 4: {steps[currentStep].label}</p>
                   </div>
                </div>

                {/* Timeline Visual */}
                <div className="w-full space-y-3">
                   {steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-4 transition-all duration-300">
                         <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 border ${idx < currentStep ? 'bg-emerald-500 border-emerald-500' : idx === currentStep ? 'border-emerald-600 bg-emerald-50' : 'border-gray-300 bg-gray-50'}`}>
                            {idx < currentStep ? <CheckCircle2 className="h-4 w-4 text-white" /> : idx === currentStep ? <Loader2 className="h-3 w-3 text-emerald-600 animate-spin" /> : <div className="h-2 w-2 rounded-full bg-gray-300"></div>}
                         </div>
                         <div className={`text-sm ${idx <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            {step.label}
                         </div>
                      </div>
                   ))}
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-600">
                   <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded p-2">Processed: <span className="text-gray-900 font-mono">{Math.floor((progress / 100) * 823)}</span></div>
                   <div className="bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 rounded p-2">Matches: <span className="text-emerald-600 font-mono">{Math.floor((progress / 100) * 780)}</span></div>
                   <div className="bg-gradient-to-r from-red-50 to-white border border-red-200 rounded p-2">Issues: <span className="text-red-600 font-mono">{Math.floor((progress / 100) * 43)}</span></div>
                </div>

                <button 
                  onClick={() => setRunState('idle')}
                  className="px-6 py-2 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50 transition-colors shadow-sm"
                >
                   Cancel Reconciliation
                </button>
             </div>
           )}

           {/* STATE: COMPLETED */}
           {runState === 'completed' && (
             <div className="space-y-8 relative z-10 w-full max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center gap-4">
                   <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                      <CheckCircle2 className="h-10 w-10 text-white" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-bold text-gray-900">Reconciliation Complete!</h2>
                      <p className="text-gray-600 mt-1">Completed at 6:35 PM (took 2m 34s)</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
                   <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 shadow-lg md:col-span-2">
                      <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">Matched Invoices</p>
                      <p className="text-4xl font-bold text-emerald-600 mt-2">789 <span className="text-lg font-normal opacity-70">92%</span></p>
                      <button onClick={() => router.push('/dashboard/sme/reconciliation/matched')} className="mt-4 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1">
                         View Matched <ArrowRight className="h-3 w-3" />
                      </button>
                   </div>
                   <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-200 shadow-lg md:col-span-3">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-xs text-red-600 uppercase tracking-wider font-semibold">Total Discrepancies</p>
                            <p className="text-4xl font-bold text-red-600 mt-2">67 <span className="text-lg font-normal opacity-70">8%</span></p>
                         </div>
                         <button onClick={() => router.push('/dashboard/sme/reconciliation/discrepancies')} className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all shadow-md">
                            Resolve Issues
                         </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-red-200">
                         <div>
                            <p className="text-[10px] text-red-600">Missing in Books</p>
                            <p className="text-lg font-bold text-gray-900">34</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-red-600">Missing in GSTR-2B</p>
                            <p className="text-lg font-bold text-gray-900">23</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-red-600">Value Mismatches</p>
                            <p className="text-lg font-bold text-gray-900">10</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex justify-center gap-4">
                   <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium text-sm hover:shadow-lg transition-all shadow-md flex items-center gap-2">
                      <Download className="h-4 w-4" /> Download Report
                   </button>
                   <button onClick={() => setRunState('idle')} className="px-6 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-colors shadow-sm">
                      Run Again
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* 3. CONFIGURATION SECTION */}
      <div>
         <h3 className="text-lg font-semibold text-gray-900 mb-4">Reconciliation Settings</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
               <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                     <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 space-y-3">
                     <h4 className="font-semibold text-gray-900">Period Selection</h4>
                     <select className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm">
                        <option>November 2025 (Current)</option>
                        <option>October 2025</option>
                        <option>September 2025</option>
                     </select>
                     <p className="text-xs text-gray-500">Range: 1 Nov 2025 - 30 Nov 2025</p>
                     <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> GSTR-2B Available
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
               <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                     <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 space-y-3">
                     <h4 className="font-semibold text-gray-900">Matching Rules</h4>
                     <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600">Match Logic</span>
                           <span className="text-gray-900 font-medium">Invoice # + GSTIN</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600">Tolerance</span>
                           <span className="text-gray-900 font-medium">₹ 10.00</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600">Fuzzy Match</span>
                           <span className="text-emerald-600 font-medium">Enabled</span>
                        </div>
                     </div>
                     <button className="text-xs text-emerald-600 hover:underline font-medium">Advanced Rules</button>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
               <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                     <Database className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 space-y-3">
                     <h4 className="font-semibold text-gray-900">Data Sources</h4>
                     <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                           <input type="checkbox" checked readOnly className="rounded bg-white border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                           Purchase Register (823)
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                           <input type="checkbox" checked readOnly className="rounded bg-white border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                           GSTR-2B (856)
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                           <input type="checkbox" className="rounded bg-white border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                           GSTR-2A (Optional)
                        </label>
                     </div>
                     <button className="text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors shadow-sm">Refresh Data</button>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 4. PREVIOUS RUNS HISTORY */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <h3 className="font-semibold text-gray-900">Reconciliation History</h3>
            <select className="bg-white border border-gray-200 text-xs rounded-lg p-1.5 text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm">
               <option>Last 10 Runs</option>
               <option>This Month</option>
               <option>All History</option>
            </select>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gradient-to-r from-gray-50 to-white text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                     <th className="px-6 py-3">Run Date & Time</th>
                     <th className="px-6 py-3">Period</th>
                     <th className="px-6 py-3">Invoices</th>
                     <th className="px-6 py-3">Match Rate</th>
                     <th className="px-6 py-3">Discrepancies</th>
                     <th className="px-6 py-3">Duration</th>
                     <th className="px-6 py-3">Status</th>
                     <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {runHistory.map((run) => (
                     <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{run.date}</td>
                        <td className="px-6 py-4 text-gray-600">{run.period}</td>
                        <td className="px-6 py-4 text-gray-700">{run.processed}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                 <div className={`h-full rounded-full ${run.matchRate > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${run.matchRate}%`}}></div>
                              </div>
                              <span className="text-xs text-gray-600 font-medium">{run.matchRate}%</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           {run.discrepancies > 0 ? (
                              <button onClick={() => router.push('/dashboard/sme/reconciliation/discrepancies')} className="text-red-600 hover:text-red-700 hover:underline font-medium">
                                 {run.discrepancies}
                              </button>
                           ) : (
                              <span className="text-gray-400">-</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{run.duration}</td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(run.status)}`}>
                              {run.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors">
                              <MoreVertical className="h-4 w-4" />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      </div>
    </div>
  );
}
