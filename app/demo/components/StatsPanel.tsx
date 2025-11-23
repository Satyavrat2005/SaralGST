'use client';

import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  Shield,
  AlertTriangle,
  Bell
} from 'lucide-react';
import BentoCard from '../../../components/ui/BentoCard';

interface StatsPanelProps {
  stats: {
    totalInvoices: number;
    validated: number;
    rejected: number;
    itcAvailable: number;
    itcBlocked: number;
    complianceScore: number;
    discrepancies: number;
    notifications: number;
  };
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="space-y-4 sticky top-24">
      {/* Overall Status */}
      <BentoCard className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold text-white">{stats.totalInvoices}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Validated</span>
            <span className="text-green-500 font-semibold">{stats.validated}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Rejected</span>
            <span className="text-red-500 font-semibold">{stats.rejected}</span>
          </div>
        </div>
      </BentoCard>

      {/* ITC Status */}
      <BentoCard className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ITC Available</p>
            <p className="text-2xl font-bold text-white">₹{(stats.itcAvailable / 1000).toFixed(0)}K</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Blocked</span>
            <span className="text-red-500 font-semibold">₹{(stats.itcBlocked / 1000).toFixed(0)}K</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
              style={{ width: `${stats.itcAvailable > 0 ? ((stats.itcAvailable - stats.itcBlocked) / stats.itcAvailable) * 100 : 0}%` }}
            />
          </div>
        </div>
      </BentoCard>

      {/* Compliance Score */}
      <BentoCard className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Compliance</p>
            <p className="text-2xl font-bold text-white">{stats.complianceScore}%</p>
          </div>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
            style={{ width: `${stats.complianceScore}%` }}
          />
        </div>
      </BentoCard>

      {/* Discrepancies */}
      <BentoCard className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Discrepancies</p>
            <p className="text-2xl font-bold text-white">{stats.discrepancies}</p>
          </div>
        </div>
        {stats.discrepancies > 0 && (
          <p className="text-xs text-muted-foreground">Requires attention</p>
        )}
      </BentoCard>

      {/* Notifications */}
      <BentoCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Notifications Sent</p>
            <p className="text-2xl font-bold text-white">{stats.notifications}</p>
          </div>
        </div>
      </BentoCard>

      {/* Live Status Indicator */}
      <div className="p-4 rounded-lg bg-zinc-900/50 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-white">Live Processing</span>
        </div>
        <p className="text-xs text-muted-foreground">Workflow executing in real-time</p>
      </div>
    </div>
  );
}
