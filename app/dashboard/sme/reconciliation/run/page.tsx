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
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

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
      case 'Completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Cancelled': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Run Reconciliation</h1>
          <p className="text-muted-foreground text-sm mt-1">Match your invoices with GSTR-2B and identify discrepancies</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Clock className="h-4 w-4" /> Schedule Automatic Run
           </button>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Settings className="h-4 w-4" /> View Settings
           </button>
        </div>
      </div>

      {/* 2. RECONCILIATION STATUS CARD (CENTERPIECE) */}
      <div className="w-full">
        <GlassPanel className="p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[400px]">
           {/* Background Decoration */}
           <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
           
           {/* STATE: IDLE */}
           {runState === 'idle' && (
             <div className="space-y-8 relative z-10 w-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center gap-4">
                   <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <RefreshCw className="h-10 w-10 text-primary" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-bold text-white">Ready to Reconcile</h2>
                      <div className="flex items-center justify-center gap-2 mt-2 text-zinc-400 text-sm">
                         <Clock className="h-3 w-3" /> Last run: 2 hours ago (23 Nov, 4:00 PM)
                      </div>
                      <div className="mt-1 text-sm">
                         <span className="text-zinc-500">Result: </span>
                         <span className="text-emerald-500 font-medium">92% Matched</span>
                         <span className="text-zinc-600 mx-2">•</span>
                         <span className="text-red-400 font-medium cursor-pointer hover:underline" onClick={() => router.push('/dashboard/sme/reconciliation/discrepancies')}>67 Discrepancies</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full">
                   <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Purchase Invoices</p>
                      <p className="text-2xl font-bold text-white mt-1">823</p>
                   </div>
                   <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">GSTR-2B Entries</p>
                      <p className="text-2xl font-bold text-white mt-1">856</p>
                   </div>
                   <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Last Matched</p>
                      <p className="text-2xl font-bold text-emerald-500 mt-1">789</p>
                   </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                   <button 
                     onClick={startReconciliation}
                     className="px-8 py-4 rounded-full bg-gradient-to-r from-emerald-600 to-primary text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                   >
                     <Play className="h-5 w-5 fill-current" /> Run Reconciliation Now
                   </button>
                   <p className="text-xs text-zinc-500">Estimated time: 2-3 minutes for 823 invoices</p>
                </div>
             </div>
           )}

           {/* STATE: RUNNING */}
           {runState === 'running' && (
             <div className="space-y-8 relative z-10 w-full max-w-xl mx-auto animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-4">
                   <div className="h-20 w-20 relative">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-zinc-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className="text-primary transition-all duration-300 ease-out" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-white">{progress}%</div>
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-white animate-pulse">Reconciliation in Progress...</h2>
                      <p className="text-zinc-400 mt-1">Step {currentStep + 1} of 4: {steps[currentStep].label}</p>
                   </div>
                </div>

                {/* Timeline Visual */}
                <div className="w-full space-y-3">
                   {steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-4 transition-all duration-300">
                         <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 border ${idx < currentStep ? 'bg-emerald-500 border-emerald-500' : idx === currentStep ? 'border-primary' : 'border-zinc-700 bg-zinc-900'}`}>
                            {idx < currentStep ? <CheckCircle2 className="h-4 w-4 text-white" /> : idx === currentStep ? <Loader2 className="h-3 w-3 text-primary animate-spin" /> : <div className="h-2 w-2 rounded-full bg-zinc-700"></div>}
                         </div>
                         <div className={`text-sm ${idx <= currentStep ? 'text-white font-medium' : 'text-zinc-500'}`}>
                            {step.label}
                         </div>
                      </div>
                   ))}
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-zinc-400">
                   <div className="bg-white/5 rounded p-2">Processed: <span className="text-white font-mono">{Math.floor((progress / 100) * 823)}</span></div>
                   <div className="bg-white/5 rounded p-2">Matches: <span className="text-white font-mono">{Math.floor((progress / 100) * 780)}</span></div>
                   <div className="bg-white/5 rounded p-2">Issues: <span className="text-white font-mono">{Math.floor((progress / 100) * 43)}</span></div>
                </div>

                <button 
                  onClick={() => setRunState('idle')}
                  className="px-6 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                >
                   Cancel Reconciliation
                </button>
             </div>
           )}

           {/* STATE: COMPLETED */}
           {runState === 'completed' && (
             <div className="space-y-8 relative z-10 w-full max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center gap-4">
                   <div className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                      <CheckCircle2 className="h-10 w-10 text-white" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-bold text-white">Reconciliation Complete!</h2>
                      <p className="text-zinc-400 mt-1">Completed at 6:35 PM (took 2m 34s)</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
                   <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 md:col-span-2">
                      <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">Matched Invoices</p>
                      <p className="text-4xl font-bold text-emerald-500 mt-2">789 <span className="text-lg font-normal opacity-70">92%</span></p>
                      <button onClick={() => router.push('/dashboard/sme/reconciliation/matched')} className="mt-4 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1">
                         View Matched <ArrowRight className="h-3 w-3" />
                      </button>
                   </div>
                   <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 md:col-span-3">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-xs text-red-400 uppercase tracking-wider font-semibold">Total Discrepancies</p>
                            <p className="text-4xl font-bold text-red-500 mt-2">67 <span className="text-lg font-normal opacity-70">8%</span></p>
                         </div>
                         <button onClick={() => router.push('/dashboard/sme/reconciliation/discrepancies')} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                            Resolve Issues
                         </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-red-500/20">
                         <div>
                            <p className="text-[10px] text-red-300">Missing in Books</p>
                            <p className="text-lg font-bold text-white">34</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-red-300">Missing in GSTR-2B</p>
                            <p className="text-lg font-bold text-white">23</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-red-300">Value Mismatches</p>
                            <p className="text-lg font-bold text-white">10</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex justify-center gap-4">
                   <button className="px-6 py-3 rounded-lg bg-zinc-800 text-white font-medium text-sm hover:bg-zinc-700 transition-colors flex items-center gap-2">
                      <Download className="h-4 w-4" /> Download Report
                   </button>
                   <button onClick={() => setRunState('idle')} className="px-6 py-3 rounded-lg border border-white/10 text-zinc-300 text-sm hover:bg-white/5 transition-colors">
                      Run Again
                   </button>
                </div>
             </div>
           )}
        </GlassPanel>
      </div>

      {/* 3. CONFIGURATION SECTION */}
      <div>
         <h3 className="text-lg font-semibold text-white mb-4">Reconciliation Settings</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BentoCard>
               <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                     <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                     <h4 className="font-semibold text-white">Period Selection</h4>
                     <select className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-sm text-white focus:ring-1 focus:ring-primary outline-none">
                        <option>November 2025 (Current)</option>
                        <option>October 2025</option>
                        <option>September 2025</option>
                     </select>
                     <p className="text-xs text-zinc-500">Range: 1 Nov 2025 - 30 Nov 2025</p>
                     <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                        <CheckCircle2 className="h-3 w-3" /> GSTR-2B Available
                     </div>
                  </div>
               </div>
            </BentoCard>

            <BentoCard>
               <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                     <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                     <h4 className="font-semibold text-white">Matching Rules</h4>
                     <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-zinc-400">Match Logic</span>
                           <span className="text-white">Invoice # + GSTIN</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-zinc-400">Tolerance</span>
                           <span className="text-white">₹ 10.00</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-zinc-400">Fuzzy Match</span>
                           <span className="text-emerald-500">Enabled</span>
                        </div>
                     </div>
                     <button className="text-xs text-primary hover:underline">Advanced Rules</button>
                  </div>
               </div>
            </BentoCard>

            <BentoCard>
               <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                     <Database className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                     <h4 className="font-semibold text-white">Data Sources</h4>
                     <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                           <input type="checkbox" checked readOnly className="rounded bg-zinc-800 border-zinc-600 text-primary" />
                           Purchase Register (823)
                        </label>
                        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                           <input type="checkbox" checked readOnly className="rounded bg-zinc-800 border-zinc-600 text-primary" />
                           GSTR-2B (856)
                        </label>
                        <label className="flex items-center gap-2 text-sm text-zinc-500 cursor-pointer">
                           <input type="checkbox" className="rounded bg-zinc-800 border-zinc-600 text-primary" />
                           GSTR-2A (Optional)
                        </label>
                     </div>
                     <button className="text-xs font-medium text-white bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700">Refresh Data</button>
                  </div>
               </div>
            </BentoCard>
         </div>
      </div>

      {/* 4. PREVIOUS RUNS HISTORY */}
      <GlassPanel className="p-0 overflow-hidden">
         <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h3 className="font-semibold text-white">Reconciliation History</h3>
            <select className="bg-zinc-900 border border-white/10 text-xs rounded p-1.5 text-zinc-300 focus:ring-1 focus:ring-primary outline-none">
               <option>Last 10 Runs</option>
               <option>This Month</option>
               <option>All History</option>
            </select>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-white/5 text-zinc-500 font-medium">
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
               <tbody className="divide-y divide-white/5">
                  {runHistory.map((run) => (
                     <tr key={run.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{run.date}</td>
                        <td className="px-6 py-4 text-zinc-400">{run.period}</td>
                        <td className="px-6 py-4 text-zinc-300">{run.processed}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                 <div className={`h-full rounded-full ${run.matchRate > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${run.matchRate}%`}}></div>
                              </div>
                              <span className="text-xs text-zinc-400">{run.matchRate}%</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           {run.discrepancies > 0 ? (
                              <button onClick={() => router.push('/dashboard/sme/reconciliation/discrepancies')} className="text-red-400 hover:text-red-300 hover:underline font-medium">
                                 {run.discrepancies}
                              </button>
                           ) : (
                              <span className="text-zinc-500">-</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{run.duration}</td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(run.status)}`}>
                              {run.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </GlassPanel>

    </div>
  );
}
