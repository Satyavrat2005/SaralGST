import React, { useState } from 'react';
import { Scale, Home, Utensils, HardHat, Car, Wrench, Hotel, Scissors, ArrowRight, X } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const Industries: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  // Industry content data - structured like askbenny.ca
  const industryContent = {
    Legal: {
      title: "Lawyers & Legal Firms",
      benefits: [
        "Never miss a potential client call again",
        "Instantly qualify leads from phone inquiries", 
        "Automate appointment booking for consultations",
        "Track every lead source and follow-up needed",
        "Convert more calls into paying clients"
      ],
      stats: [
        "94% call answer rate",
        "3x more consultations booked", 
        "47% increase in client conversions"
      ]
    },
    'Real Estate': {
      title: "Real Estate Agents & Brokers",
      benefits: [
        "Capture every property inquiry instantly",
        "Qualify buyers and sellers automatically", 
        "Schedule viewings without back-and-forth",
        "Never lose a hot lead to voicemail",
        "Track which listings generate most calls"
      ],
      stats: [
        "89% lead capture rate",
        "2.8x faster response times",
        "62% more showings booked"
      ]
    },
    Restaurant: {
      title: "Restaurants & Cafes",
      benefits: [
        "Handle peak hour reservation calls effortlessly",
        "Instant table availability updates", 
        "Capture catering and event inquiries",
        "Reduce no-shows with SMS confirmations",
        "Upsell specials during every reservation call"
      ],
      stats: [
        "92% reservation capture",
        "41% increase in bookings",
        "28% higher table turnover"
      ]
    },
    Construction: {
      title: "Construction & Contractors",
      benefits: [
        "Quote requests answered within 30 seconds",
        "Job site visit scheduling automated", 
        "Material and service inquiries captured",
        "Follow-up reminders for bid proposals",
        "Track which jobs came from phone leads"
      ],
      stats: [
        "87% quote request capture",
        "3.2x more site visits",
        "55% faster project starts"
      ]
    },
    Automotive: {
      title: "Auto Repair & Dealerships",
      benefits: [
        "Service appointment booking 24/7",
        "Emergency repair calls never missed", 
        "Appointment reminders reduce no-shows",
        "Track service history from first call",
        "Upsell maintenance packages automatically"
      ],
      stats: [
        "95% appointment capture",
        "39% no-show reduction",
        "67% higher service revenue"
      ]
    },
    Services: {
      title: "Home Services & Trades",
      benefits: [
        "Emergency service calls answered instantly",
        "Same-day service bookings automated", 
        "Quote requests captured and followed up",
        "Service area verification on every call",
        "Repeat customer scheduling streamlined"
      ],
      stats: [
        "91% emergency call capture",
        "4x more same-day bookings",
        "52% customer retention boost"
      ]
    },
    Hospitality: {
      title: "Hotels & Hospitality",
      benefits: [
        "24/7 reservation handling without staff",
        "Room availability updates in real-time", 
        "Group booking and event inquiries captured",
        "Cancellation policy explained automatically",
        "Upsell room upgrades and packages"
      ],
      stats: [
        "93% reservation capture",
        "36% increase in direct bookings",
        "Direct channel revenue +44%"
      ]
    },
    Beauty: {
      title: "Salons & Beauty Services",
      benefits: [
        "Appointment booking around the clock",
        "Service availability shown instantly", 
        "Cancellation list management automated",
        "Client preference notes captured",
        "Gift certificate and package sales boosted"
      ],
      stats: [
        "96% appointment capture",
        "33% increase in bookings",
        "29% higher client retention"
      ]
    }
  };

  // Modal component - NO SCROLLBAR ANYWHERE
  const IndustryModal = ({ industry, onClose }: { industry: string; onClose: () => void }) => {
    const content = industryContent[industry as keyof typeof industryContent];
    return (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 scrollbar-none"
        onClick={onClose}
      >
        <div 
          className="bg-white/90 backdrop-blur-xl rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-white/20 scrollbar-none"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-8 pb-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {content.title}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
              </button>
            </div>
          </div>

          {/* Scrollable Content - ONLY this scrolls, with custom scrollbar hidden */}
          <div className="flex-1 p-8 space-y-8 overflow-y-auto scrollbar-hide  scrollbar-hide max-h-[60vh] max-w-2xl">
            {/* Benefits */}
            <div className="scrollbar-hide">
              <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Scale className="w-6 h-6 text-brand-600" />
                How it helps your business
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 scrollbar-hide">
                {content.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 hover:shadow-md transition-all duration-200 group">
                    <div className="w-2 h-2 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full mt-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-800 leading-relaxed group-hover:text-gray-900">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-8 rounded-3xl border border-emerald-100">
  <h4 className="text-xl font-semibold text-gray-900 mb-6">
    Proven Results
  </h4>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {content.stats.map((stat, i) => (
      <div
        key={i}
        className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm border border-emerald-100 flex flex-col items-center justify-center text-center"
      >
        <div className="text-xs uppercase tracking-wide text-emerald-600 mb-1">
          Result {i + 1}
        </div>
        <div className="text-xl font-semibold text-emerald-700">
          {stat}
        </div>
        <div className="text-[11px] text-gray-500 mt-1">
          Proven with real customers
        </div>
      </div>
    ))}
  </div>
</div>

          </div>

          {/* CTA Button - Fixed footer */}
          <div className="p-6  flex-shrink-0">
            <button className="w-[20vw] h-[8vh] btn-primary-custom flex items-center justify-center gap-3 mx-auto">
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </button>            
          </div>
        </div>
      </div>
    );
  };

  const handleCardClick = (label: string) => {
    setSelectedIndustry(label);
  };

  const industries = [
    { icon: Scale, label: 'Legal' },
    { icon: Home, label: 'Real Estate' },
    { icon: Utensils, label: 'Restaurant' },
    { icon: HardHat, label: 'Construction' },
    { icon: Car, label: 'Automotive' },
    { icon: Wrench, label: 'Services' },
    { icon: Hotel, label: 'Hospitality' },
    { icon: Scissors, label: 'Beauty' },
  ];

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white relative">
      <div className=" mx-auto text-left">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-10 md:mb-12 text-center">
            Made for businesses where<br />
            Every call <span className="text-brand-600">Matters</span>
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {industries.map((item, index) => {
            const isStyle1 = index % 2 === 0;
            const cardClass = isStyle1 ? 'industry-card-1' : 'industry-card-2';
            const gradientId = `industry-gradient-${index}`;
            const gradientColors = isStyle1
              ? { start: '#5F488D', end: '#362951' }
              : { start: '#918799', end: '#524C56' };

            const iconSVGs = [
              // Scale
              <svg key={`scale-${index}`} width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 md:w-20 md:h-20">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={gradientColors.start} />
                    <stop offset="100%" stopColor={gradientColors.end} />
                  </linearGradient>
                </defs>
                <path d="M12 3v18" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m19 8 3 8a5 5 0 0 1-6 0zV7" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m5 8 3 8a5 5 0 0 1-6 0zV7" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 21h10" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>,
              // Home
              <svg key={`home-${index}`} width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 md:w-20 md:h-20">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={gradientColors.start} />
                    <stop offset="100%" stopColor={gradientColors.end} />
                  </linearGradient>
                </defs>
                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>,
              // Utensils
              <svg key={`utensils-${index}`} width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 md:w-20 md:h-20">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={gradientColors.start} />
                    <stop offset="100%" stopColor={gradientColors.end} />
                  </linearGradient>
                </defs>
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 2v20" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>,
              // HardHat
              <svg key={`hardhat-${index}`} width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 md:w-20 md:h-20">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={gradientColors.start} />
                    <stop offset="100%" stopColor={gradientColors.end} />
                  </linearGradient>
                </defs>
                <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 6a6 6 0 0 1 6 6v3" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 15v-3a6 6 0 0 1 6-6" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="2" y="15" width="20" height="4" rx="1" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>,
              // Car
              <svg key={`car-${index}`} width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 md:w-20 md:h-20">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={gradientColors.start} />
                    <stop offset="100%" stopColor={gradientColors.end} />
                  </linearGradient>
                </defs>
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="7" cy="17" r="2" stroke={`url(#${gradientId})`} strokeWidth="2" />
                <path d="M9 17h6" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="17" cy="17" r="2" stroke={`url(#${gradientId})`} strokeWidth="2" />
              </svg>,
              // Wrench
              <svg key={`wrench-${index}`} width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 md:w-20 md:h-20">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={gradientColors.start} />
                    <stop offset="100%" stopColor={gradientColors.end} />
                  </linearGradient>
                </defs>
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>,
              // Hotel
              <svg key={`hotel-${index}`} width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 md:w-20 md:h-20">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={gradientColors.start} />
                    <stop offset="100%" stopColor={gradientColors.end} />
                  </linearGradient>
                </defs>
                <path d="M10 22v-6.57" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 11h.01" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 7h.01" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 15.43V22" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 16a5 5 0 0 0-6 0" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 11h.01" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 7h.01" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 11h.01" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 7h.01" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="4" y="2" width="16" height="20" rx="2" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>,
              // Scissors
              <svg key={`scissors-${index}`} width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 md:w-20 md:h-20">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={gradientColors.start} />
                    <stop offset="100%" stopColor={gradientColors.end} />
                  </linearGradient>
                </defs>
                <circle cx="6" cy="6" r="3" stroke={`url(#${gradientId})`} strokeWidth="2" />
                <path d="M8.12 8.12 12 12" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 4 8.12 15.88" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="18" r="3" stroke={`url(#${gradientId})`} strokeWidth="2" />
                <path d="M14.8 14.8 20 20" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ];

            return (
              <RevealOnScroll key={index} delay={index * 50}>
                <div
                  className={`aspect-square rounded-[1.5rem] md:rounded-[2rem] flex flex-col gap-4 items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer group ${cardClass} relative overflow-hidden`}
                  onClick={() => handleCardClick(item.label)}
                >
                  <div className="p-2 md:p-4 z-10 relative">
                    {iconSVGs[index]}
                  </div>
                  {/* Click prompt overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                    <div className="text-white text-xs font-semibold px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                      Click to learn more
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
      
      {/* Modal */}
      {selectedIndustry && (
        <IndustryModal 
          industry={selectedIndustry} 
          onClose={() => setSelectedIndustry(null)} 
        />
      )}
    </section>
  );
};

export default Industries;
