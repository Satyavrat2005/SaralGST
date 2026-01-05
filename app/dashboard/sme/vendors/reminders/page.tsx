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
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-3">
             <Send className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
             <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Send Reminders</span>
           </div>
           <h1 className="text-2xl font-bold text-gray-900">Vendor Reminders</h1>
         </div>
         <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className={step >= 1 ? 'text-emerald-600 font-semibold' : ''}>1. Select Type</span>
            <ChevronRight className="h-4 w-4" />
            <span className={step >= 2 ? 'text-emerald-600 font-semibold' : ''}>2. Select Vendors</span>
            <ChevronRight className="h-4 w-4" />
            <span className={step >= 3 ? 'text-emerald-600 font-semibold' : ''}>3. Customize</span>
            <ChevronRight className="h-4 w-4" />
            <span className={step >= 4 ? 'text-emerald-600 font-semibold' : ''}>4. Review</span>
         </div>
      </div>

      {/* Step 1: Select Type */}
      {step === 1 && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div 
               className={`p-6 rounded-2xl border cursor-pointer transition-all shadow-lg ${reminderType === 'missing' ? 'bg-emerald-50 border-emerald-300 shadow-emerald-200' : 'bg-white border-gray-200 hover:border-emerald-200 hover:shadow-xl'}`}
               onClick={() => setReminderType('missing')}
            >
               <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center mb-4 shadow-lg">
                  <FileText className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-bold text-gray-900">Missing Invoices</h3>
               <p className="text-sm text-gray-600 mt-2">Send reminders for invoices present in GSTR-2B but missing in your books.</p>
               <div className="mt-4 inline-block px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-900 font-semibold border border-gray-200">34 Vendors</div>
            </div>

            <div 
               className={`p-6 rounded-2xl border cursor-pointer transition-all shadow-lg ${reminderType === 'filing' ? 'bg-emerald-50 border-emerald-300 shadow-emerald-200' : 'bg-white border-gray-200 hover:border-emerald-200 hover:shadow-xl'}`}
               onClick={() => setReminderType('filing')}
            >
               <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center mb-4 shadow-lg">
                  <Calendar className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-bold text-gray-900">GSTR-1 Not Filed</h3>
               <p className="text-sm text-gray-600 mt-2">Notify vendors who haven't filed GSTR-1 yet, putting your ITC at risk.</p>
               <div className="mt-4 inline-block px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-900 font-semibold border border-gray-200">12 Vendors</div>
            </div>

            <div 
               className={`p-6 rounded-2xl border cursor-pointer transition-all shadow-lg ${reminderType === 'discrepancy' ? 'bg-emerald-50 border-emerald-300 shadow-emerald-200' : 'bg-white border-gray-200 hover:border-emerald-200 hover:shadow-xl'}`}
               onClick={() => setReminderType('discrepancy')}
            >
               <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white flex items-center justify-center mb-4 shadow-lg">
                  <AlertTriangle className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-bold text-gray-900">Discrepancies</h3>
               <p className="text-sm text-gray-600 mt-2">Request vendors to amend invoices with amount mismatches.</p>
               <div className="mt-4 inline-block px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-900 font-semibold border border-gray-200">5 Vendors</div>
            </div>
         </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-end mt-8">
         {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-sm mr-4 font-medium transition-all">Back</button>
         )}
         {step < 4 && (
            <button 
               onClick={() => setStep(s => s + 1)} 
               disabled={!reminderType}
               className="btn-primary-custom px-6 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all"
            >
               Next
            </button>
         )}
         {step === 4 && (
            <button 
               onClick={handleSend}
               className="btn-primary-custom px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
            >
               <Send className="h-4 w-4" /> Send Reminders Now
            </button>
         )}
      </div>

      {/* Sending Modal */}
      {isSending && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-8 w-96 text-center">
               <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-emerald-600 animate-pulse" />
               </div>
               <h3 className="text-xl font-bold text-gray-900">Sending Reminders...</h3>
               <p className="text-gray-600 text-sm mt-2">Please wait while we dispatch messages via WhatsApp and Email.</p>
            </div>
         </div>
      )}
    </div>
    </div>
  );
}
