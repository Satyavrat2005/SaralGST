'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  Send,
  FileText,
  X
} from 'lucide-react';
import GlassPanel from '../../../../../components/ui/GlassPanel';
import BentoCard from '../../../../../components/ui/BentoCard';

export default function VendorRemindersPage() {
  const [step, setStep] = useState(1);
  const [reminderType, setReminderType] = useState<'missing' | 'filing' | 'discrepancy' | null>(null);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      // Navigate back or show success
      alert('Reminders Sent!');
      router.push('/dashboard/sme/vendors/list');
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold text-white">Send Reminders</h1>
         <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className={step >= 1 ? 'text-primary' : ''}>1. Select Type</span>
            <ChevronRight className="h-4 w-4" />
            <span className={step >= 2 ? 'text-primary' : ''}>2. Select Vendors</span>
            <ChevronRight className="h-4 w-4" />
            <span className={step >= 3 ? 'text-primary' : ''}>3. Customize</span>
            <ChevronRight className="h-4 w-4" />
            <span className={step >= 4 ? 'text-primary' : ''}>4. Review</span>
         </div>
      </div>

      {/* Step 1: Select Type */}
      {step === 1 && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div 
               className={`p-6 rounded-xl border cursor-pointer transition-all ${reminderType === 'missing' ? 'bg-primary/10 border-primary' : 'bg-zinc-900/50 border-white/10 hover:border-primary/50'}`}
               onClick={() => setReminderType('missing')}
            >
               <div className="h-12 w-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-bold text-white">Missing Invoices</h3>
               <p className="text-sm text-zinc-400 mt-2">Send reminders for invoices present in GSTR-2B but missing in your books.</p>
               <div className="mt-4 inline-block px-2 py-1 rounded bg-zinc-800 text-xs text-white">34 Vendors</div>
            </div>

            <div 
               className={`p-6 rounded-xl border cursor-pointer transition-all ${reminderType === 'filing' ? 'bg-primary/10 border-primary' : 'bg-zinc-900/50 border-white/10 hover:border-primary/50'}`}
               onClick={() => setReminderType('filing')}
            >
               <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-bold text-white">GSTR-1 Not Filed</h3>
               <p className="text-sm text-zinc-400 mt-2">Notify vendors who haven't filed GSTR-1 yet, putting your ITC at risk.</p>
               <div className="mt-4 inline-block px-2 py-1 rounded bg-zinc-800 text-xs text-white">12 Vendors</div>
            </div>

            <div 
               className={`p-6 rounded-xl border cursor-pointer transition-all ${reminderType === 'discrepancy' ? 'bg-primary/10 border-primary' : 'bg-zinc-900/50 border-white/10 hover:border-primary/50'}`}
               onClick={() => setReminderType('discrepancy')}
            >
               <div className="h-12 w-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-bold text-white">Discrepancies</h3>
               <p className="text-sm text-zinc-400 mt-2">Request vendors to amend invoices with amount mismatches.</p>
               <div className="mt-4 inline-block px-2 py-1 rounded bg-zinc-800 text-xs text-white">5 Vendors</div>
            </div>
         </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-end mt-8">
         {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-2 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5 mr-4">Back</button>
         )}
         {step < 4 && (
            <button 
               onClick={() => setStep(s => s + 1)} 
               disabled={!reminderType}
               className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               Next
            </button>
         )}
         {step === 4 && (
            <button 
               onClick={handleSend}
               className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
               <Send className="h-4 w-4" /> Send Reminders Now
            </button>
         )}
      </div>

      {/* Sending Modal */}
      {isSending && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <GlassPanel className="p-8 w-96 text-center">
               <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-primary animate-pulse" />
               </div>
               <h3 className="text-xl font-bold text-white">Sending Reminders...</h3>
               <p className="text-zinc-400 text-sm mt-2">Please wait while we dispatch messages via WhatsApp and Email.</p>
            </GlassPanel>
         </div>
      )}
    </div>
  );
}
