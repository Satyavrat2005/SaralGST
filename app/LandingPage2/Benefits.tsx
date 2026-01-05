import React from 'react';
import RevealOnScroll from './RevealOnScroll';

const Benefits: React.FC = () => {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white mb-8 md:mb-12">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-10 md:mb-12 max-w-2xl">
            Four ways we make your <br/>
            Business <span className="text-brand-600">Better</span>
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[600px]">
          
          {/* Card 1: Large Left - Primary Gradient with Video */}
          <div className="md:col-span-1 md:row-span-2 h-[350px] md:h-auto">
            <RevealOnScroll className="h-full">
              <div className="overflow-hidden relative group benefit-card-primary h-full">
                {/* Video Background */}
                <video
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="/ai-receptionist-demo.mp4" type="video/mp4" />
                </video>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-700/95 via-brand-600/70 to-brand-500/40"></div>
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                  <div className="relative z-10">
                      <h3 className="text-white text-xl md:text-2xl font-bold mb-3">Always there to answer your calls</h3>
                      <p className="text-white/90 text-xs md:text-sm leading-relaxed">
                        Calls are answered promptly and professionally even when you're busy
                      </p>
                  </div>
                  {/* Abstract decorative circle */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right Column Grid */}
          <div className="md:col-span-2 md:row-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 2: Wide Top Right - Secondary Gradient with GIF */}
            <div className="md:col-span-2 h-[280px] md:h-auto">
              <RevealOnScroll delay={100} className="h-full">
                <div className="benefit-card-secondary p-6 md:p-8 flex flex-row items-center justify-between relative overflow-hidden h-full">
                  {/* Text Content - Left Side */}
                  <div className="relative z-10 max-w-sm md:max-w-md flex-shrink-0">
                    <h3 className="text-gray-900 text-xl md:text-2xl font-bold mb-3">Takes meaningful actions</h3>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                      Schedules appointments, provides information, and delivers clean summaries to your inbox
                    </p>
                  </div>
                  {/* GIF - Right Side */}
                  <div className="hidden md:flex items-center justify-center flex-1 pl-6">
                    <div className="relative w-full max-w-[280px] h-[180px] rounded-xl overflow-hidden shadow-lg border border-gray-100/50 bg-white/50">
                      <img 
                        src="/actions-demo.gif" 
                        alt="AI taking actions demo"
                        className="w-full h-full object-cover object-center"
                      />
                      {/* Subtle overlay to blend with card */}
                      <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/20 pointer-events-none"></div>
                    </div>
                  </div>
                  {/* Mobile GIF - Below text on small screens */}
                  <div className="absolute bottom-4 right-4 md:hidden w-24 h-16 rounded-lg overflow-hidden shadow-md border border-gray-100/50 opacity-60">
                    <img 
                      src="/actions-demo.gif" 
                      alt="AI taking actions demo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* Card 3: Bottom Left of Right Col - Secondary Gradient with Image */}
            <div className="h-[280px] md:h-auto">
              <RevealOnScroll delay={200} className="h-full">
                <div className="benefit-card-secondary p-6 md:p-8 flex flex-col justify-between h-full relative overflow-hidden">
                  {/* Image at top */}
                  <div className="relative w-full h-28 md:h-32 rounded-xl overflow-hidden mb-4 shadow-sm border border-gray-100/30">
                    <img 
                      src="/intelligent-listening.png" 
                      alt="Intelligent AI listening"
                      className="w-full h-full object-cover object-center"
                    />
                    {/* Subtle gradient overlay to blend */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent pointer-events-none"></div>
                  </div>
                  {/* Text at bottom */}
                  <div className="relative z-10">
                    <h3 className="text-gray-900 text-lg md:text-xl font-bold mb-2">Intelligent listening</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      Smart voice AI that knows what callers want and responds naturally
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* Card 4: Bottom Right of Right Col - Secondary Gradient with Image */}
            <div className="h-[280px] md:h-auto">
              <RevealOnScroll delay={300} className="h-full">
                <div className="benefit-card-secondary p-6 md:p-8 flex flex-col justify-between h-full relative overflow-hidden">
                  {/* Image at top */}
                  <div className="relative w-full h-28 md:h-32 rounded-xl overflow-hidden mb-4 shadow-sm border border-gray-100/30">
                    <img 
                      src="/high-call-volume.png" 
                      alt="Handling high call volume"
                      className="w-full h-full object-cover object-center"
                    />
                    {/* Subtle gradient overlay to blend */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent pointer-events-none"></div>
                  </div>
                  {/* Text at bottom */}
                  <div className="relative z-10">
                    <h3 className="text-gray-900 text-lg md:text-xl font-bold mb-2">Handles high call volume</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      Whether it's one or twenty, every caller gets immediate attention.
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default Benefits;