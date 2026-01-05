import React from 'react';
import { Phone, Mail } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const SupportCTA: React.FC = () => {
  return (
    <section className="py-8 md:py-10 px-4 sm:px-6 lg:px-8 bg-white mb-8 md:mb-12">
      <RevealOnScroll>
        <div className="max-w-7xl mx-auto relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-[#F4F3FE] via-[#F8F5FC] to-[#F1EAFF] border border-white shadow-xl shadow-brand-100/50">
          
          {/* Decorative Background Blur */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-200/20 rounded-full blur-[100px]"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[100px]"></div>
          </div>

          <div className="relative z-10 px-6 py-12 md:px-8 md:py-20 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs md:text-sm font-bold tracking-wide uppercase mb-4 md:mb-6">
                  Business Support
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight">
                  Still have <span className="text-gradient">questions?</span>
              </h2>
              
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
                  Our support team is here to help you understand how the AI can fit your business needs. 
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button className="btn-primary-custom px-6 py-3 md:px-8 md:py-4 text-sm md:text-base font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 w-full sm:w-auto justify-center">
                      <Phone size={18} className="md:w-5 md:h-5" />
                      Schedule a Call
                  </button>
                  <button className="px-6 py-3 md:px-8 md:py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold flex items-center gap-2 hover:bg-gray-50 transition-all hover:border-gray-300 text-sm md:text-base w-full sm:w-auto justify-center">
                      <Mail size={18} className="md:w-5 md:h-5" />
                      Email Support
                  </button>
              </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
};

export default SupportCTA;