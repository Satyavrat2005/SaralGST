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
      case 'critical': return <AlertOctagon className="h-4 w-4 text-white" strokeWidth={2.5} />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-white" strokeWidth={2.5} />;
      case 'info': return <Info className="h-4 w-4 text-white" strokeWidth={2.5} />;
      default: return <Bell className="h-4 w-4 text-white" strokeWidth={2.5} />;
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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[11px] font-semibold text-emerald-700">Alert Center</span>
              </div>
              <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-1">Alerts & Notifications</h1>
              <p className="text-sm text-gray-600">Stay updated with critical compliance events and system activities</p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={markAllAsRead}
                 className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2"
               >
                 <CheckCircle2 className="h-4 w-4" /> Mark all as read
               </button>
               <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2">
                 <Filter className="h-4 w-4" /> Filter
               </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 p-2 inline-flex gap-1">
           {['all', 'critical', 'warning', 'info'].map((f) => (
              <button 
                 key={f}
                 onClick={() => setFilter(f as any)}
                 className={`
                    px-6 py-2.5 text-sm font-medium rounded-xl transition-all capitalize
                    ${filter === f 
                       ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-200' 
                       : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
                 `}
              >
                 {f}
              </button>
           ))}
        </div>

      {/* Alerts Feed */}
      <div className="space-y-8">
         {Object.entries(groupedAlerts).map(([group, items]) => (
            items.length > 0 && (
               <div key={group} className="space-y-3">
                  <div className="flex items-center gap-2 ml-2">
                     <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                     <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{group}</h3>
                  </div>
                  {items.map((alert) => (
                     <div 
                        key={alert.id} 
                        className={`relative bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300 ${
                           alert.read ? 'opacity-60' : ''
                        }`}
                     >
                        {/* Status indicator */}
                        {!alert.read && (
                           <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-r-full"></div>
                        )}
                        
                        <div className="px-5 py-3.5 flex items-center gap-5">
                           {/* Icon */}
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                              alert.type === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                              alert.type === 'warning' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                              'bg-gradient-to-br from-blue-500 to-cyan-600'
                           }`}>
                              {getIcon(alert.type)}
                           </div>
                           
                           {/* Content - Title & Message */}
                           <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-semibold ${alert.read ? 'text-gray-500' : 'text-gray-900'}`}>
                                 {alert.title}
                              </h4>
                              <p className={`text-xs mt-0.5 line-clamp-1 ${alert.read ? 'text-gray-400' : 'text-gray-600'}`}>
                                 {alert.message}
                              </p>
                           </div>

                           {/* Time */}
                           <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap min-w-[100px]">
                              <Clock className="h-3.5 w-3.5" />
                              {alert.time}
                           </div>

                           {/* Action Button - Fixed Width Container */}
                           <div className="min-w-[130px]">
                              {alert.action && (
                                 <button className="btn-primary-custom text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all whitespace-nowrap">
                                    {alert.action}
                                    <ArrowRight className="h-3 w-3" />
                                 </button>
                              )}
                           </div>

                           {/* Actions - Fixed Width */}
                           <div className="flex items-center gap-2 border-l border-gray-200 pl-4 min-w-[80px] justify-end">
                              {!alert.read && (
                                 <button 
                                    onClick={() => markAsRead(alert.id)}
                                    className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 transition-all" 
                                    title="Mark as read"
                                 >
                                    <Check className="h-3.5 w-3.5" />
                                 </button>
                              )}
                              <button 
                                 onClick={() => deleteAlert(alert.id)}
                                 className="p-2 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
                                 title="Delete"
                              >
                                 <Trash2 className="h-3.5 w-3.5" />
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )
         ))}

         {filteredAlerts.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-20">
               <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                     <Bell className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No alerts found in this category.</p>
               </div>
            </div>
         )}
      </div>
    </div>
    </div>
  );
}
