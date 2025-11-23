'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import GlassPanel from '../../../components/ui/GlassPanel';
import BentoCard from '../../../components/ui/BentoCard';
import { Construction, ArrowRight } from 'lucide-react';

export default function GenericPage() {
  const pathname = usePathname();
  
  // Extract readable title from path
  const pathSegments = pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  const title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
  const category = pathSegments[pathSegments.length - 2]?.charAt(0).toUpperCase() + pathSegments[pathSegments.length - 2]?.slice(1).replace(/-/g, ' ');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          Dashboard <ArrowRight className="h-3 w-3" /> SME <ArrowRight className="h-3 w-3" /> {category}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassPanel className="p-6 md:col-span-2 min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
           <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center">
             <Construction className="h-8 w-8 text-muted-foreground" />
           </div>
           <div>
             <h2 className="text-xl font-semibold text-white">Under Construction</h2>
             <p className="text-muted-foreground max-w-md mt-2">
               The <span className="text-primary font-medium">{title}</span> module is currently being built based on your specifications.
             </p>
           </div>
        </GlassPanel>

        <div className="space-y-6">
          <BentoCard title="Quick Info">
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-xs font-medium px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Development</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Priority</span>
                <span className="text-sm text-white">High</span>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
