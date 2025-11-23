'use client';

import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import GlassPanel from '../../../components/ui/GlassPanel';

interface WorkflowStepProps {
  step: {
    id: number;
    title: string;
    description: string;
    icon: any;
    status: 'pending' | 'running' | 'completed' | 'error' | 'warning';
    progress: number;
    details?: any;
  };
  isActive: boolean;
  isCompleted: boolean;
}

export default function WorkflowStep({ step, isActive, isCompleted }: WorkflowStepProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-zinc-500" />;
    }
  };

  const getStatusColor = () => {
    switch (step.status) {
      case 'completed':
        return 'border-green-500/30 bg-green-500/5';
      case 'running':
        return 'border-primary/30 bg-primary/5';
      case 'error':
        return 'border-red-500/30 bg-red-500/5';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/5';
      default:
        return 'border-white/10';
    }
  };

  return (
    <GlassPanel className={`p-6 transition-all duration-300 ${getStatusColor()} ${isActive ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-xl ${
              step.status === 'completed' ? 'bg-green-500/20' :
              step.status === 'running' ? 'bg-primary/20' :
              step.status === 'error' ? 'bg-red-500/20' :
              'bg-zinc-800'
            }`}>
              <step.icon className={`h-6 w-6 ${
                step.status === 'completed' ? 'text-green-500' :
                step.status === 'running' ? 'text-primary' :
                step.status === 'error' ? 'text-red-500' :
                'text-zinc-500'
              }`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                  Step {step.id}/9
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusIcon()}
            {step.details && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-white/5 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {step.status === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-semibold">{step.progress}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${step.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Details Panel */}
        {isExpanded && step.details && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(step.details).map(([key, value]: [string, any]) => {
                // Skip array/object types for now
                if (typeof value === 'object') return null;
                
                return (
                  <div key={key} className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                    <p className="text-xs text-muted-foreground capitalize mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-xl font-bold text-white">{value}</p>
                  </div>
                );
              })}
            </div>

            {/* Show invoices if available */}
            {step.details.invoices && Array.isArray(step.details.invoices) && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-white mb-2">Received Invoices</h4>
                {step.details.invoices.map((invoice: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-900/50 border border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-white">{invoice.id}</p>
                      <p className="text-xs text-muted-foreground">{invoice.supplier}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">₹{invoice.amount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        invoice.status === 'validated' ? 'bg-green-500/20 text-green-500' :
                        invoice.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                        'bg-amber-500/20 text-amber-500'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
