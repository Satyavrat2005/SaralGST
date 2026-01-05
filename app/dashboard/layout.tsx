'use client';

import React from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { Bell, User, Search } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 text-gray-900 overflow-hidden">
      {/* Intelligent Sidebar that adapts to the route */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
       
        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
