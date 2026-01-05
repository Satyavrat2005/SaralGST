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
        h-screen bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] z-20 shadow-sm
        ${isCollapsed ? 'w-[70px]' : 'w-[260px]'}
      `}
    >
      {/* Top Section: Logo & Toggle */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} border-b border-gray-200 shrink-0 transition-all duration-300`}>
        
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
               <div className={`h-9 w-9 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 bg-gradient-to-br ${currentRole === 'ca' ? 'from-emerald-600 to-emerald-700' : 'from-emerald-500 to-emerald-600'} shrink-0`}>
                  <Triangle className="h-5 w-5 text-white fill-white rotate-180" />
               </div>
               <div className="flex flex-col">
                 <span className="text-lg font-bold tracking-tight text-gray-900 leading-none font-sans">Saral<span className="text-emerald-600">GST</span></span>
               </div>
            </div>
            <button 
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all group"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* GSTIN Indicator (Only visible when open) */}
      {!isCollapsed && (
        <div className="px-3 py-4 shrink-0">
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-3.5 border border-emerald-200 shadow-sm hover:border-emerald-300 transition-all group">
             <div className="flex justify-between items-center mb-1.5">
                <p className="text-[10px] text-emerald-700 uppercase tracking-wider font-bold">Active GSTIN</p>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse"></div>
             </div>
             <p className="text-xs text-gray-900 font-mono font-semibold tracking-wide truncate group-hover:text-emerald-900 transition-colors">27AAACW1234F1Z5</p>
          </div>
        </div>
      )}

      {/* Navigation Items (Hidden Scrollbar) */}
      <div className="flex-1 overflow-y-auto py-2 px-2.5 space-y-1 
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
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden
                  ${isItemActive 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200'}
                  ${isCollapsed ? 'justify-center px-0' : ''}
                `}
              >
                <div className={`flex items-center gap-3 z-10 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                  <item.icon className={`h-4.5 w-4.5 shrink-0 transition-all duration-300 ${isItemActive ? 'text-emerald-600' : 'group-hover:text-gray-900 group-hover:scale-110'}`} />
                  {!isCollapsed && <span className="truncate tracking-wide text-[13px] font-medium">{item.label}</span>}
                </div>

                {/* Badges & Arrows */}
                {!isCollapsed && (
                  <div className="flex items-center gap-2 z-10">
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm ${item.badgeColor || 'bg-emerald-500'}`}>
                        {item.badge}
                      </span>
                    )}
                    {item.subItems && (
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-emerald-600' : ''}`} />
                    )}
                  </div>
                )}
                
                {/* Collapsed Mode Badge Indicator (Dot) */}
                {isCollapsed && item.badge && (
                   <div className={`absolute top-2 right-3.5 h-2 w-2 rounded-full ${item.badgeColor || 'bg-emerald-500'} shadow-sm`}></div>
                )}

                {/* Tooltip for Collapsed State */}
                {isCollapsed && hoveredItem === item.label && (
                  <div className="absolute left-[68px] bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                    {item.label}
                  </div>
                )}
              </button>

              {/* Sub Items */}
              {!isCollapsed && item.subItems && isExpanded && (
                <div className="mt-1 space-y-0.5 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300">
                  {item.subItems.map((sub, subIdx) => {
                     const isSubActive = isActive(sub.path);
                     return (
                        <button
                          key={subIdx}
                          onClick={() => handleNavigation(sub.path)}
                          className={`
                            w-full flex items-center justify-between pl-11 pr-3 py-2 rounded-lg text-xs transition-all duration-200 border border-transparent relative group/sub
                            ${isSubActive 
                              ? 'text-emerald-700 bg-emerald-50/50 border-emerald-200 font-medium' 
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-200'}
                          `}
                        >
                          <span className="truncate flex items-center gap-2">
                            <div className={`h-1 w-1 rounded-full ${isSubActive ? 'bg-emerald-600' : 'bg-gray-400 group-hover/sub:bg-gray-600'}`}></div>
                            {sub.label}
                          </span>
                          {sub.badge && (
                            <span className={`h-5 w-5 rounded-md ${sub.badgeColor || 'bg-red-500'} flex items-center justify-center text-[9px] font-bold text-white shadow-sm`}>{sub.badge}</span>
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
      <div className="border-t border-gray-200 bg-gray-50/50 p-2.5 space-y-1.5 shrink-0">
        
        {/* Settings */}
        <button 
           onClick={() => router.push('/dashboard/sme/settings')}
           onMouseEnter={() => isCollapsed && setHoveredItem('Settings')}
           onMouseLeave={() => isCollapsed && setHoveredItem(null)}
           className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-all relative border border-transparent hover:border-gray-200 group ${isCollapsed ? 'justify-center' : ''}`}
        >
           <Settings className="h-4.5 w-4.5 group-hover:rotate-90 transition-transform duration-300" />
           {!isCollapsed && <span className="text-xs">Settings</span>}
           {isCollapsed && hoveredItem === 'Settings' && (
              <div className="absolute left-[68px] bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl z-50">Settings</div>
           )}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-white border border-gray-200 hover:border-emerald-200 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
          >
             <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg group-hover:shadow-emerald-500/30 transition-shadow text-xs">
               MK
             </div>
             {!isCollapsed && (
               <div className="flex-1 text-left overflow-hidden">
                 <p className="text-xs font-bold text-gray-900 truncate">Deep Jain</p>
                 <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider truncate">Admin</p>
               </div>
             )}
             {!isCollapsed && <ChevronDown className={`h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-all ${userMenuOpen ? 'rotate-180' : ''}`} />}
          </button>
          
          {/* Profile Dropdown */}
          {userMenuOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all border border-transparent hover:border-gray-200">
                <User className="h-4 w-4" /> View Profile
              </button>
              <div className="h-px bg-gray-200 my-1 mx-2"></div>
              <button 
                onClick={() => router.push('/')}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-200"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
