
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import { Bell, User, Search } from 'lucide-react';

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Intelligent Sidebar that adapts to the route */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 glass-panel border-b border-border/40 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center w-1/3">
             <div className="relative w-full max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <input 
                type="text" 
                placeholder="Search invoices, GSTINs, or reports..." 
                className="w-full bg-secondary/50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
               />
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-secondary/80 transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-emerald-800 flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
        </header>
        
        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
