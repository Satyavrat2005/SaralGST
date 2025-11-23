'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  X, 
  Filter, 
  Check,
  Clock,
  ArrowRight,
  Trash2
} from 'lucide-react';
import GlassPanel from '../../../../components/ui/GlassPanel';

// Mock Alerts Data
const initialAlerts = [
  { id: 1, type: 'critical', title: 'GSTR-3B Filing Due Tomorrow', message: 'Your GSTR-3B filing for October 2025 is due on 20th Nov. Late fees will apply after the deadline.', time: '2 hours ago', date: 'Today', read: false, action: 'File Now' },
  { id: 2, type: 'warning', title: 'High Value ITC at Risk', message: 'Invoice #INV-009988 from ABC Corp (₹4.5L) is missing in GSTR-2B. Please follow up immediately.', time: '4 hours ago', date: 'Today', read: false, action: 'View Invoice' },
  { id: 3, type: 'info', title: 'GSTR-2B Fetched Successfully', message: 'Auto-fetch for November 2025 completed. 856 new invoices imported.', time: '10:30 AM', date: 'Today', read: true, action: 'View Report' },
  { id: 4, type: 'critical', title: 'GSTIN Validation Failed', message: 'Vendor "TechSol Solutions" has an inactive GSTIN. Future invoices may be blocked.', time: 'Yesterday', date: 'Yesterday', read: true, action: 'Manage Vendor' },
  { id: 5, type: 'warning', title: 'Reconciliation Discrepancies Found', message: '12 new discrepancies found in the latest reconciliation run.', time: 'Yesterday', date: 'Yesterday', read: true, action: 'Resolve' },
  { id: 6, type: 'info', title: 'System Maintenance', message: 'Scheduled maintenance on 25th Nov from 2 AM to 4 AM.', time: '21 Nov', date: 'Earlier', read: true, action: null },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const markAsRead = (id: number) => {
    setAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, read: true } : alert));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const deleteAlert = (id: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const filteredAlerts = alerts.filter(alert => filter === 'all' || alert.type === filter);

  // Group by date
  const groupedAlerts = {
    Today: filteredAlerts.filter(a => a.date === 'Today'),
    Yesterday: filteredAlerts.filter(a => a.date === 'Yesterday'),
    Earlier: filteredAlerts.filter(a => a.date === 'Earlier'),
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertOctagon className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-zinc-500" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-500/50 bg-red-500/5';
      case 'warning': return 'border-amber-500/50 bg-amber-500/5';
      case 'info': return 'border-blue-500/50 bg-blue-500/5';
      default: return 'border-zinc-700 bg-zinc-900/50';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Alerts & Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated with critical compliance events and system activities</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={markAllAsRead}
             className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
           >
             <CheckCircle2 className="h-4 w-4" /> Mark all as read
           </button>
           <button className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
             <Filter className="h-4 w-4" /> Filter
           </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-white/5">
         {['all', 'critical', 'warning', 'info'].map((f) => (
            <button 
               key={f}
               onClick={() => setFilter(f as any)}
               className={`
                  px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize
                  ${filter === f 
                     ? 'border-primary text-white' 
                     : 'border-transparent text-zinc-500 hover:text-zinc-300'}
               `}
            >
               {f}
            </button>
         ))}
      </div>

      {/* Alerts Feed */}
      <div className="max-w-4xl mx-auto space-y-8">
         {Object.entries(groupedAlerts).map(([group, items]) => (
            items.length > 0 && (
               <div key={group} className="space-y-4">
                  <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider ml-2">{group}</h3>
                  {items.map((alert) => (
                     <GlassPanel 
                        key={alert.id} 
                        className={`p-0 overflow-hidden transition-all duration-200 hover:translate-x-1 ${alert.read ? 'opacity-75' : 'opacity-100 border-l-4 border-l-primary'}`}
                     >
                        <div className="p-5 flex items-start gap-4">
                           <div className={`p-2 rounded-full shrink-0 bg-zinc-900 border border-white/5`}>
                              {getIcon(alert.type)}
                           </div>
                           
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                 <h4 className={`text-base font-semibold ${alert.read ? 'text-zinc-300' : 'text-white'}`}>
                                    {alert.title}
                                 </h4>
                                 <span className="text-xs text-zinc-500 whitespace-nowrap ml-4 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {alert.time}
                                 </span>
                              </div>
                              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                                 {alert.message}
                              </p>
                              
                              {alert.action && (
                                 <div className="mt-3 flex items-center gap-3">
                                    <button className="text-xs font-medium text-primary hover:text-emerald-400 flex items-center gap-1 transition-colors">
                                       {alert.action} <ArrowRight className="h-3 w-3" />
                                    </button>
                                 </div>
                              )}
                           </div>

                           <div className="flex flex-col gap-2 ml-4">
                              {!alert.read && (
                                 <button 
                                    onClick={() => markAsRead(alert.id)}
                                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-emerald-500 transition-colors" 
                                    title="Mark as read"
                                 >
                                    <Check className="h-4 w-4" />
                                 </button>
                              )}
                              <button 
                                 onClick={() => deleteAlert(alert.id)}
                                 className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-500 transition-colors"
                                 title="Delete"
                              >
                                 <Trash2 className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                     </GlassPanel>
                  ))}
               </div>
            )
         ))}

         {filteredAlerts.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
               <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
               <p>No alerts found in this category.</p>
            </div>
         )}
      </div>
    </div>
  );
}
