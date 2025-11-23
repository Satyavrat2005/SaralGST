'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  Settings, 
  Users, 
  LogOut,
  Triangle,
  Briefcase,
  FileSpreadsheet,
  AlertOctagon
} from 'lucide-react';

// Configuration for different dashboard roles
// In a real Next.js app, you might derive this from the file system, 
// but here we define it centrally for "automatic" rendering.
const SIDEBAR_CONFIG = {
  sme: [
    {
      label: "Core",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/sme" },
        { icon: FileText, label: "Smart Invoices", path: "/dashboard/sme/invoices" },
        { icon: Receipt, label: "Expenses", path: "/dashboard/sme/expenses" },
      ]
    },
    {
      label: "Compliance",
      items: [
        { icon: FileText, label: "GSTR-1", path: "/dashboard/sme/gstr1" },
        { icon: ShieldCheck, label: "GSTR-2B Reco", path: "/dashboard/sme/gstr2b" },
        { icon: FileText, label: "GSTR-3B", path: "/dashboard/sme/gstr3b" },
      ]
    },
    {
      label: "Intelligence",
      items: [
        { icon: Zap, label: "ITC Maximizer", path: "/dashboard/sme/itc" },
        { icon: BarChart3, label: "XAI Reports", path: "/dashboard/sme/reports" },
      ]
    },
    {
      label: "Settings",
      items: [
        { icon: Users, label: "Business Profile", path: "/dashboard/sme/profile" },
        { icon: Settings, label: "Vendor Master", path: "/dashboard/sme/vendors" },
      ]
    }
  ],
  ca: [
    {
      label: "Practice Management",
      items: [
        { icon: LayoutDashboard, label: "CA Dashboard", path: "/dashboard/ca" },
        { icon: Users, label: "Client Portfolio", path: "/dashboard/ca/clients" },
        { icon: Briefcase, label: "Staff Allocation", path: "/dashboard/ca/staff" },
      ]
    },
    {
      label: "Filing Center",
      items: [
        { icon: FileSpreadsheet, label: "Bulk GSTR-1", path: "/dashboard/ca/bulk-gstr1" },
        { icon: FileSpreadsheet, label: "Bulk GSTR-3B", path: "/dashboard/ca/bulk-gstr3b" },
        { icon: AlertOctagon, label: "Notices & Orders", path: "/dashboard/ca/notices" },
      ]
    },
    {
      label: "Audit & Reports",
      items: [
        { icon: ShieldCheck, label: "Audit Workbench", path: "/dashboard/ca/audit" },
        { icon: BarChart3, label: "Client Analytics", path: "/dashboard/ca/analytics" },
      ]
    },
    {
      label: "Admin",
      items: [
        { icon: Settings, label: "Firm Settings", path: "/dashboard/ca/settings" },
      ]
    }
  ]
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Determine current dashboard type based on URL
  const currentRole = pathname?.includes('/dashboard/ca') ? 'ca' : 'sme';
  const menuGroups = SIDEBAR_CONFIG[currentRole];

  const isActive = (path: string) => {
     // Exact match or sub-path match for nested routes
     return pathname === path || (pathname?.startsWith(path) && path !== '/dashboard/sme' && path !== '/dashboard/ca');
  };

  return (
    <aside className="w-64 h-screen bg-black/20 backdrop-blur-lg border-r border-white/5 flex flex-col shrink-0 transition-all duration-300">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] ${currentRole === 'ca' ? 'bg-emerald-700' : 'bg-primary'}`}>
            <Triangle className="h-5 w-5 text-white fill-white rotate-180" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white leading-none">Saral<span className="text-primary">GST</span></span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              {currentRole === 'ca' ? 'Pro Console' : 'Business'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{group.label}</h4>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden
                      ${active ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.6)]" />}
                    <item.icon className={`h-4 w-4 transition-colors ${active ? 'text-primary' : 'group-hover:text-white'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => router.push('/')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
