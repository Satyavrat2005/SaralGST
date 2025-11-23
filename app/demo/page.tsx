'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Loader2,
  MessageSquare,
  FileText,
  Database,
  GitMerge,
  Send,
  BarChart3,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Zap,
  Shield
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import BentoCard from '../../components/ui/BentoCard';
import WorkflowStep from './components/WorkflowStep';
import StatsPanel from './components/StatsPanel';
import { triggerN8nWorkflow, getWorkflowStatus } from './utils/n8nIntegration';

// Types
type WorkflowStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';
type StepStatus = 'pending' | 'running' | 'completed' | 'error' | 'warning';

interface WorkflowStepData {
  id: number;
  title: string;
  description: string;
  icon: any;
  status: StepStatus;
  progress: number;
  details?: any;
}

export default function DemoWorkflowPage() {
  const router = useRouter();
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  // Workflow steps data
  const [steps, setSteps] = useState<WorkflowStepData[]>([
    {
      id: 1,
      title: 'Invoice Capture from WhatsApp',
      description: 'Receiving and processing invoices from 3 suppliers via WhatsApp',
      icon: MessageSquare,
      status: 'pending',
      progress: 0,
      details: {
        invoices: [],
        validated: 0,
        rejected: 0,
        pending: 0
      }
    },
    {
      id: 2,
      title: 'AI OCR & Validation',
      description: 'Extracting data and validating GSTIN, amounts, and tax rates',
      icon: Zap,
      status: 'pending',
      progress: 0,
      details: {
        extracted: 0,
        validated: 0,
        failed: 0
      }
    },
    {
      id: 3,
      title: 'Auto WhatsApp Notifications',
      description: 'Sending correction requests for failed validations',
      icon: Send,
      status: 'pending',
      progress: 0,
      details: {
        sent: 0,
        delivered: 0,
        pending: 0
      }
    },
    {
      id: 4,
      title: 'Purchase Register Update',
      description: 'Inserting validated invoices into Purchase Register',
      icon: Database,
      status: 'pending',
      progress: 0,
      details: {
        inserted: 0,
        duplicates: 0,
        conflicts: 0
      }
    },
    {
      id: 5,
      title: 'GSTR 2B Upload & Parsing',
      description: 'Processing GSTR 2B data and validating schema',
      icon: FileSpreadsheet,
      status: 'pending',
      progress: 0,
      details: {
        entries: 0,
        matched: 0,
        mismatched: 0
      }
    },
    {
      id: 6,
      title: 'Intelligent Reconciliation',
      description: 'Cross-referencing Purchase Register with GSTR 2B',
      icon: GitMerge,
      status: 'pending',
      progress: 0,
      details: {
        total: 0,
        matched: 0,
        discrepancies: 0
      }
    },
    {
      id: 7,
      title: 'Discrepancy Analysis',
      description: 'Categorizing and scoring discrepancies for ITC impact',
      icon: AlertTriangle,
      status: 'pending',
      progress: 0,
      details: {
        critical: 0,
        warnings: 0,
        resolved: 0
      }
    },
    {
      id: 8,
      title: 'Vendor Compliance Scoring',
      description: 'Calculating vendor compliance and reliability scores',
      icon: Shield,
      status: 'pending',
      progress: 0,
      details: {
        compliant: 0,
        atRisk: 0,
        nonCompliant: 0
      }
    },
    {
      id: 9,
      title: 'Report Generation & Filing',
      description: 'Creating forensic reports and draft GSTR 3B/9B',
      icon: FileText,
      status: 'pending',
      progress: 0,
      details: {
        reports: 0,
        drafts: 0
      }
    }
  ]);

  // Global statistics
  const [stats, setStats] = useState({
    totalInvoices: 0,
    validated: 0,
    rejected: 0,
    itcAvailable: 0,
    itcBlocked: 0,
    complianceScore: 0,
    discrepancies: 0,
    notifications: 0
  });

  // Start workflow
  const startWorkflow = async () => {
    setWorkflowStatus('running');
    setCurrentStep(0);
    
    try {
      // Trigger n8n workflow
      const result = await triggerN8nWorkflow({
        action: 'start',
        demo: true
      });
      
      setWorkflowId(result.workflowId);
      
      // Start step execution
      if (isAutoPlay) {
        executeStepsSequentially();
      }
    } catch (error) {
      console.error('Failed to start workflow:', error);
      setWorkflowStatus('error');
    }
  };

  // Execute steps sequentially
  const executeStepsSequentially = async () => {
    for (let i = 0; i < steps.length; i++) {
      await executeStep(i);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between steps
    }
    setWorkflowStatus('completed');
  };

  // Execute individual step
  const executeStep = async (stepIndex: number) => {
    setCurrentStep(stepIndex);
    
    // Update step status to running
    setSteps(prev => prev.map((step, idx) => 
      idx === stepIndex ? { ...step, status: 'running', progress: 0 } : step
    ));

    // Simulate progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setSteps(prev => prev.map((step, idx) => 
        idx === stepIndex ? { ...step, progress } : step
      ));
    }

    // Mock data updates based on step
    updateStepData(stepIndex);

    // Update step status to completed
    setSteps(prev => prev.map((step, idx) => 
      idx === stepIndex ? { ...step, status: 'completed', progress: 100 } : step
    ));
  };

  // Update step-specific data
  const updateStepData = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Invoice capture
        setSteps(prev => prev.map((step, idx) => 
          idx === 0 ? {
            ...step,
            details: {
              invoices: [
                { id: 'INV-001', supplier: 'ABC Corp', amount: 125000, status: 'received' },
                { id: 'INV-002', supplier: 'XYZ Ltd', amount: 89000, status: 'received' },
                { id: 'INV-003', supplier: 'PQR Traders', amount: 56000, status: 'received' }
              ],
              validated: 0,
              rejected: 0,
              pending: 3
            }
          } : step
        ));
        setStats(prev => ({ ...prev, totalInvoices: 3 }));
        break;

      case 1: // OCR & Validation
        setSteps(prev => prev.map((step, idx) => 
          idx === 1 ? {
            ...step,
            details: {
              extracted: 3,
              validated: 2,
              failed: 1
            }
          } : step
        ));
        setStats(prev => ({ ...prev, validated: 2, rejected: 1 }));
        break;

      case 2: // Notifications
        setSteps(prev => prev.map((step, idx) => 
          idx === 2 ? {
            ...step,
            details: {
              sent: 1,
              delivered: 1,
              pending: 0
            }
          } : step
        ));
        setStats(prev => ({ ...prev, notifications: 1 }));
        break;

      case 3: // Purchase Register
        setSteps(prev => prev.map((step, idx) => 
          idx === 3 ? {
            ...step,
            details: {
              inserted: 2,
              duplicates: 0,
              conflicts: 0
            }
          } : step
        ));
        break;

      case 4: // GSTR 2B
        setSteps(prev => prev.map((step, idx) => 
          idx === 4 ? {
            ...step,
            details: {
              entries: 45,
              matched: 40,
              mismatched: 5
            }
          } : step
        ));
        break;

      case 5: // Reconciliation
        setSteps(prev => prev.map((step, idx) => 
          idx === 5 ? {
            ...step,
            details: {
              total: 47,
              matched: 42,
              discrepancies: 5
            }
          } : step
        ));
        setStats(prev => ({ ...prev, discrepancies: 5 }));
        break;

      case 6: // Discrepancy Analysis
        setSteps(prev => prev.map((step, idx) => 
          idx === 6 ? {
            ...step,
            details: {
              critical: 2,
              warnings: 3,
              resolved: 0
            }
          } : step
        ));
        setStats(prev => ({ ...prev, itcAvailable: 245000, itcBlocked: 45000 }));
        break;

      case 7: // Vendor Compliance
        setSteps(prev => prev.map((step, idx) => 
          idx === 7 ? {
            ...step,
            details: {
              compliant: 2,
              atRisk: 1,
              nonCompliant: 0
            }
          } : step
        ));
        setStats(prev => ({ ...prev, complianceScore: 87 }));
        break;

      case 8: // Report Generation
        setSteps(prev => prev.map((step, idx) => 
          idx === 8 ? {
            ...step,
            details: {
              reports: 1,
              drafts: 2
            }
          } : step
        ));
        break;
    }
  };

  // Reset workflow
  const resetWorkflow = () => {
    setWorkflowStatus('idle');
    setCurrentStep(0);
    setWorkflowId(null);
    setSteps(prev => prev.map(step => ({
      ...step,
      status: 'pending',
      progress: 0
    })));
    setStats({
      totalInvoices: 0,
      validated: 0,
      rejected: 0,
      itcAvailable: 0,
      itcBlocked: 0,
      complianceScore: 0,
      discrepancies: 0,
      notifications: 0
    });
  };

  // Pause/Resume workflow
  const togglePause = () => {
    if (workflowStatus === 'running') {
      setWorkflowStatus('paused');
    } else if (workflowStatus === 'paused') {
      setWorkflowStatus('running');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">End-to-End GST Reconciliation Demo</h1>
                <p className="text-sm text-muted-foreground">Complete workflow with AI validation & automated alerts</p>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900 border border-white/10">
                <div className={`h-2 w-2 rounded-full ${
                  workflowStatus === 'running' ? 'bg-green-500 animate-pulse' :
                  workflowStatus === 'completed' ? 'bg-blue-500' :
                  workflowStatus === 'error' ? 'bg-red-500' :
                  'bg-zinc-500'
                }`}></div>
                <span className="text-xs font-medium text-white capitalize">{workflowStatus}</span>
              </div>

              <button
                onClick={resetWorkflow}
                disabled={workflowStatus === 'running'}
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>

              {workflowStatus === 'idle' || workflowStatus === 'completed' ? (
                <button
                  onClick={startWorkflow}
                  className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Play className="h-4 w-4" />
                  Start Demo
                </button>
              ) : (
                <button
                  onClick={togglePause}
                  className="px-6 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  {workflowStatus === 'running' ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Resume
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar - Statistics */}
          <div className="lg:col-span-1 space-y-4">
            <StatsPanel stats={stats} />
          </div>

          {/* Main Area - Workflow Steps */}
          <div className="lg:col-span-3 space-y-6">
            {steps.map((step, index) => (
              <WorkflowStep
                key={step.id}
                step={step}
                isActive={currentStep === index}
                isCompleted={step.status === 'completed'}
              />
            ))}

            {/* Completion Message */}
            {workflowStatus === 'completed' && (
              <GlassPanel className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Workflow Completed Successfully!</h3>
                    <p className="text-muted-foreground">All steps have been executed. Reports and draft returns are ready.</p>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Reports
                    </button>
                    <button className="px-6 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800 transition-colors flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View in n8n
                    </button>
                  </div>
                </div>
              </GlassPanel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
