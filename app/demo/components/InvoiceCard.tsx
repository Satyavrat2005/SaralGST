'use client';

import React from 'react';
import { FileText, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface InvoiceCardProps {
  invoice: {
    id: string;
    supplier: string;
    gstin: string;
    amount: number;
    gst: number;
    status: 'validated' | 'rejected' | 'pending' | 'corrected';
    validationErrors?: string[];
    timestamp: string;
  };
}

export default function InvoiceCard({ invoice }: InvoiceCardProps) {
  const getStatusConfig = () => {
    switch (invoice.status) {
      case 'validated':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          label: 'Validated'
        };
      case 'rejected':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          label: 'Rejected'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/20',
          borderColor: 'border-amber-500/30',
          label: 'Pending'
        };
      default:
        return {
          icon: CheckCircle2,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          label: 'Corrected'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`p-4 rounded-lg bg-zinc-900/50 border ${statusConfig.borderColor} hover:bg-zinc-900 transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
            <FileText className={`h-4 w-4 ${statusConfig.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{invoice.id}</p>
            <p className="text-xs text-muted-foreground">{invoice.supplier}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
          <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">GSTIN</span>
          <span className="text-white font-mono text-xs">{invoice.gstin}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="text-white font-semibold">₹{invoice.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">GST</span>
          <span className="text-white font-semibold">₹{invoice.gst.toLocaleString()}</span>
        </div>
      </div>

      {invoice.validationErrors && invoice.validationErrors.length > 0 && (
        <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/20">
          <p className="text-xs font-semibold text-red-400 mb-1">Validation Errors:</p>
          <ul className="text-xs text-red-300 space-y-1">
            {invoice.validationErrors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{invoice.timestamp}</span>
      </div>
    </div>
  );
}
