import React from 'react';
import { Check } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const Pricing: React.FC = () => {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50" id="pricing">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Choose Your <span className="text-brand-600">Plan</span></h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Select the plan that best fits your business needs. No hidden fees, cancel anytime.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto items-start">
          
          {/* Starter Plan */}
          <RevealOnScroll className="h-full">
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col relative h-full">
              <div className="mb-6 md:mb-8">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Starter</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl md:text-5xl font-bold text-gray-900">$49</span>
                      <span className="text-gray-500 font-medium">CAD / mo</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">150 minutes included • $0.40/extra min</p>
              </div>

              <div className="bg-green-50 text-green-700 text-xs md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-xl w-fit mb-6 md:mb-8 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span>
                  First 7 days FREE
              </div>

              <div className="flex-1 space-y-4 md:space-y-5 mb-8 md:mb-10">
                  {[
                      "Message taking with custom questions",
                      "Smart spam detection",
                      "Up to 10 calls simultaneously",
                      "Email and SMS notifications",
                      "Call forwarding",
                      "Appointment scheduling",
                      "Basic multilingual (En, Fr)",
                      "Call analytics dashboard"
                  ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                          <div className="mt-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Check size={10} className="text-gray-600 md:w-3 md:h-3" />
                          </div>
                          <span className="text-gray-600 text-sm leading-relaxed">{feature}</span>
                      </div>
                  ))}
              </div>

              <button className="w-full py-3 md:py-4 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm md:text-base">
                  Get Started
              </button>
            </div>
          </RevealOnScroll>

          {/* Business PRO Plan */}
          <RevealOnScroll delay={200} className="h-full">
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border-2 border-brand-500 shadow-xl shadow-brand-100 relative flex flex-col h-full transform md:-translate-y-2">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#A47CF3] text-white px-4 py-1 md:px-6 md:py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wide uppercase shadow-md whitespace-nowrap">
                  Most Popular
              </div>

              <div className="mb-6 md:mb-8 mt-2">
                  <h3 className="text-lg md:text-xl font-bold text-brand-600 mb-2">Business PRO</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl md:text-5xl font-bold text-gray-900">$99</span>
                      <span className="text-gray-500 font-medium">CAD / mo</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">300 minutes included • $0.35/extra min</p>
              </div>

              <div className="bg-brand-50 text-brand-700 text-xs md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-xl w-fit mb-6 md:mb-8 flex items-center gap-2 border border-brand-100">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-500 animate-pulse"></span>
                  First 7 days FREE
              </div>

              <div className="flex-1 space-y-4 md:space-y-5 mb-8 md:mb-10">
                  {[
                      "Message taking with custom questions",
                      "Smart spam detection",
                      "Up to 20 calls simultaneously",
                      "Email and SMS notifications",
                      "Call forwarding to staff/depts",
                      "Appointment Links for scheduling",
                      "30+ languages including Fr & Sp",
                      "Advanced analytics & insights"
                  ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                          <div className="mt-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                              <Check size={10} className="text-brand-600 md:w-3 md:h-3" />
                          </div>
                          <span className="text-gray-800 text-sm font-medium leading-relaxed">{feature}</span>
                      </div>
                  ))}
              </div>

              <button className="btn-primary-custom w-full py-3 md:py-4 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-sm md:text-base">
                  Get Business PRO
              </button>
            </div>
          </RevealOnScroll>

        </div>
      </div>
    </section>
  );
};

export default Pricing;