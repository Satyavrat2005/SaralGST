'use client';

import React from 'react';
import { AlertTriangle, AlertOctagon, TrendingDown, ExternalLink } from 'lucide-react';

interface DiscrepancyCardProps {
  discrepancy: {
    id: string;
    type: 'missing_in_2b' | 'missing_in_books' | 'amount_mismatch' | 'gstin_error' | 'quantity_mismatch';
    severity: 'critical' | 'warning' | 'info';
    invoice: string;
    supplier: string;
    issue: string;
    itcImpact: number;
    details: string;
  };
}

export default function DiscrepancyCard({ discrepancy }: DiscrepancyCardProps) {
  const getSeverityConfig = () => {
    switch (discrepancy.severity) {
      case 'critical':
        return {
          icon: AlertOctagon,
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          label: 'Critical'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/20',
          borderColor: 'border-amber-500/30',
          label: 'Warning'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          label: 'Info'
        };
    }
  };

  const getTypeLabel = () => {
    switch (discrepancy.type) {
      case 'missing_in_2b':
        return 'Missing in GSTR 2B';
      case 'missing_in_books':
        return 'Missing in Books';
      case 'amount_mismatch':
        return 'Amount Mismatch';
      case 'gstin_error':
        return 'GSTIN Error';
      case 'quantity_mismatch':
        return 'Quantity Mismatch';
      default:
        return 'Unknown Issue';
    }
  };

  const severityConfig = getSeverityConfig();
  const SeverityIcon = severityConfig.icon;

  return (
    <div className={`p-4 rounded-lg bg-zinc-900/50 border ${severityConfig.borderColor} hover:bg-zinc-900 transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${severityConfig.bgColor}`}>
            <SeverityIcon className={`h-4 w-4 ${severityConfig.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{getTypeLabel()}</p>
            <p className="text-xs text-muted-foreground">{discrepancy.invoice} • {discrepancy.supplier}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${severityConfig.bgColor} ${severityConfig.color}`}>
          {severityConfig.label}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <p className="text-sm text-white">{discrepancy.issue}</p>
        <p className="text-xs text-muted-foreground">{discrepancy.details}</p>
      </div>

      {discrepancy.itcImpact > 0 && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
          <TrendingDown className="h-4 w-4 text-red-400" />
          <div className="flex-1">
            <p className="text-xs text-red-400 font-semibold">ITC Impact</p>
            <p className="text-sm text-red-300 font-bold">₹{discrepancy.itcImpact.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">ID: {discrepancy.id}</span>
        <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
          View Details <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
