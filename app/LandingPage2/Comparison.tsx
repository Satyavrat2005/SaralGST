import React from 'react';
import { XCircle, CheckCircle, Smartphone, Voicemail } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const Comparison: React.FC = () => {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-10 md:mb-16">
             <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-4 md:mb-6">
              Why an AI receptionist outperforms <br/>
              <span className="text-gradient">traditional voicemail</span>—every single time.
             </h2>
          </div>
        </RevealOnScroll>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
           {/* Traditional Voicemail */}
           <RevealOnScroll delay={100} className="h-full">
             <div 
                className="h-full rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden group border border-gray-100"
                style={{ background: 'linear-gradient(145deg, #FFFFFF 0%, #F3F4F6 100%)' }}
             >
                <div className="relative z-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6 text-red-500">
                        <Voicemail size={28} className="md:w-8 md:h-8" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Traditional Voicemail</h3>
                    <p className="text-red-600 font-bold uppercase tracking-wide text-xs mb-6 md:mb-8">Outdated & Ineffective</p>
                    
                    <ul className="space-y-4 md:space-y-6 mb-8 md:mb-10">
                        {[
                            "Most callers hang up the moment voicemail starts — meaning lost business",
                            "No way to flag or prioritize urgent situations",
                            "No information captured — you'll need to call back to understand the issue",
                            "Customers feel ignored and often turn to competitors",
                            "Cannot schedule appointments or provide basic information"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 md:gap-4">
                                <div className="mt-1 flex-shrink-0 text-red-500/80">
                                    <XCircle size={18} className="md:w-5 md:h-5" />
                                </div>
                                <span className="text-gray-600 text-sm leading-relaxed font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 mt-auto shadow-sm">
                        <span className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Result</span>
                        <p className="text-gray-800 font-bold leading-snug text-sm md:text-base">Missed opportunities, frustrated customers, and slow response times.</p>
                    </div>
                </div>
             </div>
           </RevealOnScroll>

           {/* AI Receptionist */}
           <RevealOnScroll delay={300} className="h-full">
             <div 
                className="h-full rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden shadow-xl shadow-brand-100/50 border border-brand-100/20"
                style={{ background: 'linear-gradient(128deg, #D5C5FF -12.24%, #F8F6FE 98.94%)' }}
             >
                <div className="relative z-10 h-full flex flex-col">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-brand-600">
                        <Smartphone size={28} className="md:w-8 md:h-8" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">AskJohnny AI</h3>
                    <p className="text-brand-600 font-bold uppercase tracking-wide text-xs mb-6 md:mb-8">Smart & Professional</p>
                    
                    <ul className="space-y-4 md:space-y-6 mb-8 md:mb-10">
                        {[
                            "Every call answered instantly with a natural, human-like conversation",
                            "Detects emergencies and sends immediate alerts when needed",
                            "Collects detailed information so you're fully prepared before responding",
                            "Customers get fast, friendly responses — any time of day",
                            "Can schedule appointments, provide estimates, and answer common questions"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 md:gap-4">
                                <div className="mt-1 flex-shrink-0 text-brand-600">
                                    <CheckCircle size={18} className="md:w-5 md:h-5" />
                                </div>
                                <span className="text-gray-800 text-sm leading-relaxed font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>

                     <div className="bg-white/60 border border-brand-200 rounded-2xl p-5 md:p-6 backdrop-blur-md mt-auto shadow-sm">
                        <span className="block text-xs font-bold text-brand-700 uppercase tracking-wider mb-2">Result</span>
                        <p className="text-gray-900 font-bold leading-snug text-sm md:text-base">Happier customers, more booked jobs, and consistent business growth.</p>
                    </div>
                </div>
             </div>
           </RevealOnScroll>
        </div>
      </div>
    </section>
  );
};

export default Comparison;