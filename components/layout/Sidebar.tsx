'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  ShoppingCart, 
  Tag, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  FileWarning, 
  Users, 
  Briefcase, 
  FileSpreadsheet, 
  TrendingUp, 
  BarChart3, 
  Bell, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Triangle,
  Zap,
  ShieldCheck,
  AlertOctagon,
  BookOpen,
  Send,
  History,
  Gavel,
  Clock,
  PieChart,
  LineChart
} from 'lucide-react';

// Types for the new Sidebar structure
type SidebarItem = {
  label: string;
  path?: string;
  icon: any;
  badge?: string | number;
  badgeColor?: string; // Tailwind class
  subItems?: SidebarItem[];
};

type SidebarConfig = {
  sme: SidebarItem[];
  ca: SidebarItem[];
};

const SIDEBAR_CONFIG: SidebarConfig = {
  sme: [
    { 
      label: "Dashboard", 
      path: "/dashboard/sme", 
      icon: LayoutDashboard 
    },
    {
      label: "Invoice Management",
      icon: FileText,
      path: "/dashboard/sme/invoices", // Parent path for matching
      subItems: [
        { label: "Upload Invoices", path: "/dashboard/sme/invoices/upload", icon: Upload },
        { label: "Purchase Register", path: "/dashboard/sme/invoices/purchase", icon: ShoppingCart },
        { label: "Sales Register", path: "/dashboard/sme/invoices/sales", icon: Tag },
        { label: "Validation Queue", path: "/dashboard/sme/invoices/validation", icon: AlertCircle, badge: 12, badgeColor: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" },
      ]
    },
    {
      label: "Reconciliation",
      icon: RefreshCw,
      path: "/dashboard/sme/reconciliation", // Parent path for matching
      subItems: [
        { label: "Run Reconciliation", path: "/dashboard/sme/reconciliation/run", icon: Zap },
        { label: "Matched Invoices", path: "/dashboard/sme/reconciliation/matched", icon: CheckCircle2 },
        { label: "Discrepancies", path: "/dashboard/sme/reconciliation/discrepancies", icon: FileWarning, badge: 5, badgeColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" },
        { label: "Exception Dashboard", path: "/dashboard/sme/reconciliation/exceptions", icon: AlertOctagon },
      ]
    },
    {
      label: "Vendor Management",
      icon: Users,
      path: "/dashboard/sme/vendors", // Parent path for matching
      subItems: [
        { label: "Vendor List", path: "/dashboard/sme/vendors/list", icon: Users },
        { label: "Send Reminders", path: "/dashboard/sme/vendors/reminders", icon: Send },
        { label: "Vendor Reports", path: "/dashboard/sme/vendors/reports", icon: BarChart3 },
      ]
    },
    {
      label: "IMS Actions",
      path: "/dashboard/sme/ims",
      icon: Briefcase,
      badge: 8,
      badgeColor: "bg-primary",
      subItems: [
        { label: "GSTR-2B Actions", path: "/dashboard/sme/ims/actions", icon: Gavel },
        { label: "Pending Approvals", path: "/dashboard/sme/ims/pending", icon: Clock, badge: 3, badgeColor: "bg-amber-500" },
        { label: "Action History", path: "/dashboard/sme/ims/history", icon: History },
      ]
    },
    {
      label: "GST Returns",
      icon: FileSpreadsheet,
      path: "/dashboard/sme/returns", // Parent path for matching
      subItems: [
        { label: "GSTR-1 Draft", path: "/dashboard/sme/returns/gstr1", icon: FileText },
        { label: "GSTR-2B Fetch", path: "/dashboard/sme/returns/gstr2b", icon: Upload },
        { label: "GSTR-3B Draft", path: "/dashboard/sme/returns/gstr3b", icon: FileText },
        { label: "Filing History", path: "/dashboard/sme/returns/history", icon: BookOpen },
      ]
    },
    {
      label: "ITC Management",
      path: "/dashboard/sme/itc",
      icon: TrendingUp,
      subItems: [
        { label: "ITC Summary", path: "/dashboard/sme/itc/summary", icon: TrendingUp },
        { label: "Loss Analysis", path: "/dashboard/sme/itc/loss-analysis", icon: PieChart },
        { label: "ITC Forecast", path: "/dashboard/sme/itc/forecast", icon: LineChart },
      ]
    },
    {
      label: "Reports & Analytics",
      icon: BarChart3,
      path: "/dashboard/sme/reports", // Parent path for matching
      subItems: [
        { label: "Reconciliation Reports", path: "/dashboard/sme/reports/reco", icon: FileText },
        { label: "Compliance Dashboard", path: "/dashboard/sme/reports/compliance", icon: ShieldCheck },
        { label: "HSN/SAC Analysis", path: "/dashboard/sme/reports/hsn", icon: BarChart3 },
        { label: "Audit Trail", path: "/dashboard/sme/reports/audit", icon: FileText },
      ]
    },
    {
      label: "Alerts & Notifications",
      path: "/dashboard/sme/alerts",
      icon: Bell,
      badge: 3,
      badgeColor: "bg-primary"
    }
  ],
  ca: [
    { label: "CA Dashboard", path: "/dashboard/ca", icon: LayoutDashboard },
    { label: "Client Portfolio", path: "/dashboard/ca/clients", icon: Users },
    { label: "Staff Allocation", path: "/dashboard/ca/staff", icon: Briefcase },
    { label: "Settings", path: "/dashboard/ca/settings", icon: Settings },
  ]
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Determine role and config
  const currentRole = pathname.includes('/dashboard/ca') ? 'ca' : 'sme';
  const menuItems = SIDEBAR_CONFIG[currentRole];

  // Helper to check active state
  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/dashboard/sme' || path === '/dashboard/ca') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  // Auto-expand menu if child is active
  useEffect(() => {
    const activeParent = menuItems.find(item => 
      // Check if parent path matches current location (e.g. /vendors matches /vendors/details)
      (item.path && pathname.startsWith(item.path)) || 
      // Or if any sub-item matches
      item.subItems?.some(sub => isActive(sub.path))
    );

    if (activeParent && !expandedMenus.includes(activeParent.label)) {
      setExpandedMenus(prev => [...prev, activeParent.label]);
    }
  }, [pathname, menuItems]);

  const toggleSubMenu = (label: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setExpandedMenus(prev => 
      prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
    );
  };

  const handleNavigation = (path?: string) => {
    if (path) router.push(path);
  };

  return (
    <aside 
      className={`
        h-screen bg-zinc-950/95 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] z-20 shadow-2xl
        ${isCollapsed ? 'w-[70px]' : 'w-[240px]'}
      `}
    >
      {/* Top Section: Logo & Toggle */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} border-b border-white/5 shrink-0 transition-all duration-300`}>
        
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
               <div className={`h-8 w-8 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-gradient-to-br ${currentRole === 'ca' ? 'from-emerald-700 to-emerald-900' : 'from-primary to-emerald-700'} shrink-0`}>
                  <Triangle className="h-4 w-4 text-white fill-white rotate-180" />
               </div>
               <div className="flex flex-col">
                 <span className="text-lg font-bold tracking-tight text-white leading-none font-sans">Saral<span className="text-primary">GST</span></span>
               </div>
            </div>
            <button 
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-zinc-400 hover:text-primary transition-all group"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* GSTIN Indicator (Only visible when open) */}
      {!isCollapsed && (
        <div className="px-3 py-4 shrink-0">
          <div className="bg-gradient-to-r from-zinc-900 to-black rounded-xl p-3 border border-white/5 shadow-inner">
             <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Active GSTIN</p>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse"></div>
             </div>
             <p className="text-xs text-white font-mono font-medium tracking-wide truncate">27AAACW1234F1Z5</p>
          </div>
        </div>
      )}

      {/* Navigation Items (Hidden Scrollbar) */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {menuItems.map((item, idx) => {
          const isExpanded = expandedMenus.includes(item.label);
          // Active if exact match, starts with path, or sub-item active
          const isItemActive = isActive(item.path) || (item.subItems?.some(sub => isActive(sub.path)));

          return (
            <div key={idx} className="relative group">
              {/* Main Item */}
              <button
                onClick={() => item.subItems ? toggleSubMenu(item.label) : handleNavigation(item.path)}
                onMouseEnter={() => isCollapsed && setHoveredItem(item.label)}
                onMouseLeave={() => isCollapsed && setHoveredItem(null)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden
                  ${isItemActive 
                    ? 'text-white bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' 
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border-l-2 border-transparent'}
                  ${isCollapsed ? 'justify-center px-0' : ''}
                `}
              >
                <div className={`flex items-center gap-3 z-10 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                  <item.icon className={`h-4 w-4 shrink-0 transition-colors duration-300 ${isItemActive ? 'text-primary drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]' : 'group-hover:text-white'}`} />
                  {!isCollapsed && <span className="truncate tracking-wide text-xs">{item.label}</span>}
                </div>

                {/* Badges & Arrows */}
                {!isCollapsed && (
                  <div className="flex items-center gap-2 z-10">
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-sm ${item.badgeColor || 'bg-primary'}`}>
                        {item.badge}
                      </span>
                    )}
                    {item.subItems && (
                      <ChevronRight className={`h-3.5 w-3.5 text-zinc-600 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-zinc-300' : ''}`} />
                    )}
                  </div>
                )}
                
                {/* Collapsed Mode Badge Indicator (Dot) */}
                {isCollapsed && item.badge && (
                   <div className={`absolute top-2 right-3.5 h-1.5 w-1.5 rounded-full border border-black ${item.badgeColor || 'bg-primary'}`}></div>
                )}

                {/* Tooltip for Collapsed State */}
                {isCollapsed && hoveredItem === item.label && (
                  <div className="absolute left-[60px] bg-zinc-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                    {item.label}
                  </div>
                )}
              </button>

              {/* Sub Items */}
              {!isCollapsed && item.subItems && isExpanded && (
                <div className="mt-0.5 space-y-0.5 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300">
                  {item.subItems.map((sub, subIdx) => {
                     const isSubActive = isActive(sub.path);
                     return (
                        <button
                          key={subIdx}
                          onClick={() => handleNavigation(sub.path)}
                          className={`
                            w-full flex items-center justify-between pl-9 pr-3 py-1.5 rounded-r-lg text-xs transition-all duration-200 border-l-2 border-transparent relative
                            ${isSubActive 
                              ? 'text-white bg-white/5 border-l-primary' 
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
                          `}
                        >
                          <span className="truncate">{sub.label}</span>
                          {sub.badge && (
                            <span className={`h-1.5 w-1.5 rounded-full ${sub.badgeColor || 'bg-red-500'}`}></span>
                          )}
                        </button>
                     );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Settings, Profile */}
      <div className="border-t border-white/5 bg-black/20 p-2 space-y-1 shrink-0 backdrop-blur-md">
        
        {/* Settings */}
        <button 
           onClick={() => router.push('/dashboard/sme/settings')}
           onMouseEnter={() => isCollapsed && setHoveredItem('Settings')}
           onMouseLeave={() => isCollapsed && setHoveredItem(null)}
           className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all relative ${isCollapsed ? 'justify-center' : ''}`}
        >
           <Settings className="h-4 w-4" />
           {!isCollapsed && <span className="text-xs">Settings</span>}
           {isCollapsed && hoveredItem === 'Settings' && (
              <div className="absolute left-[60px] bg-zinc-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-md shadow-xl z-50">Settings</div>
           )}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
          >
             <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg group-hover:shadow-indigo-500/20 transition-shadow text-xs">
               MK
             </div>
             {!isCollapsed && (
               <div className="flex-1 text-left overflow-hidden">
                 <p className="text-xs font-semibold text-white truncate">Manish Kumar</p>
                 <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">Admin</p>
               </div>
             )}
             {!isCollapsed && <ChevronDown className="h-3 w-3 text-zinc-500 group-hover:text-white transition-colors" />}
          </button>
          
          {/* Profile Dropdown */}
          {userMenuOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 w-full bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-1.5 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <User className="h-3.5 w-3.5" /> View Profile
              </button>
              <div className="h-px bg-white/10 my-1 mx-2"></div>
              <button 
                onClick={() => router.push('/')}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
