'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Play, 
  Settings,
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Loader2,
  MessageSquare,
  FileText,
  Database,
  Send,
  Download,
  Zap,
  Shield,
  FileSpreadsheet,
  Bot,
  Bell,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Users,
  RefreshCw
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import BentoCard from '../../components/ui/BentoCard';
import { triggerN8nWorkflow } from './utils/n8nIntegration';

type RunState = 'idle' | 'running' | 'completed';

const workflowSteps = [
  { label: 'Capturing invoices from WhatsApp', completed: false },
  { label: 'Running AI OCR & validation', completed: false },
  { label: 'Sending WhatsApp notifications', completed: false },
  { label: 'Updating Purchase Register', completed: false },
  { label: 'Processing GSTR 2B upload', completed: false },
  { label: 'Running intelligent reconciliation', completed: false },
  { label: 'Analyzing discrepancies & ITC impact', completed: false },
  { label: 'Calculating vendor compliance scores', completed: false },
  { label: 'Generating reports & draft returns', completed: false },
];

export default function DemoWorkflowPage() {
  const router = useRouter();
  const [runState, setRunState] = useState<RunState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Start the workflow
  const startWorkflow = async () => {
    setRunState('running');
    setProgress(0);
    setCurrentStep(0);

    // Trigger n8n workflow
    try {
      await triggerN8nWorkflow({
        action: 'start',
        demo: true
      });
    } catch (error) {
      console.error('Failed to start workflow:', error);
    }
  };

  // Simulate workflow progress
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
          const newStep = Math.floor((prev / 100) * workflowSteps.length);
          setCurrentStep(newStep);
          
          return prev + 0.5; // Slower progression for demo
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [runState]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">GST Reconciliation Demo</h1>
            <p className="text-muted-foreground text-sm mt-1">End-to-end automated workflow with AI validation & WhatsApp alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
            <Settings className="h-4 w-4" /> Configure Workflow
          </button>
        </div>
      </div>

      {/* MAIN WORKFLOW STATUS CARD */}
      <div className="w-full">
        <GlassPanel className="p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[450px]">
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
          
          {/* STATE: IDLE */}
          {runState === 'idle' && (
            <div className="space-y-8 relative z-10 w-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center gap-4">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">AI-Powered GST Workflow Ready</h2>
                  <p className="text-zinc-400 mt-2 text-lg">Automated invoice processing, reconciliation & compliance</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 w-full">
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                  <div className="flex flex-col items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">WhatsApp</p>
                    <p className="text-xl font-bold text-white">3</p>
                    <p className="text-xs text-zinc-500">Invoices</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                  <div className="flex flex-col items-center gap-2">
                    <Database className="h-5 w-5 text-purple-500" />
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Purchase</p>
                    <p className="text-xl font-bold text-white">823</p>
                    <p className="text-xs text-zinc-500">Records</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">GSTR 2B</p>
                    <p className="text-xl font-bold text-white">856</p>
                    <p className="text-xs text-zinc-500">Entries</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-5 w-5 text-amber-500" />
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Vendors</p>
                    <p className="text-xl font-bold text-white">12</p>
                    <p className="text-xs text-zinc-500">Active</p>
                  </div>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-3 gap-4 text-left">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <Zap className="h-5 w-5 text-primary mb-2" />
                  <p className="text-xs font-semibold text-white">AI OCR</p>
                  <p className="text-xs text-zinc-500 mt-1">Automated data extraction</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <Send className="h-5 w-5 text-blue-500 mb-2" />
                  <p className="text-xs font-semibold text-white">Auto Alerts</p>
                  <p className="text-xs text-zinc-500 mt-1">WhatsApp notifications</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <Shield className="h-5 w-5 text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold text-white">Compliance</p>
                  <p className="text-xs text-zinc-500 mt-1">Vendor scoring</p>
                </div>
              </div>

              {/* Start Button */}
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={startWorkflow}
                  className="px-10 py-4 rounded-full bg-gradient-to-r from-emerald-600 to-primary text-white font-bold text-lg hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  <Play className="h-6 w-6 fill-current" /> Start Demo Workflow
                </button>
                <p className="text-xs text-zinc-500">Complete end-to-end automation • Estimated time: 3-4 minutes</p>
              </div>
            </div>
          )}

          {/* STATE: RUNNING */}
          {runState === 'running' && (
            <div className="space-y-8 relative z-10 w-full max-w-2xl mx-auto animate-in fade-in duration-300">
              <div className="flex flex-col items-center gap-4">
                <div className="h-24 w-24 relative">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-zinc-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-primary transition-all duration-300 ease-out" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-white">{Math.floor(progress)}%</div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white animate-pulse">Processing Workflow...</h2>
                  <p className="text-zinc-400 mt-2">Step {currentStep + 1} of {workflowSteps.length}: {workflowSteps[currentStep]?.label}</p>
                </div>
              </div>

              {/* Workflow Steps Timeline */}
              <div className="w-full space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {workflowSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4 transition-all duration-300 p-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 border ${
                      idx < currentStep ? 'bg-emerald-500 border-emerald-500' : 
                      idx === currentStep ? 'border-primary' : 
                      'border-zinc-700 bg-zinc-900'
                    }`}>
                      {idx < currentStep ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : idx === currentStep ? (
                        <Loader2 className="h-3 w-3 text-primary animate-spin" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-zinc-700"></div>
                      )}
                    </div>
                    <div className={`text-sm ${idx <= currentStep ? 'text-white font-medium' : 'text-zinc-500'}`}>
                      {step.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Progress Stats */}
              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-zinc-400 mb-1">Processed</p>
                  <p className="text-white font-bold text-lg">{Math.floor((progress / 100) * 823)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-zinc-400 mb-1">Validated</p>
                  <p className="text-emerald-500 font-bold text-lg">{Math.floor((progress / 100) * 789)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-zinc-400 mb-1">Matched</p>
                  <p className="text-blue-500 font-bold text-lg">{Math.floor((progress / 100) * 756)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-zinc-400 mb-1">Issues</p>
                  <p className="text-red-500 font-bold text-lg">{Math.floor((progress / 100) * 67)}</p>
                </div>
              </div>

              <button 
                onClick={() => setRunState('idle')}
                className="px-6 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
              >
                Cancel Workflow
              </button>
            </div>
          )}

          {/* STATE: COMPLETED */}
          {runState === 'completed' && (
            <div className="space-y-8 relative z-10 w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center gap-4">
                <div className="h-24 w-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-white">Workflow Completed Successfully!</h2>
                  <p className="text-zinc-400 mt-2 text-lg">All steps executed • Processing time: 3m 42s</p>
                </div>
              </div>

              {/* Results Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {/* Left Column - Success Metrics */}
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold mb-2">Invoices Validated</p>
                        <p className="text-5xl font-bold text-emerald-500">789</p>
                        <p className="text-sm text-emerald-400/70 mt-1">96% Success Rate</p>
                      </div>
                      <CheckCircle2 className="h-12 w-12 text-emerald-500/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-500/20">
                      <div>
                        <p className="text-xs text-emerald-400/70">Matched</p>
                        <p className="text-xl font-bold text-white">756</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-400/70">ITC Available</p>
                        <p className="text-xl font-bold text-white">₹2.45L</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold mb-2">WhatsApp Alerts Sent</p>
                        <p className="text-4xl font-bold text-blue-500">12</p>
                        <p className="text-sm text-blue-400/70 mt-1">All delivered successfully</p>
                      </div>
                      <Send className="h-10 w-10 text-blue-500/50" />
                    </div>
                  </div>
                </div>

                {/* Right Column - Issues & Actions */}
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-red-400 uppercase tracking-wider font-semibold mb-2">Discrepancies Found</p>
                        <p className="text-5xl font-bold text-red-500">67</p>
                        <p className="text-sm text-red-400/70 mt-1">Requires attention</p>
                      </div>
                      <AlertTriangle className="h-12 w-12 text-red-500/50" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-red-500/20">
                      <div>
                        <p className="text-xs text-red-400/70">Critical</p>
                        <p className="text-xl font-bold text-white">23</p>
                      </div>
                      <div>
                        <p className="text-xs text-red-400/70">Medium</p>
                        <p className="text-xl font-bold text-white">34</p>
                      </div>
                      <div>
                        <p className="text-xs text-red-400/70">Low</p>
                        <p className="text-xl font-bold text-white">10</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-purple-400 uppercase tracking-wider font-semibold mb-2">Vendor Compliance</p>
                        <p className="text-4xl font-bold text-purple-500">87%</p>
                        <p className="text-sm text-purple-400/70 mt-1">Average score</p>
                      </div>
                      <Shield className="h-10 w-10 text-purple-500/50" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Reports Section */}
              <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Generated Reports & Returns
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-left group">
                    <Download className="h-5 w-5 text-zinc-400 group-hover:text-primary mb-2" />
                    <p className="text-sm font-semibold text-white">Reconciliation Report</p>
                    <p className="text-xs text-zinc-500 mt-1">PDF • 2.4 MB</p>
                  </button>
                  <button className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-left group">
                    <Download className="h-5 w-5 text-zinc-400 group-hover:text-primary mb-2" />
                    <p className="text-sm font-semibold text-white">Discrepancy Report</p>
                    <p className="text-xs text-zinc-500 mt-1">Excel • 850 KB</p>
                  </button>
                  <button className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-left group">
                    <Download className="h-5 w-5 text-zinc-400 group-hover:text-primary mb-2" />
                    <p className="text-sm font-semibold text-white">Draft GSTR 3B</p>
                    <p className="text-xs text-zinc-500 mt-1">JSON • 145 KB</p>
                  </button>
                  <button className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-left group">
                    <Download className="h-5 w-5 text-zinc-400 group-hover:text-primary mb-2" />
                    <p className="text-sm font-semibold text-white">Draft GSTR 9B</p>
                    <p className="text-xs text-zinc-500 mt-1">JSON • 230 KB</p>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setRunState('idle')} 
                  className="px-8 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> Run Demo Again
                </button>
                <button 
                  onClick={() => router.push('/auth')}
                  className="px-8 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </GlassPanel>
      </div>

      {/* WORKFLOW FEATURES SECTION */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Complete Automation Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <BentoCard>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">WhatsApp Integration</h4>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Receive invoices automatically
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Send validation alerts instantly
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Track delivery & responses
                  </li>
                </ul>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">AI-Powered Validation</h4>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    OCR data extraction
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    GSTIN format checking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Tax calculation verification
                  </li>
                </ul>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">Intelligent Reconciliation</h4>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Auto-match invoices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Identify discrepancies
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Calculate ITC impact
                  </li>
                </ul>
              </div>
            </div>
          </BentoCard>

        </div>
      </div>

      {/* WORKFLOW STATS */}
      <GlassPanel className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Demo Workflow Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-zinc-400 mb-2">Total Invoices</p>
            <p className="text-3xl font-bold text-white">823</p>
            <p className="text-xs text-zinc-500 mt-1">From Purchase Register</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400 mb-2">GSTR 2B Entries</p>
            <p className="text-3xl font-bold text-white">856</p>
            <p className="text-xs text-zinc-500 mt-1">Government portal data</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400 mb-2">Match Rate</p>
            <p className="text-3xl font-bold text-emerald-500">92%</p>
            <p className="text-xs text-zinc-500 mt-1">756 perfect matches</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400 mb-2">Time Saved</p>
            <p className="text-3xl font-bold text-primary">14 hrs</p>
            <p className="text-xs text-zinc-500 mt-1">vs manual process</p>
          </div>
        </div>
      </GlassPanel>

    </div>
  );
}
