import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does the AI answer my business calls?",
      answer: "Our voice AI greets callers in a natural, professional tone. It introduces your business, understands the purpose of the call, and takes the right action—whether that’s answering questions, collecting details, or booking an appointment."
    },
    {
      question: "Can I customize how it answers for my business?",
      answer: "Absolutely. You can tailor the greeting, business introduction, questions asked to callers, and how different types of inquiries should be handled. Your assistant speaks exactly the way you want it to."
    },
    {
      question: "What happens after the AI takes a call?",
      answer: "After every call, you’ll receive a clean summary with the key details. If an appointment was made, it’s added directly to your connected calendar. All call recordings, transcripts, and summaries stay organized in your dashboard."
    },
    {
      question: "Do I need to change my business phone number?",
      answer: "Not at all. You can keep your existing number. Simply forward calls to your AI assistant whenever you want it to answer—after hours, when busy, or all the time. Your customers experience a smooth, seamless transition."
    },
    {
      question: "Can the AI handle multiple calls at once?",
      answer: "Yes. Unlike a human receptionist, the system can manage several calls at the same time—up to 20 depending on your plan. No missed calls, even during peak hours."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white" id="faq">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24">
          
          {/* Left Column - Sticky Header */}
          <div className="lg:col-span-5">
            <RevealOnScroll>
              <div className="lg:sticky lg:top-32">
                <span className="text-brand-600 font-bold tracking-widest uppercase text-xs mb-3 block">FAQ</span>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
                  Frequently Asked <br/><span className="text-gradient">Questions</span>
                </h2>
                <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-12 leading-relaxed">
                  Everything you need to know about using our AI receptionist for your business.
                </p>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right Column - Accordion Items */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {faqs.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                    <RevealOnScroll key={index} delay={index * 100}>
                      <div 
                          onClick={() => toggleFAQ(index)}
                          className={`border rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden ${
                              isOpen 
                              ? 'bg-brand-50/30 border-brand-200 shadow-sm' 
                              : 'bg-white border-gray-100 hover:border-gray-200'
                          }`}
                      >
                          <div className="p-5 md:p-6 flex justify-between items-center gap-4">
                              <h3 className={`text-base md:text-lg font-bold transition-colors ${isOpen ? 'text-brand-800' : 'text-gray-900'}`}>
                                  {item.question}
                              </h3>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? 'bg-brand-100 text-brand-600' : 'bg-gray-50 text-gray-400'}`}>
                                  {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                              </div>
                          </div>
                          <div 
                              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                              }`}
                          >
                              <div className="overflow-hidden">
                                  <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0 text-gray-600 leading-relaxed text-sm md:text-base">
                                      {item.answer}
                                  </div>
                              </div>
                          </div>
                      </div>
                    </RevealOnScroll>
                );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};

export default FAQ;